import os
from google import genai
from pydantic import BaseModel
from typing import List, Optional, Dict
from dotenv import load_dotenv
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

load_dotenv()


class TimetableEntry(BaseModel):
    id: int
    day_of_week: str
    subject: str
    teacher: Optional[str]
    start_time: str
    end_time: str
    room_number: Optional[str]


class StudentAttendanceStatus(BaseModel):
    student_reg_no: str
    status: str


class BulkAttendanceRequest(BaseModel):
    timetable_id: int
    date: str
    records: List[StudentAttendanceStatus]


class AIAdviceRequest(BaseModel):
    query: str


def init_attendance_db(conn):
    """Optional Postgres initializer. Safe to call with a Neon connection."""
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id SERIAL PRIMARY KEY,
            student_reg_no TEXT NOT NULL REFERENCES students(reg_no),
            timetable_id INTEGER NOT NULL REFERENCES timetable(id),
            date TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Cancelled')),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_reg_no, timetable_id, date)
        )
        """
    )
    conn.commit()


def fetch_student_timetable(conn, user) -> List[Dict]:
    student_year = user["year"]
    student_section = user["section"]

    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            t.id,
            t.day_of_week,
            t.subject,
            tech.name AS teacher,
            t.start_time,
            t.end_time,
            t.room_number
        FROM timetable t
        LEFT JOIN teachers tech ON t.teacher_id = tech.id
        WHERE t.year = %s AND t.section = %s
        ORDER BY
            CASE
                WHEN t.day_of_week = 'Monday' THEN 1
                WHEN t.day_of_week = 'Tuesday' THEN 2
                WHEN t.day_of_week = 'Wednesday' THEN 3
                WHEN t.day_of_week = 'Thursday' THEN 4
                WHEN t.day_of_week = 'Friday' THEN 5
                WHEN t.day_of_week = 'Saturday' THEN 6
                ELSE 7
            END,
            t.start_time
        """,
        (student_year, student_section),
    )
    return [dict(row) for row in cursor.fetchall()]


def fetch_class_roster(conn, timetable_id: int) -> Dict:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT year, section, subject FROM timetable WHERE id = %s",
        (timetable_id,),
    )
    class_info = cursor.fetchone()

    if not class_info:
        return {"error": "Timetable ID not found"}

    target_year = class_info["year"]
    target_section = class_info["section"]

    cursor.execute(
        """
        SELECT reg_no, name, email
        FROM students
        WHERE year = %s AND section = %s
        ORDER BY reg_no ASC
        """,
        (target_year, target_section),
    )

    students = [dict(row) for row in cursor.fetchall()]

    return {
        "subject": class_info["subject"],
        "year": target_year,
        "section": target_section,
        "students": students,
    }


def mark_bulk_attendance(conn, timetable_id: int, date: str, records: List[StudentAttendanceStatus]):
    cursor = conn.cursor()

    try:
        data_to_insert = [
            (record.student_reg_no, timetable_id, date, record.status)
            for record in records
        ]

        cursor.executemany(
            """
            INSERT INTO attendance_logs (student_reg_no, timetable_id, date, status)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (student_reg_no, timetable_id, date)
            DO UPDATE SET
                status = EXCLUDED.status,
                timestamp = CURRENT_TIMESTAMP
            """,
            data_to_insert,
        )

        conn.commit()
        return {"status": "success", "message": f"Marked attendance for {len(records)} students."}

    except Exception as e:
        conn.rollback()
        raise e


def calculate_attendance_stats(conn, user) -> List[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            t.subject,
            COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_count,
            COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent_count
        FROM attendance_logs a
        JOIN timetable t ON a.timetable_id = t.id
        WHERE a.student_reg_no = %s AND a.status != 'Cancelled'
        GROUP BY t.subject
        """,
        (user["reg_no"],),
    )

    stats = []
    for row in cursor.fetchall():
        total = row["present_count"] + row["absent_count"]
        pct = (row["present_count"] / total * 100) if total > 0 else 0
        stats.append(
            {
                "subject": row["subject"],
                "present": row["present_count"],
                "absent": row["absent_count"],
                "total": total,
                "percentage": round(pct, 2),
            }
        )
    return stats


def get_ai_advice(conn, user, query: str) -> str:
    stats = calculate_attendance_stats(conn, user)
    timetable = fetch_student_timetable(conn, user)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("CRITICAL ERROR: GEMINI_API_KEY not found. Check your .env file.")
        return "Chanakya is currently offline. (System Error: API Key Missing)"

    prompt = f"""
    Role: You are 'Campus Chanakya', a smart university advisor.
    User: {user['name']}
    Query: "{query}"
    Attendance Stats: {stats}
    Timetable: {timetable}

    Task: Advise the student based on their attendance.
    - Warn if attendance < 75%.
    - If asking to bunk, calculate impact.
    - Keep it under 70 words.
    - Tone: Helpful but strict about academic discipline.
    - Reply in HTML format that can be directly rendered on screen.
    - The last line should always be: Chanakya advises: "the advice"
    """

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"AI Generation Error: {str(e)}")
        return f"Chanakya is offline. Error: {str(e)}"


def fetch_attendance_history(conn, user, subject_filter: Optional[str] = None) -> List[Dict]:
    cursor = conn.cursor()

    base_query = """
        SELECT
            a.date,
            a.status,
            t.subject,
            t.start_time,
            t.end_time
        FROM attendance_logs a
        JOIN timetable t ON a.timetable_id = t.id
        WHERE a.student_reg_no = %s
    """

    params = [user["reg_no"]]

    if subject_filter:
        base_query += " AND t.subject = %s"
        params.append(subject_filter)

    base_query += " ORDER BY a.date DESC, t.start_time ASC"

    cursor.execute(base_query, tuple(params))

    history = []
    for row in cursor.fetchall():
        history.append(
            {
                "date": row["date"],
                "status": row["status"],
                "subject": row["subject"],
                "time": f"{row['start_time']} - {row['end_time']}",
            }
        )
    return history


def get_professor_distinct_classes(conn, teacher_id: str) -> List[Dict]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT DISTINCT subject, section, year
        FROM timetable
        WHERE teacher_id = %s
        ORDER BY year DESC, subject ASC, section ASC
        """,
        (teacher_id,),
    )
    return [dict(row) for row in cursor.fetchall()]


def _in_placeholders(values: List) -> str:
    return ",".join(["%s"] * len(values))


def get_class_attendance_summary(conn, teacher_id: str, subject: str, section: str, year: int) -> List[Dict]:
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM timetable
        WHERE teacher_id = %s AND subject = %s AND section = %s AND year = %s
        """,
        (teacher_id, subject, section, year),
    )
    timetable_ids = [row["id"] for row in cursor.fetchall()]

    if not timetable_ids:
        return []

    cursor.execute(
        """
        SELECT reg_no, name
        FROM students
        WHERE section = %s AND year = %s
        ORDER BY reg_no
        """,
        (section, year),
    )
    students = {
        row["reg_no"]: {
            "name": row["name"],
            "reg_no": row["reg_no"],
            "present": 0,
            "absent": 0,
            "total": 0,
            "percentage": 0.0,
        }
        for row in cursor.fetchall()
    }

    placeholders = _in_placeholders(timetable_ids)
    query = f"""
        SELECT student_reg_no, status, COUNT(*) AS count
        FROM attendance_logs
        WHERE timetable_id IN ({placeholders}) AND status != 'Cancelled'
        GROUP BY student_reg_no, status
    """
    cursor.execute(query, tuple(timetable_ids))

    for row in cursor.fetchall():
        reg_no = row["student_reg_no"]
        if reg_no in students:
            if row["status"] == "Present":
                students[reg_no]["present"] += row["count"]
            elif row["status"] == "Absent":
                students[reg_no]["absent"] += row["count"]

    results = []
    for _, data in students.items():
        data["total"] = data["present"] + data["absent"]
        if data["total"] > 0:
            data["percentage"] = round((data["present"] / data["total"]) * 100, 2)
        results.append(data)

    return results


def get_student_history_for_class(conn, teacher_id: str, subject: str, section: str, year: int, student_reg_no: str) -> List[Dict]:
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM timetable
        WHERE teacher_id = %s AND subject = %s AND section = %s AND year = %s
        """,
        (teacher_id, subject, section, year),
    )
    timetable_ids = [row["id"] for row in cursor.fetchall()]

    if not timetable_ids:
        return []

    placeholders = _in_placeholders(timetable_ids)
    params = tuple(timetable_ids) + (student_reg_no,)

    query = f"""
        SELECT a.date, a.status, t.day_of_week, t.start_time
        FROM attendance_logs a
        JOIN timetable t ON a.timetable_id = t.id
        WHERE a.timetable_id IN ({placeholders}) AND a.student_reg_no = %s
        ORDER BY a.date DESC
    """

    cursor.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]


def generate_csv_report(data: List[Dict], class_info: str) -> StreamingResponse:
    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(["Register No", "Name", "Total Classes", "Present", "Absent", "Percentage"])

    for row in data:
        writer.writerow(
            [
                row["reg_no"],
                row["name"],
                row["total"],
                row["present"],
                row["absent"],
                f"{row['percentage']}%",
            ]
        )

    output.seek(0)

    headers = {
        "Content-Disposition": f'attachment; filename="Attendance_{class_info}.csv"'
    }

    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)

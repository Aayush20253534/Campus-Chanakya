from pydantic import BaseModel
from typing import List


class ResultItem(BaseModel):
    student_reg_no: str
    student_name: str
    internal_marks: int
    external_marks: int
    credits: int


class ResultSubmission(BaseModel):
    subject_code: str
    subject_name: str
    semester: int
    results: List[ResultItem]


def calculate_grade(total_marks: int):
    if total_marks >= 90:
        return "A+", 10
    if total_marks >= 80:
        return "A", 9
    if total_marks >= 70:
        return "B+", 8
    if total_marks >= 60:
        return "B", 7
    if total_marks >= 50:
        return "C", 6
    if total_marks >= 40:
        return "D", 5
    return "F", 0


def init_results_db(conn):
    """Optional Postgres initializer. Safe to call with a Neon connection."""
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS results (
            id SERIAL PRIMARY KEY,
            student_email TEXT,
            subject_code TEXT,
            subject_name TEXT,
            semester INTEGER,
            credits INTEGER,
            internal_marks INTEGER,
            external_marks INTEGER,
            total_marks INTEGER,
            grade TEXT,
            grade_point INTEGER,
            UNIQUE(student_email, subject_code)
        )
        """
    )
    conn.commit()


def get_teacher_classes(conn, teacher_id):
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT DISTINCT subject, section, year
            FROM timetable
            WHERE teacher_id = %s
            ORDER BY year DESC, section ASC
            """,
            (teacher_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error fetching teacher classes: {e}")
        return []


def get_students_for_teacher(conn, section: str, year: int):
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT reg_no, name
            FROM students
            WHERE section = %s AND year = %s
            ORDER BY reg_no ASC
            """,
            (section, year),
        )
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error fetching students: {e}")
        return []


def submit_class_results(conn, data: ResultSubmission):
    cursor = conn.cursor()
    try:
        for item in data.results:
            total = item.internal_marks + item.external_marks
            grade, point = calculate_grade(total)

            cursor.execute(
                """
                INSERT INTO results (
                    student_email, subject_code, subject_name, semester, credits,
                    internal_marks, external_marks, total_marks, grade, grade_point
                )
                VALUES (
                    (SELECT email FROM students WHERE reg_no = %s),
                    %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (student_email, subject_code)
                DO UPDATE SET
                    subject_name = EXCLUDED.subject_name,
                    semester = EXCLUDED.semester,
                    credits = EXCLUDED.credits,
                    internal_marks = EXCLUDED.internal_marks,
                    external_marks = EXCLUDED.external_marks,
                    total_marks = EXCLUDED.total_marks,
                    grade = EXCLUDED.grade,
                    grade_point = EXCLUDED.grade_point
                """,
                (
                    item.student_reg_no,
                    data.subject_code,
                    data.subject_name,
                    data.semester,
                    item.credits,
                    item.internal_marks,
                    item.external_marks,
                    total,
                    grade,
                    point,
                ),
            )

        conn.commit()
        return True, "Results submitted successfully"
    except Exception as e:
        conn.rollback()
        return False, str(e)


def get_student_results(conn, email: str):
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM results WHERE student_email = %s ORDER BY semester DESC",
        (email,),
    )
    rows = cursor.fetchall()
    result_rows = [dict(row) for row in rows]

    if not result_rows:
        return {"results": [], "sgpa": 0.0, "cgpa": 0.0, "rank": 0, "history": []}

    sem_data = {}
    total_points_all = 0
    total_credits_all = 0

    for r in result_rows:
        sem = r["semester"]
        if sem not in sem_data:
            sem_data[sem] = {"points": 0, "credits": 0}

        sem_data[sem]["points"] += r["grade_point"] * r["credits"]
        sem_data[sem]["credits"] += r["credits"]

        total_points_all += r["grade_point"] * r["credits"]
        total_credits_all += r["credits"]

    sgpa_history = []
    sorted_sems = sorted(sem_data.keys())
    for sem in sorted_sems:
        if sem_data[sem]["credits"] > 0:
            sgpa = sem_data[sem]["points"] / sem_data[sem]["credits"]
            sgpa_history.append({"semester": f"Sem {sem}", "sgpa": round(sgpa, 2)})

    latest_sem = sorted_sems[-1] if sorted_sems else 0
    latest_sgpa = 0.0
    if latest_sem > 0 and sem_data[latest_sem]["credits"] > 0:
        latest_sgpa = sem_data[latest_sem]["points"] / sem_data[latest_sem]["credits"]

    cgpa = 0.0
    if total_credits_all > 0:
        cgpa = total_points_all / total_credits_all

    cursor.execute("SELECT year FROM students WHERE email = %s", (email,))
    student_meta = cursor.fetchone()
    student_year = student_meta["year"] if student_meta else 0

    cursor.execute(
        """
        SELECT
            r.student_email,
            SUM(r.grade_point * r.credits) AS total_pts,
            SUM(r.credits) AS total_creds
        FROM results r
        JOIN students s ON r.student_email = s.email
        WHERE s.year = %s
        GROUP BY r.student_email
        """,
        (student_year,),
    )

    batch_mates = cursor.fetchall()

    rank_list = []
    for student in batch_mates:
        s_cgpa = student["total_pts"] / student["total_creds"] if student["total_creds"] > 0 else 0
        rank_list.append(s_cgpa)

    rank_list.sort(reverse=True)

    try:
        rank = rank_list.index(cgpa) + 1
    except ValueError:
        rank = 0

    return {
        "results": result_rows,
        "sgpa": round(latest_sgpa, 2),
        "cgpa": round(cgpa, 2),
        "rank": rank,
        "total_in_batch": len(rank_list),
        "credits_earned": total_credits_all,
        "backlogs": len([r for r in result_rows if r["grade"] == "F"]),
        "history": sgpa_history,
    }

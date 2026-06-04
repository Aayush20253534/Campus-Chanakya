import os
from google import genai
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None

if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize GenAI client: {e}")


def get_db():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set in .env")
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def ensure_assignments_table(conn):
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            teacher_id TEXT,
            subject TEXT NOT NULL,
            section TEXT NOT NULL,
            year INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            deadline TEXT NOT NULL,
            file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()


def get_teacher_classes(teacher_id):
    """Fetch distinct classes a professor teaches to populate dropdowns."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT subject, section, year
            FROM timetable
            WHERE teacher_id = %s
            ORDER BY year, section, subject
            """,
            (teacher_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def create_assignment(data: dict):
    conn = get_db()
    try:
        ensure_assignments_table(conn)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO assignments (
                teacher_id, subject, section, year, title, description, deadline, file_path
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["teacher_id"],
                data["subject"],
                data["section"],
                data["year"],
                data["title"],
                data["description"],
                data["deadline"],
                data.get("file_path"),
            ),
        )
        conn.commit()
        return True, "Assignment posted successfully"
    except Exception as e:
        conn.rollback()
        print(f"DB Error: {e}")
        return False, f"Database Error: {str(e)}"
    finally:
        conn.close()


def get_student_assignments(reg_no: str):
    conn = get_db()
    try:
        ensure_assignments_table(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT section, year FROM students WHERE reg_no = %s", (reg_no,))
        student = cursor.fetchone()

        if not student:
            return []

        cursor.execute(
            """
            SELECT
                a.id,
                a.subject,
                a.title,
                a.description,
                a.deadline,
                a.file_path,
                t.name AS teacher_name
            FROM assignments a
            LEFT JOIN teachers t ON a.teacher_id = t.id
            WHERE a.section = %s AND a.year = %s
            ORDER BY a.deadline ASC
            """,
            (student["section"], student["year"]),
        )
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"DB Error fetching student assignments: {e}")
        return []
    finally:
        conn.close()


def ai_get_help(assignment_desc: str, student_query: str, mode: str):
    if not client:
        return "AI Service Unavailable (API Key missing or client initialization failed)."

    if mode == "plan":
        prompt = f"""
        You are a helpful teaching assistant named Chanakya.
        The student has this assignment: "{assignment_desc}"

        Create a concise, step-by-step checklist action plan for the student to start and complete this assignment.
        Do NOT solve it for them. Just list the logical steps.
        Format the output as clean HTML using <ul> and <li> tags without markdown code blocks.
        """
    else:
        prompt = f"""
        You are a helpful teaching assistant named Chanakya.
        Assignment Context: "{assignment_desc}"

        The student asks: "{student_query}"

        Explain the relevant concept simply.
        Do not give the direct code answer, but explain the logic or theory.
        Format the output as clean HTML paragraphs using <p> without markdown code blocks.
        """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"AI Error: {str(e)}"


def get_professor_assignments_logic(teacher_id):
    """Fetch all assignments created by a specific professor."""
    conn = get_db()
    try:
        ensure_assignments_table(conn)
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT *
            FROM assignments
            WHERE teacher_id = %s
            ORDER BY created_at DESC
            """,
            (teacher_id,),
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

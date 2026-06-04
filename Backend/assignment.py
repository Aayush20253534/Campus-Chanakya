import sqlite3
import os
from pathlib import Path
from google import genai
from dotenv import load_dotenv
import sqlite3
import os
from pathlib import Path

load_dotenv()

# Config
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "college.db"

# Setup AI Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None

if GEMINI_API_KEY:
    try:
        # Initialize the new GenAI client
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize GenAI client: {e}")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# =======================
# PROFESSOR FUNCTIONS
# =======================



def get_teacher_classes(teacher_id: int):
    """Fetch distinct classes a professor teaches to populate dropdowns."""
    conn = get_db()
    cursor = conn.cursor()
    # Select DISTINCT so the professor doesn't see the same class multiple times (e.g., if they teach it Mon and Wed)
    query = """
        SELECT DISTINCT subject, section, year 
        FROM timetable 
        WHERE teacher_id = ?
        ORDER BY year, section, subject
    """
    cursor.execute(query, (teacher_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_assignment(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # 1. Schema Migration: Ensure 'file_path' column exists
        # This handles the case where the user already has an 'assignments' table
        try:
            cursor.execute("ALTER TABLE assignments ADD COLUMN file_path TEXT")
        except sqlite3.OperationalError:
            pass # Column likely already exists

        # 2. Ensure Table Exists (Full creation if brand new)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id INTEGER,
                subject TEXT NOT NULL,
                section TEXT NOT NULL,
                year INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                deadline TEXT NOT NULL,
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 3. Insert Data
        cursor.execute("""
            INSERT INTO assignments (teacher_id, subject, section, year, title, description, deadline, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['teacher_id'], 
            data['subject'], 
            data['section'], 
            data['year'], 
            data['title'], 
            data['description'], 
            data['deadline'],
            data.get('file_path') # Can be None
        ))
        
        conn.commit()
        return True, "Assignment posted successfully"
        
    except Exception as e:
        print(f"DB Error: {e}")
        return False, f"Database Error: {str(e)}"
    finally:
        conn.close()
# =======================
# STUDENT FUNCTIONS
# =======================

def get_student_assignments(reg_no: str):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Get Student's Metadata
    cursor.execute("SELECT section, year FROM students WHERE reg_no = ?", (reg_no,))
    student = cursor.fetchone()
    
    if not student:
        conn.close()
        return []

    # 2. Find matching assignments (Added file_path to SELECT)
    query = """
        SELECT a.id, a.subject, a.title, a.description, a.deadline, a.file_path, t.name as teacher_name 
        FROM assignments a
        LEFT JOIN teachers t ON a.teacher_id = t.id
        WHERE a.section = ? AND a.year = ?
        ORDER BY a.deadline ASC
    """
    try:
        cursor.execute(query, (student['section'], student['year']))
        rows = cursor.fetchall()
    except sqlite3.OperationalError:
        return []
    finally:
        conn.close()
        
    return [dict(row) for row in rows]
# =======================
# STUDENT AI FEATURES
# =======================

def ai_get_help(assignment_desc: str, student_query: str, mode: str):
    if not client:
        return "AI Service Unavailable (API Key missing or client initialization failed)."

    if mode == "plan":
        prompt = f"""
        You are a helpful teaching assistant named Chanakya.
        The student has this assignment: "{assignment_desc}"
        
        Create a concise, step-by-step checklist action plan for the student to start and complete this assignment.
        Do NOT solve it for them. Just list the logical steps.
        Format the output as clean HTML (using <ul> and <li> tags) without markdown code blocks.
        """
    else: # Explain mode
        prompt = f"""
        You are a helpful teaching assistant named Chanakya.
        Assignment Context: "{assignment_desc}"
        
        The student asks: "{student_query}"
        
        Explain the relevant concept simply. 
        Do not give the direct code answer, but explain the logic or theory.
        Format the output as clean HTML paragraphs (<p>) without markdown code blocks.
        """

    try:
        # Using the new models.generate_content pattern
        response = client.models.generate_content(
            model='gemini-3-flash-preview', 
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"AI Error: {str(e)}"
    
def get_professor_assignments_logic(teacher_id: int):
    """Fetch all assignments created by a specific professor."""
    conn = get_db()
    cursor = conn.cursor()
    query = """
        SELECT * FROM assignments 
        WHERE teacher_id = ? 
        ORDER BY created_at DESC
    """
    cursor.execute(query, (teacher_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
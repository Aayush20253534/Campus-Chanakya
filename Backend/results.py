import sqlite3
from pydantic import BaseModel
from typing import List, Optional, Dict

# --- Data Models ---

class ResultItem(BaseModel):
    student_reg_no: str  # Teacher inputs Reg No
    student_name: str
    internal_marks: int
    external_marks: int
    credits: int

class ResultSubmission(BaseModel):
    subject_code: str
    subject_name: str
    semester: int
    results: List[ResultItem]

# --- Helper Functions ---

def calculate_grade(total_marks: int):
    """
    Standard Grading Scale.
    Returns (Grade, Grade Point)
    """
    if total_marks >= 90: return "A+", 10
    elif total_marks >= 80: return "A", 9
    elif total_marks >= 70: return "B+", 8
    elif total_marks >= 60: return "B", 7
    elif total_marks >= 50: return "C", 6
    elif total_marks >= 40: return "D", 5
    else: return "F", 0

def init_results_db(db_path: str):
    """Creates the necessary tables if they don't exist."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Updated Schema: Uses student_email as per your database requirement
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    """)
    conn.commit()
    conn.close()

# --- Teacher Functions ---

def get_teacher_classes(conn: sqlite3.Connection, teacher_id: int):
    """Fetches list of classes assigned to a teacher."""
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT DISTINCT subject, section, year 
            FROM timetable 
            WHERE teacher_id = ?
            ORDER BY year DESC, section ASC
        """, (teacher_id,))
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error fetching teacher classes: {e}")
        return []

def get_students_for_teacher(conn: sqlite3.Connection, section: str, year: int):
    """
    Fetches students enrolled in a specific class section.
    Returns Reg No (for the teacher to see) and Name.
    """
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT reg_no, name 
            FROM students 
            WHERE section = ? AND year = ?
            ORDER BY reg_no ASC
        """, (section, year))
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error fetching students: {e}")
        return []

def submit_class_results(conn: sqlite3.Connection, data: ResultSubmission):
    """
    Saves or updates marks.
    LOGIC: Matches the input 'student_reg_no' to 'student_email' in the DB before saving.
    """
    cursor = conn.cursor()
    try:
        for item in data.results:
            total = item.internal_marks + item.external_marks
            grade, point = calculate_grade(total)
            
            # 1. Resolve Reg No to Email
            # We use a subquery in the INSERT to map Reg No -> Email dynamically
            # If the Reg No doesn't exist, this specific insert will be ignored or fail gracefully
            
            cursor.execute("""
                INSERT OR REPLACE INTO results 
                (student_email, subject_code, subject_name, semester, credits, 
                 internal_marks, external_marks, total_marks, grade, grade_point)
                VALUES (
                    (SELECT email FROM students WHERE reg_no = ?), 
                    ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, (
                item.student_reg_no, 
                data.subject_code, 
                data.subject_name, 
                data.semester, 
                item.credits,
                item.internal_marks, 
                item.external_marks, 
                total, 
                grade, 
                point
            ))
            
        conn.commit()
        return True, "Results submitted successfully"
    except Exception as e:
        conn.rollback()
        return False, str(e)

# --- Student Functions ---

def get_student_results(conn: sqlite3.Connection, email: str):
    """
    Fetches results using EMAIL (since that is what is stored in the results table).
    """
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Fetch all academic records using email
    cursor.execute("SELECT * FROM results WHERE student_email = ? ORDER BY semester DESC", (email,))
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    
    if not results:
        return {"results": [], "sgpa": 0.0, "cgpa": 0.0, "rank": 0, "history": []}

    # 2. Calculate SGPA/CGPA
    sem_data = {}
    total_points_all = 0
    total_credits_all = 0
    
    for r in results:
        sem = r['semester']
        if sem not in sem_data:
            sem_data[sem] = {'points': 0, 'credits': 0}
            
        sem_data[sem]['points'] += (r['grade_point'] * r['credits'])
        sem_data[sem]['credits'] += r['credits']
        
        total_points_all += (r['grade_point'] * r['credits'])
        total_credits_all += r['credits']

    sgpa_history = []
    sorted_sems = sorted(sem_data.keys())
    for s in sorted_sems:
        if sem_data[s]['credits'] > 0:
            sgpa = sem_data[s]['points'] / sem_data[s]['credits']
            sgpa_history.append({"semester": f"Sem {s}", "sgpa": round(sgpa, 2)})

    latest_sem = sorted_sems[-1] if sorted_sems else 0
    latest_sgpa = 0.0
    if latest_sem > 0:
        latest_sgpa = sem_data[latest_sem]['points'] / sem_data[latest_sem]['credits']

    cgpa = 0.0
    if total_credits_all > 0:
        cgpa = total_points_all / total_credits_all

    # 3. Calculate Class Rank (Comparison with peers in the same batch)
    cursor.execute("SELECT year FROM students WHERE email = ?", (email,))
    student_meta = cursor.fetchone()
    student_year = student_meta['year'] if student_meta else 0

    # Get CGPA of all students in the same year
    cursor.execute("""
        SELECT r.student_email, 
               SUM(r.grade_point * r.credits) as total_pts, 
               SUM(r.credits) as total_creds 
        FROM results r
        JOIN students s ON r.student_email = s.email
        WHERE s.year = ?
        GROUP BY r.student_email
    """, (student_year,))
    
    batch_mates = cursor.fetchall()
    
    rank_list = []
    for s in batch_mates:
        s_cgpa = s['total_pts'] / s['total_creds'] if s['total_creds'] > 0 else 0
        rank_list.append(s_cgpa)
    
    rank_list.sort(reverse=True)
    
    try:
        rank = rank_list.index(cgpa) + 1
    except ValueError:
        rank = 0 

    return {
        "results": results, 
        "sgpa": round(latest_sgpa, 2),
        "cgpa": round(cgpa, 2),
        "rank": rank,
        "total_in_batch": len(rank_list),
        "credits_earned": total_credits_all,
        "backlogs": len([r for r in results if r['grade'] == 'F']),
        "history": sgpa_history 
    }
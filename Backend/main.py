from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
from pathlib import Path  
import shutil
import os
import json
import uuid
import sqlite3
import announcements
import attendance
import assignment
import results
import feed
import clubs

load_dotenv()

app = FastAPI(title="Campus Chanakya Backend")
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "college.db"
CLUBS_FILE = DATA_DIR / "clubs.json" 
ASSIGNMENT_DIR = DATA_DIR / "assignments"

ASSIGNMENT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

SECRET_KEY = os.getenv("SECRET_KEY", "campus_chanakya_secret_key")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

class UpdateAnnouncementSchema(BaseModel):
    admin_given_title: Optional[str] = None
    ai_generated_title: Optional[str] = None
    ai_generated_category: Optional[str] = None
    ai_generated_short_summary: Optional[str] = None
    ai_generated_descriptive_summary: Optional[str] = None
    ai_generated_tags: Optional[List[str]] = None
    ai_generated_relevance_score: Optional[int] = None
    extracted_deadline: Optional[str] = None

class StudentUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    department: Optional[str] = None
    section: Optional[str] = None
    year: Optional[int] = None
    hostel: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    enrollment_date: Optional[str] = None

class FeedPostSchema(BaseModel):
    title: str
    content: str

class VoteSchema(BaseModel):
    post_id: str
    vote_type: str

class ClassModalResponse(BaseModel):
    subject: str
    attendance_percentage: float
    attended: int
    total: int
    status: str
    advice: str
    teacher: Optional[str] = "N/A"

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class AssignmentPostSchema(BaseModel):
    subject: str
    section: str
    year: int
    title: str
    description: str
    deadline: str # ISO format: 2025-10-15 23:59

class StudentAIRequest(BaseModel):
    assignment_description: str
    query: Optional[str] = ""
    mode: str # 'explain' or 'plan'

class ProfessorUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None

class TimetableSchema(BaseModel):
    section: str
    year: int
    day_of_week: str
    start_time: str
    end_time: str
    subject: str
    teacher_id: str
    room_number: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def get_current_user(token: str = Depends(oauth2_scheme), conn: sqlite3.Connection = Depends(get_db_connection)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role", "student")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # --- NEW: Immediate return for Admin ---
    if role == "admin":
        return {
            "id": "admin", 
            "name": "Administrator", 
            "email": "admin123", 
            "role": "admin"
        }

    cursor = conn.cursor()
    
    if role == "professor":
        # SCHEMA ALIGNMENT: teachers table has [id, name, subject, email, password]
        cursor.execute("SELECT * FROM teachers WHERE email = ?", (email,))
        user = cursor.fetchone()
        if user:
            return dict(user) | {"role": "professor"}
    else:
        cursor.execute("SELECT * FROM students WHERE email = ?", (email,))
        user = cursor.fetchone()
        if user:
            return dict(user) | {"role": "student"}
    
    raise HTTPException(status_code=404, detail="User not found")

@app.on_event("startup")
def startup_db_init():
    attendance.init_attendance_db(str(DB_PATH))
    results.init_results_db(str(DB_PATH))
    feed.init_feed_db(str(DB_PATH))

@app.get("/api/clubs", tags=["Clubs"])
def get_all_clubs(
    category: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """
    Returns club list. 
    Students see the 'apply_link' inside 'recruitment_status' if they wish to join.
    """
    return clubs.get_all_clubs_logic(CLUBS_FILE, conn, current_user, category)

@app.post("/api/clubs/recommendations", tags=["Clubs"])
def get_club_recommendations(
    request: clubs.RecommendRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    AI Endpoint: Returns top 3 clubs based on student interests.
    """
    return clubs.recommend_clubs_ai(CLUBS_FILE, request)

@app.put("/api/clubs/{club_id}/update", tags=["Clubs"])
def update_club_full_details(
    club_id: str,
    payload: clubs.ClubUpdateSchema,
    current_user: Dict = Depends(get_current_user)
):
    """
    Coordinator updates club details, including opening/closing hiring and setting the Google Form link.
    """
    return clubs.update_club_logic(CLUBS_FILE, club_id, payload, current_user)

@app.get("/api/professor/dashboard", tags=["Professor Dashboard"])
def get_professor_classes(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user.get("role") != "professor":
        raise HTTPException(status_code=403, detail="Access denied. Professors only.")

    professor_id = current_user["id"]
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, day_of_week, subject, year, section, start_time, end_time, room_number
        FROM timetable
        WHERE teacher_id = ? 
        ORDER BY 
            CASE 
                WHEN day_of_week = 'Monday' THEN 1
                WHEN day_of_week = 'Tuesday' THEN 2
                WHEN day_of_week = 'Wednesday' THEN 3
                WHEN day_of_week = 'Thursday' THEN 4
                WHEN day_of_week = 'Friday' THEN 5
                ELSE 6
            END, start_time
    """, (professor_id,))
    
    classes = [dict(row) for row in cursor.fetchall()]
    return {
        "professor_name": current_user["name"],
        "classes": classes
    }

@app.get("/api/professor/roster/{timetable_id}", tags=["Professor Dashboard"])
def get_class_roster_endpoint(
    timetable_id: int,
    current_user: Dict = Depends(get_current_user), 
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user.get("role") != "professor":
        raise HTTPException(status_code=403, detail="Access denied. Professors only.")

    result = attendance.fetch_class_roster(conn, timetable_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.post("/api/professor/mark-bulk", tags=["Professor Dashboard"])
def mark_bulk_attendance_endpoint(
    payload: attendance.BulkAttendanceRequest,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user.get("role") != "professor":
        raise HTTPException(status_code=403, detail="Access denied. Professors only.")

    try:
        return attendance.mark_bulk_attendance(
            conn, 
            payload.timetable_id, 
            payload.date, 
            payload.records
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@app.get("/api/attendance/timetable", response_model=List[attendance.TimetableEntry], tags=["Student View"])
def get_timetable(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user.get("role") == "professor": return [] 
    return attendance.fetch_student_timetable(conn, current_user)

@app.get("/api/attendance/stats", tags=["Student View"])
def get_stats(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user.get("role") == "professor": return []
    return attendance.calculate_attendance_stats(conn, current_user)

@app.post("/api/attendance/chanakya-consult", tags=["Student View"])
async def consult_ai(
    request: attendance.AIAdviceRequest,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    response_text = attendance.get_ai_advice(conn, current_user, request.query)
    return {"response": response_text}

@app.get("/api/attendance/history", tags=["Student View"])
def get_attendance_history(
    subject: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user.get("role") == "professor": return []
    return attendance.fetch_attendance_history(conn, current_user, subject)

@app.post("/api/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    identifier = form_data.username
    password_input = form_data.password

    # --- 1. CHECK ADMIN (Hardcoded Credentials) ---
    if identifier == "admin123" and password_input == "admin123":
        token_data = {"sub": "admin123", "role": "admin"}
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "role": "admin",
            "name": "System Administrator"
        }

    cursor = conn.cursor()

    # 2. CHECK PROFESSORS
    # SCHEMA ALIGNMENT: teachers table has [id, name, subject, email, password]
    cursor.execute("SELECT * FROM teachers WHERE email = ?", (identifier,))
    teacher = cursor.fetchone()
    if teacher:
        if teacher['password'] == password_input:
             token_data = {"sub": teacher['email'], "role": "professor", "id": teacher['id']}
             token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
             return {
                "access_token": token, 
                "token_type": "bearer", 
                "role": "professor",
                "name": teacher['name']
            }

    # 3. CHECK STUDENTS (Existing Logic)
    cursor.execute("SELECT * FROM students WHERE email = ?", (identifier,))
    student = cursor.fetchone()

    if student:
        stored_pw = str(student['password'])
        reg_no = str(student['reg_no'])
        password_valid = False

        if stored_pw == reg_no:
            if password_input == reg_no:
                password_valid = True
        else:
            if pwd_context.verify(password_input, stored_pw):
                password_valid = True

        if password_valid:
            token_data = {"sub": student['email'], "role": "student"}
            token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "student",
                "student_name": student['name']
            }

    raise HTTPException(status_code=401, detail="Invalid Credentials")

@app.post("/api/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    role = current_user.get("role")
    cursor = conn.cursor()

    if role == "student":
        stored_password = str(current_user["password"])
        reg_no = str(current_user["reg_no"])
        email = current_user["email"]

        password_verified = False

        if stored_password == reg_no:
            password_verified = request.old_password == reg_no
        else:
            password_verified = pwd_context.verify(request.old_password, stored_password)

        if not password_verified:
            raise HTTPException(status_code=400, detail="Old password incorrect")

        new_hash = pwd_context.hash(request.new_password)
        cursor.execute(
            "UPDATE students SET password = ? WHERE email = ?",
            (new_hash, email)
        )
        conn.commit()

        return {"status": "success", "message": "Password changed successfully"}

    if role == "professor":
        stored_password = str(current_user["password"])
        professor_id = str(current_user["id"])
        email = current_user["email"]

        password_verified = False

        if stored_password == professor_id:
            password_verified = request.old_password == professor_id
        else:
            password_verified = stored_password == request.old_password

        if not password_verified:
            raise HTTPException(status_code=400, detail="Old password incorrect")

        cursor.execute(
            "UPDATE teachers SET password = ? WHERE email = ?",
            (request.new_password, email)
        )
        conn.commit()

        return {"status": "success", "message": "Password changed successfully"}

    raise HTTPException(status_code=400, detail="Password change not allowed")

@app.post("/api/announcements/add")
async def add_announcement_endpoint(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    notes: str = Form(""),
    files: List[UploadFile] = File(default=[]) 
):
    try:
        new_id = str(uuid.uuid4())
        saved_file_paths = []
        web_file_urls = []

        if files:
            for file in files:
                if not file.filename: continue 
                
                file_ext = os.path.splitext(file.filename)[1]
                random_suffix = str(uuid.uuid4())[:8] 
                new_filename = f"notice_{new_id}_{random_suffix}{file_ext}"
                file_dest = UPLOAD_DIR / new_filename
                with open(file_dest, "wb+") as f:
                    shutil.copyfileobj(file.file, f)
                saved_file_paths.append(str(file_dest))
                web_file_urls.append(f"/data/uploads/{new_filename}")

        placeholder_data = {
            "id": new_id,
            "admin_given_title": title,
            "admin_notes": notes,
            "ai_generated_title": "Processing...", 
            "ai_generated_category": "General",
            "ai_generated_short_summary": "AI is analyzing content...",
            "ai_generated_descriptive_summary": None,
            "ai_generated_tags": [],
            "ai_generated_relevance_score": 0,
            "extracted_deadline": None,
            "active": True,
            "upload_date": datetime.now().strftime("%Y-%m-%d"),
            "file_paths": web_file_urls
        }
        
        json_path = BASE_DIR / announcements.ANNOUNCEMENTS_FILE
        if json_path.exists():
            with open(json_path, "r") as f:
                try: data = json.load(f)
                except: data = {}
        else:
            data = {}
            
        data[new_id] = placeholder_data
        
        with open(json_path, "w") as f:
            json.dump(data, f, indent=4)

        background_tasks.add_task(
            announcements.process_existing_announcement, 
            announcement_id=new_id,
            file_paths=saved_file_paths, 
            admin_notes=f"{title}\n{notes}" 
        )
        return {"status": "success", "message": "Upload started", "id": new_id}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.put("/api/announcements/{announcement_id}/enable")
def enable_notice(announcement_id: str):
    success, msg = announcements.enable_announcement(announcement_id)
    if not success: raise HTTPException(status_code=404, detail=msg)
    return {"status": "success", "message": msg}

@app.get("/api/announcements")
def get_all_announcements(admin_view: bool = False): # 1. Add parameter
    json_path = BASE_DIR / announcements.ANNOUNCEMENTS_FILE
    if not json_path.exists(): return []
    try:
        with open(json_path, "r") as f: data = json.load(f)
    except: return []

    results = []
    for aid, item in data.items():
        # 2. Only skip inactive items if NOT in admin_view
        if not admin_view and not item.get("active", True): 
            continue
            
        item["id"] = aid
        if "file_path" in item and "file_paths" not in item:
             item["file_paths"] = [item["file_path"]]
        results.append(item)
    
    results.sort(key=lambda x: x.get("upload_date", ""), reverse=True)
    return results
@app.put("/api/announcements/{announcement_id}/update")
def update_announcement_endpoint(announcement_id: str, payload: UpdateAnnouncementSchema):
    updates = payload.dict(exclude_unset=True)
    if not updates: raise HTTPException(status_code=400, detail="No fields provided")
    success, message = announcements.update_announcement(announcement_id, updates)
    if not success: raise HTTPException(status_code=404, detail=message)
    return {"status": "success", "message": "Updated"}

@app.put("/api/announcements/{announcement_id}/disable")
def disable_notice(announcement_id: str):
    success, msg = announcements.disable_announcement(announcement_id)
    if not success: raise HTTPException(status_code=404, detail=msg)
    return {"status": "success", "message": msg}

@app.get("/api/teacher/my-classes")
def get_teacher_classes_endpoint(current_user: dict = Depends(get_current_user)):
    """(Professor) Get list of classes (Subject/Section) from Timetable to populate dropdowns."""
    # FIX: Authenticate as 'professor', matching the role in login()
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")
    
    classes = assignment.get_teacher_classes(current_user["id"])
    return classes

@app.post("/api/assignments")
async def create_assignment_endpoint(
    subject: str = Form(...),
    section: str = Form(...),
    year: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    deadline: str = Form(...),
    file: Optional[UploadFile] = File(None), # Optional File Upload
    current_user: dict = Depends(get_current_user)
):
    """(Professor) Post a new assignment with an optional file attachment."""
    
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")

    # 1. Handle File Upload
    file_url = None
    if file and file.filename:
        try:
            # Generate safe unique filename
            file_ext = os.path.splitext(file.filename)[1]
            unique_name = f"{uuid.uuid4()}_{file.filename}"
            file_dest = ASSIGNMENT_DIR / unique_name
            
            # Save file
            with open(file_dest, "wb+") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Create accessible URL (matches your StaticFiles mount)
            file_url = f"/data/assignments/{unique_name}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # 2. Prepare Data Dictionary
    data = {
        'teacher_id': current_user["id"],
        'subject': subject,
        'section': section,
        'year': year,
        'title': title,
        'description': description,
        'deadline': deadline,
        'file_path': file_url 
    }
    
    # 3. Save to DB
    success, msg = assignment.create_assignment(data)
    
    if not success:
        raise HTTPException(status_code=500, detail=msg)
    
    return {"status": "success", "message": "Assignment created successfully"}
@app.get("/api/student/assignments")
def get_my_assignments(current_user: dict = Depends(get_current_user)):
    """(Student) View assignments for my Section/Year."""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    return assignment.get_student_assignments(current_user["reg_no"])

@app.post("/api/student/ai-assistant")
def get_assignment_help(payload: StudentAIRequest, current_user: dict = Depends(get_current_user)):
    """
    (Student AI) 
    Mode 'plan': Returns a checklist to start the assignment.
    Mode 'explain': Explains the specific concept the student asked about.
    """
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    response_text = assignment.ai_get_help(
        payload.assignment_description, 
        payload.query, 
        payload.mode
    )
    return {"ai_response": response_text}

@app.get("/api/timetable/class-details", response_model=ClassModalResponse, tags=["Student View"])
def get_class_details_endpoint(
    subject: str,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access only")

    # --- PART A: Get Attendance Stats ---
    all_stats = attendance.calculate_attendance_stats(conn, current_user)
    
    subject_stat = None
    for item in all_stats:
        item_dict = dict(item)
        if item_dict.get('subject', '').lower() == subject.lower():
            subject_stat = item_dict
            break

    # --- PART B: Fetch Teacher Name (New Logic) ---
    # We query the timetable/teachers table to find who teaches this subject for this section
    teacher_name = "N/A"
    try:
        cursor = conn.cursor()
        # Assuming 'students' table has year/section and 'timetable' maps them
        cursor.execute("""
            SELECT t.name 
            FROM teachers t
            JOIN timetable tt ON t.id = tt.teacher_id
            WHERE tt.subject = ? AND tt.section = ? AND tt.year = ?
            LIMIT 1
        """, (subject, current_user['section'], current_user['year']))
        
        row = cursor.fetchone()
        if row:
            teacher_name = row[0]
        else:
            # Fallback: check if timetable has a raw 'teacher_name' column (legacy support)
            cursor.execute("""
                SELECT name FROM teachers 
                WHERE subject = ?
                LIMIT 1
            """, (subject))
            row_legacy = cursor.fetchone()
            if row_legacy and row_legacy[0]:
                teacher_name = row_legacy[0]
    except Exception as e:
        print(f"Error fetching teacher: {e}")
        # Keep default "N/A" if query fails

    if not subject_stat:
        return {
            "subject": subject,
            "attendance_percentage": 100.0,
            "attended": 0,
            "total": 0,
            "status": "Neutral",
            "advice": "No attendance records yet. Go to class!",
            "teacher": teacher_name
        }

    # --- PART C: Calculate Advice ---
    pct = subject_stat.get('percentage', 0)
    attended = subject_stat.get('attended', subject_stat.get('present', 0))
    total = subject_stat.get('total', subject_stat.get('total_classes', 0))
    
    status = "Safe"
    advice = "You are in good standing."

    if pct < 75:
        status = "Critical"
        if total > 0:
            try:
                required = int(((0.75 * total) - attended) / 0.25)
                if required < 0: required = 0
                advice = f"ATTENDANCE ALERT! You must attend the next {required} classes to hit 75%."
            except:
                advice = "Attendance is critical. Do not miss this class."
        else:
            advice = "Attendance is critical."
    elif pct < 80:
        status = "Warning"
        advice = "You are on the edge. Skipping this class might drop you below 75%."
    elif pct > 85:
        status = "Safe"
        advice = "You have a comfortable buffer. (But Chanakya suggests learning never stops!)"

    return {
        "subject": subject_stat.get('subject', subject),
        "attendance_percentage": pct,
        "attended": attended,
        "total": total,
        "status": status,
        "advice": advice,
        "teacher": teacher_name # <--- Return it here
    }
    
@app.get("/api/teacher/results/students", tags=["Results"])
def get_students_for_grading(
    section: str,
    year: int,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """
    (Professor) Step 2: After selecting a class, fetch the list of students 
    in that specific section and year to input marks.
    """
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")
    
    # Uses the helper from results.py
    student_list = results.get_students_for_teacher(conn, section, year)
    
    if not student_list:
        raise HTTPException(status_code=404, detail="No students found for this class configuration")
        
    return student_list
@app.get("/api/student/results", tags=["Results"])
def view_my_results(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """(Student) View my marks, SGPA, CGPA, and Rank."""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    # We pass 'email' here because the database table 'results' uses student_email.
    data = results.get_student_results(conn, current_user['email'])
    return data

@app.get("/api/teacher/results/classes", tags=["Results"])
def get_classes_for_results(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """
    (Professor) Step 1: Get the list of all classes (Subject, Section, Year) 
    assigned to the teacher to populate the selection dropdown.
    """
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")
    
    # Uses the helper from results.py
    classes = results.get_teacher_classes(conn, current_user["id"])
    return classes

@app.post("/api/teacher/results/submit", tags=["Results"])
def submit_student_results(
    payload: results.ResultSubmission,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """
    (Professor) Submit marks for the whole batch.
    Input: Uses Reg No.
    Storage: Automatically converts Reg No -> Email for DB storage.
    """
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")

    success, message = results.submit_class_results(conn, payload)

    if not success:
        raise HTTPException(status_code=500, detail=f"Submission failed: {message}")

    return {"status": "success", "message": message}

@app.get("/api/feed", tags=["Feed"])
def get_feed(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    return feed.get_feed_logic(conn, current_user['email'])

@app.post("/api/feed/create", tags=["Feed"])
def create_feed_post(
    payload: FeedPostSchema,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    # Returns 200 OK even if rejected, frontend handles the "status": "rejected" message
    return feed.create_post_logic(
    conn,
    current_user['email'],
    current_user['role'],
    payload.dict()
)

@app.post("/api/feed/vote", tags=["Feed"])
def vote_feed_post(
    payload: VoteSchema,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if payload.vote_type not in ['up', 'down']:
        raise HTTPException(status_code=400, detail="Invalid vote type")
        
    new_count = feed.vote_post_logic(conn, current_user['email'], payload.post_id, payload.vote_type)
    return {"status": "success", "new_count": new_count}

@app.get("/api/professor/assignments")
def get_created_assignments(current_user: dict = Depends(get_current_user)):
    """(Professor) View assignments I have created."""
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    return assignment.get_professor_assignments_logic(current_user["id"])

@app.get("/api/admin/students", tags=["Admin"])
def get_all_students_admin(
    search: Optional[str] = "",
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    cursor = conn.cursor()
    
    # 1. Select ONLY the columns that actually exist in your screenshot
    query = """
        SELECT reg_no, name, email, sex, dob, dept, section, year 
        FROM students
    """
    
    params = []
    if search:
        query += " WHERE reg_no LIKE ? OR name LIKE ?"
        params = [f"%{search}%", f"%{search}%"]
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    students = []
    for row in rows:
        r = dict(row)
        students.append({
            # DIRECT MAPPING
            "id": r["reg_no"],
            "name": r["name"],
            "email": r["email"],
            "section": r["section"],
            "year": r["year"],
            "dob": r["dob"],
            
            # ALIAS MAPPING (DB Column -> Frontend Name)
            "gender": r["sex"],       # DB has 'sex', Frontend expects 'gender'
            "department": r["dept"],  # DB has 'dept', Frontend expects 'department'
            
            # STUBBED DATA (Columns missing in your DB)
            # We return placeholders so the UI doesn't crash
            "hostel": "Not Assigned",
            "phone": "N/A",
            "address": "N/A",
            "enrollmentDate": "2024-01-01", 
            "tags": [f"Year {r['year']}", r['section']]
        })
        
    return students

@app.put("/api/admin/students/{student_id}", tags=["Admin"])
def update_student_details(
    student_id: str,
    payload: StudentUpdateSchema,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    # 1. Map Frontend fields to your ACTUAL Database Columns
    # Keys = Frontend Payload, Values = DB Column Name
    field_map = {
        "name": "name",
        "email": "email",
        "year": "year",
        "section": "section",
        "dob": "dob",
        "gender": "sex",      # Frontend sends 'gender', we save to 'sex'
        "department": "dept"  # Frontend sends 'department', we save to 'dept'
    }

    updates = {}
    incoming_data = payload.dict()

    # 2. Filter: Only prepare updates for columns that exist
    for frontend_key, db_column in field_map.items():
        if incoming_data.get(frontend_key) is not None:
            updates[db_column] = incoming_data[frontend_key]

    if not updates:
        return {"status": "success", "message": "No valid database fields changed (Phone/Address are visual only)."}

    # 3. Build SQL Query
    set_clause = ", ".join([f"{col} = ?" for col in updates.keys()])
    values = list(updates.values())
    values.append(student_id)

    try:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE students SET {set_clause} WHERE reg_no = ?", values)
        conn.commit()
        return {"status": "success", "message": "Student record updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/students/{student_id}/reset-password", tags=["Admin"])
def admin_reset_password(
    student_id: str,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """Resets password to Reg No."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE students SET password = reg_no WHERE reg_no = ?", (student_id,))
        conn.commit()
        return {"status": "success", "message": f"Password reset to {student_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/admin/dashboard-stats", tags=["Admin"])
def get_admin_dashboard_stats(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    cursor = conn.cursor()

    # 1. Count Students
    try:
        cursor.execute("SELECT COUNT(*) FROM students")
        student_count = cursor.fetchone()[0]
    except:
        student_count = 0

    # 2. Count Professors
    try:
        cursor.execute("SELECT COUNT(*) FROM teachers")
        prof_count = cursor.fetchone()[0]
    except:
        prof_count = 0

    # 3. Count Feed Posts (THE FIX)
    # Instead of guessing the SQL table name, we use the helper function 
    # that we know works for the feed tab.
    try:
        # We pass the admin's email to get the viewable feed
        feed_data = feed.get_feed_logic(conn, current_user['email'])
        feed_count = len(feed_data)
    except Exception as e:
        print(f"Error counting feed: {e}")
        feed_count = 0

    # 4. Count Announcements
    announcement_count = 0
    json_path = BASE_DIR / announcements.ANNOUNCEMENTS_FILE
    if json_path.exists():
        try:
            with open(json_path, "r") as f:
                data = json.load(f)
                announcement_count = len(data)
        except:
            pass

    return {
        "total_students": student_count,
        "total_professors": prof_count,
        "total_feed_posts": feed_count,
        "total_announcements": announcement_count
    }

@app.get("/api/admin/professors", tags=["Admin"])
def get_all_professors_admin(
    search: Optional[str] = "",
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    cursor = conn.cursor()
    
    # SCHEMA ALIGNMENT: teachers table has [id, name, subject, email, password]
    query = "SELECT id, name, email, subject FROM teachers"
    params = []

    if search:
        query += " WHERE name LIKE ? OR id LIKE ?"
        params = [f"%{search}%", f"%{search}%"]

    cursor.execute(query, params)
    rows = cursor.fetchall()

    professors = []
    for row in rows:
        r = dict(row)
        # We map DB columns to Frontend fields.
        professors.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "department": r["subject"],     # SCHEMA MAPPING: 'subject' -> 'department'
            "specialization": r["subject"], # SCHEMA MAPPING: 'subject' -> 'specialization'
            
            # --- SCHEMA ALIGNMENT: Data removed as requested (N/A) ---
            "designation": "Professor", 
            "joiningDate": "N/A",
            "phone": "N/A",
            "qualification": "N/A",
            "address": "N/A",
            "tags": [r["subject"]]
        })

    return professors

@app.put("/api/admin/professors/{prof_id}", tags=["Admin"])
def update_professor_details(
    prof_id: str,
    payload: ProfessorUpdateSchema,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    # 1. Prepare updates based strictly on the 'teachers' table columns: [name, email, subject]
    updates = {}
    if payload.name: 
        updates["name"] = payload.name
    if payload.email: 
        updates["email"] = payload.email
    if payload.department: 
        updates["subject"] = payload.department  # Mapping Frontend 'department' -> DB 'subject'

    if not updates:
        return {"status": "success", "message": "No changes detected."}

    # 2. Build SQL Query dynamically
    set_clause = ", ".join([f"{col} = ?" for col in updates.keys()])
    values = list(updates.values())
    values.append(prof_id)

    try:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE teachers SET {set_clause} WHERE id = ?", values)
        conn.commit()
        return {"status": "success", "message": "Professor record updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/professors/{prof_id}/reset-password", tags=["Admin"])
def admin_reset_professor_password(
    prof_id: str,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """Resets professor password to their ID."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    try:
        cursor = conn.cursor()
        # SCHEMA ALIGNMENT: 'id' and 'password' columns exist
        cursor.execute("UPDATE teachers SET password = id WHERE id = ?", (prof_id,))
        conn.commit()
        return {"status": "success", "message": f"Password reset to {prof_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/admin/timetable", tags=["Admin"])
def get_admin_timetable(
    section: str, 
    year: int,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """
    Fetches timetable slots for a specific Section and Year.
    Joins with 'teachers' table to get the professor's name.
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    cursor = conn.cursor()
    # We join with teachers table to get the name for the UI, but keep teacher_id for logic
    query = """
        SELECT t.id, t.section, t.year, t.day_of_week, t.start_time, t.end_time, 
               t.subject, t.teacher_id, t.room_number,
               te.name as teacher_name
        FROM timetable t
        LEFT JOIN teachers te ON t.teacher_id = te.id
        WHERE t.section = ? AND t.year = ?
    """
    cursor.execute(query, (section, year))
    rows = cursor.fetchall()
    
    return [dict(row) for row in rows]

@app.post("/api/admin/timetable", tags=["Admin"])
def add_timetable_slot(
    payload: TimetableSchema,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO timetable (section, year, day_of_week, start_time, end_time, subject, teacher_id, room_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (payload.section, payload.year, payload.day_of_week, payload.start_time, 
              payload.end_time, payload.subject, payload.teacher_id, payload.room_number))
        conn.commit()
        return {"status": "success", "message": "Slot added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/timetable/{slot_id}", tags=["Admin"])
def update_timetable_slot(
    slot_id: int,
    payload: TimetableSchema,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE timetable 
            SET section=?, year=?, day_of_week=?, start_time=?, end_time=?, 
                subject=?, teacher_id=?, room_number=?
            WHERE id=?
        """, (payload.section, payload.year, payload.day_of_week, payload.start_time, 
              payload.end_time, payload.subject, payload.teacher_id, payload.room_number, slot_id))
        conn.commit()
        return {"status": "success", "message": "Slot updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/timetable/{slot_id}", tags=["Admin"])
def delete_timetable_slot(
    slot_id: int,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM timetable WHERE id=?", (slot_id,))
        conn.commit()
        return {"status": "success", "message": "Slot deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/feed/delete/{post_id}", tags=["Feed"])
def delete_feed_post(
    post_id: str,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    result = feed.delete_post_logic(
        conn,
        post_id,
        current_user["email"],
        current_user["role"]
    )

    if result.get("status") != "success":
        raise HTTPException(status_code=403, detail=result.get("message"))

    return result

@app.get("/api/me", tags=["Auth"])
def get_current_user_profile(current_user: Dict = Depends(get_current_user)):
    """
    Returns the basic profile of the currently logged-in user.
    Useful for populating UI headers/sidebars.
    """
    return {
        "id": current_user.get("id", current_user.get("reg_no")), # Handle student vs prof ID differences
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

@app.get("/api/professor/reports/classes", tags=["Professor Dashboard"])
def get_report_classes(
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")
    return attendance.get_professor_distinct_classes(conn, current_user["id"])

# 2. Endpoint to get the Table Data
@app.get("/api/professor/reports/summary", tags=["Professor Dashboard"])
def get_report_summary(
    subject: str, section: str, year: int,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")
    return attendance.get_class_attendance_summary(conn, current_user["id"], subject, section, year)

# 3. Endpoint for CSV Export
@app.get("/api/professor/reports/export", tags=["Professor Dashboard"])
def export_attendance_csv(
    subject: str, section: str, year: int,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    data = attendance.get_class_attendance_summary(conn, current_user["id"], subject, section, year)
    class_info = f"{subject}_{year}_{section}"
    return attendance.generate_csv_report(data, class_info)

# 4. Endpoint for Student History Modal
@app.get("/api/professor/reports/student-history", tags=["Professor Dashboard"])
def get_student_history_report(
    subject: str, section: str, year: int, reg_no: str,
    current_user: Dict = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    return attendance.get_student_history_for_class(conn, current_user["id"], subject, section, year, reg_no)
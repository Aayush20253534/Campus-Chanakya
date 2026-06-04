from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv
from pathlib import Path
import shutil
import os
import json
import uuid
import psycopg
from psycopg.rows import dict_row

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
CLUBS_FILE = DATA_DIR / "clubs.json"
ASSIGNMENT_DIR = DATA_DIR / "assignments"

ASSIGNMENT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

SECRET_KEY = os.getenv("SECRET_KEY", "campus_chanakya_secret_key")
ALGORITHM = "HS256"
DATABASE_URL = os.getenv("DATABASE_URL")

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


class StudentSignupSchema(BaseModel):
    reg_no: str
    name: str
    email: str
    password: str
    gender: str
    dob: str
    department: str
    section: str
    year: int
    hostel: Optional[str] = "Not Assigned"


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
    deadline: str


class StudentAIRequest(BaseModel):
    assignment_description: str
    query: Optional[str] = ""
    mode: str


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


_raw_origins = os.getenv("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL is not set in .env")

    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()


def get_current_user(token: str = Depends(oauth2_scheme), conn=Depends(get_db_connection)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role", "student")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if role == "admin":
        return {
            "id": "admin",
            "name": "Administrator",
            "email": "admin123",
            "role": "admin",
        }

    cursor = conn.cursor()

    if role == "professor":
        cursor.execute("SELECT * FROM teachers WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            return dict(user) | {"role": "professor"}

    else:
        cursor.execute("SELECT * FROM students WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            student_dict = dict(user) | {"role": "student"}
            student_dict["department"] = student_dict.get("dept", "")
            student_dict["gender"] = student_dict.get("sex", "")
            return student_dict

    raise HTTPException(status_code=404, detail="User not found")


@app.get("/api/clubs", tags=["Clubs"])
def get_all_clubs(
    category: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    return clubs.get_all_clubs_logic(CLUBS_FILE, conn, current_user, category)


@app.post("/api/clubs/recommendations", tags=["Clubs"])
def get_club_recommendations(
    request: clubs.RecommendRequest,
    current_user: Dict = Depends(get_current_user),
):
    return clubs.recommend_clubs_ai(CLUBS_FILE, request)


@app.put("/api/clubs/{club_id}/update", tags=["Clubs"])
def update_club_full_details(
    club_id: str,
    payload: clubs.ClubUpdateSchema,
    current_user: Dict = Depends(get_current_user),
):
    return clubs.update_club_logic(CLUBS_FILE, club_id, payload, current_user)


@app.get("/api/professor/dashboard", tags=["Professor Dashboard"])
def get_professor_classes(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user.get("role") != "professor":
        raise HTTPException(status_code=403, detail="Access denied. Professors only.")

    professor_id = current_user["id"]
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, day_of_week, subject, year, section, start_time, end_time, room_number
        FROM timetable
        WHERE teacher_id = %s
        ORDER BY
            CASE
                WHEN day_of_week = 'Monday' THEN 1
                WHEN day_of_week = 'Tuesday' THEN 2
                WHEN day_of_week = 'Wednesday' THEN 3
                WHEN day_of_week = 'Thursday' THEN 4
                WHEN day_of_week = 'Friday' THEN 5
                ELSE 6
            END, start_time
        """,
        (professor_id,),
    )

    classes = [dict(row) for row in cursor.fetchall()]

    return {
        "professor_name": current_user["name"],
        "classes": classes,
    }


@app.get("/api/professor/roster/{timetable_id}", tags=["Professor Dashboard"])
def get_class_roster_endpoint(
    timetable_id: int,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
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
    conn=Depends(get_db_connection),
):
    if current_user.get("role") != "professor":
        raise HTTPException(status_code=403, detail="Access denied. Professors only.")

    try:
        return attendance.mark_bulk_attendance(
            conn,
            payload.timetable_id,
            payload.date,
            payload.records,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")


@app.get("/api/attendance/timetable", response_model=List[attendance.TimetableEntry], tags=["Student View"])
def get_timetable(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user.get("role") == "professor":
        return []

    return attendance.fetch_student_timetable(conn, current_user)


@app.get("/api/attendance/stats", tags=["Student View"])
def get_stats(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user.get("role") == "professor":
        return []

    return attendance.calculate_attendance_stats(conn, current_user)


@app.post("/api/attendance/chanakya-consult", tags=["Student View"])
async def consult_ai(
    request: attendance.AIAdviceRequest,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    response_text = attendance.get_ai_advice(conn, current_user, request.query)
    return {"response": response_text}


@app.get("/api/attendance/history", tags=["Student View"])
def get_attendance_history(
    subject: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user.get("role") == "professor":
        return []

    return attendance.fetch_attendance_history(conn, current_user, subject)


@app.post("/api/signup/student", tags=["Auth"])
def signup_student(
    payload: StudentSignupSchema,
    conn=Depends(get_db_connection),
):
    cursor = conn.cursor()

    reg_no = payload.reg_no.strip()
    name = payload.name.strip()
    email = payload.email.strip().lower()

    if not reg_no or not name or not email or not payload.password:
        raise HTTPException(status_code=400, detail="Required fields missing.")

    cursor.execute(
        "SELECT reg_no FROM students WHERE reg_no = %s OR email = %s",
        (reg_no, email),
    )

    existing = cursor.fetchone()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Student with this registration number or email already exists.",
        )

    hashed_password = pwd_context.hash(payload.password)
    hostel = (payload.hostel or "Not Assigned").strip() or "Not Assigned"

    cursor.execute(
        """
        INSERT INTO students (
            reg_no, name, email, password, sex, dob, dept, section, year, hostel
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            reg_no,
            name,
            email,
            hashed_password,
            payload.gender,
            payload.dob,
            payload.department,
            payload.section,
            payload.year,
            hostel,
        ),
    )

    conn.commit()

    return {
        "status": "success",
        "message": "Student account created successfully.",
    }


@app.post("/api/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    conn=Depends(get_db_connection),
):
    identifier = form_data.username
    password_input = form_data.password

    if identifier == "admin123" and password_input == "admin123":
        token_data = {"sub": "admin123", "role": "admin"}
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "admin",
            "name": "System Administrator",
        }

    cursor = conn.cursor()

    cursor.execute("SELECT * FROM teachers WHERE email = %s", (identifier,))
    teacher = cursor.fetchone()

    if teacher:
        if teacher["password"] == password_input:
            token_data = {
                "sub": teacher["email"],
                "role": "professor",
                "id": teacher["id"],
            }

            token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "professor",
                "name": teacher["name"],
            }

    cursor.execute(
        "SELECT * FROM students WHERE email = %s OR reg_no = %s",
        (identifier, identifier),
    )

    student = cursor.fetchone()

    if student:
        stored_pw = str(student["password"])
        reg_no = str(student["reg_no"])
        password_valid = False
        is_default_password = stored_pw == reg_no

        if is_default_password:
            password_valid = password_input == reg_no
        else:
            try:
                password_valid = pwd_context.verify(password_input, stored_pw)
            except Exception:
                password_valid = stored_pw == password_input

        if password_valid:
            token_data = {
                "sub": student["email"],
                "role": "student",
                "reg_no": student["reg_no"],
            }

            token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "student",
                "student_name": student["name"],
                "year": student["year"],
                "section": student["section"],
                "department": student["dept"],
                "reg_no": student["reg_no"],
                "hostel": student.get("hostel", "Not Assigned"),
                "is_first_login": is_default_password,
            }

    raise HTTPException(status_code=401, detail="Invalid Credentials")


@app.post("/api/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    role = current_user.get("role")
    cursor = conn.cursor()

    if role == "student":
        stored_password = str(current_user["password"])
        reg_no = str(current_user["reg_no"])
        email = current_user["email"]

        if stored_password == reg_no:
            password_verified = request.old_password == reg_no
        else:
            password_verified = pwd_context.verify(request.old_password, stored_password)

        if not password_verified:
            raise HTTPException(status_code=400, detail="Old password incorrect")

        new_hash = pwd_context.hash(request.new_password)

        cursor.execute(
            "UPDATE students SET password = %s WHERE email = %s",
            (new_hash, email),
        )

        conn.commit()

        return {"status": "success", "message": "Password changed successfully"}

    if role == "professor":
        stored_password = str(current_user["password"])
        professor_id = str(current_user["id"])
        email = current_user["email"]

        if stored_password == professor_id:
            password_verified = request.old_password == professor_id
        else:
            password_verified = stored_password == request.old_password

        if not password_verified:
            raise HTTPException(status_code=400, detail="Old password incorrect")

        cursor.execute(
            "UPDATE teachers SET password = %s WHERE email = %s",
            (request.new_password, email),
        )

        conn.commit()

        return {"status": "success", "message": "Password changed successfully"}

    raise HTTPException(status_code=400, detail="Password change not allowed")


@app.post("/api/announcements/add")
async def add_announcement_endpoint(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    notes: str = Form(""),
    files: List[UploadFile] = File(default=[]),
):
    try:
        new_id = str(uuid.uuid4())
        saved_file_paths = []
        web_file_urls = []

        if files:
            for file in files:
                if not file.filename:
                    continue

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
            "file_paths": web_file_urls,
        }

        json_path = BASE_DIR / announcements.ANNOUNCEMENTS_FILE

        if json_path.exists():
            with open(json_path, "r") as f:
                try:
                    data = json.load(f)
                except Exception:
                    data = {}
        else:
            data = {}

        data[new_id] = placeholder_data

        with open(json_path, "w") as f:
            json.dump(data, f, indent=4)

        background_tasks.add_task(
            announcements.process_existing_announcement,
            announcement_id=new_id,
            file_paths=saved_file_paths,
            admin_notes=f"{title}\n{notes}",
        )

        return {"status": "success", "message": "Upload started", "id": new_id}

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")


@app.put("/api/announcements/{announcement_id}/enable")
def enable_notice(announcement_id: str):
    success, msg = announcements.enable_announcement(announcement_id)

    if not success:
        raise HTTPException(status_code=404, detail=msg)

    return {"status": "success", "message": msg}


@app.get("/api/announcements")
def get_all_announcements(admin_view: bool = False):
    json_path = BASE_DIR / announcements.ANNOUNCEMENTS_FILE

    if not json_path.exists():
        return []

    try:
        with open(json_path, "r") as f:
            data = json.load(f)
    except Exception:
        return []

    results_list = []

    for aid, item in data.items():
        if not admin_view and not item.get("active", True):
            continue

        item["id"] = aid

        if "file_path" in item and "file_paths" not in item:
            item["file_paths"] = [item["file_path"]]

        results_list.append(item)

    results_list.sort(key=lambda x: x.get("upload_date", ""), reverse=True)

    return results_list


@app.put("/api/announcements/{announcement_id}/update")
def update_announcement_endpoint(announcement_id: str, payload: UpdateAnnouncementSchema):
    updates = payload.dict(exclude_unset=True)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided")

    success, message = announcements.update_announcement(announcement_id, updates)

    if not success:
        raise HTTPException(status_code=404, detail=message)

    return {"status": "success", "message": "Updated"}


@app.put("/api/announcements/{announcement_id}/disable")
def disable_notice(announcement_id: str):
    success, msg = announcements.disable_announcement(announcement_id)

    if not success:
        raise HTTPException(status_code=404, detail=msg)

    return {"status": "success", "message": msg}


@app.get("/api/teacher/my-classes")
def get_teacher_classes_endpoint(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")

    return assignment.get_teacher_classes(current_user["id"])


@app.post("/api/assignments")
async def create_assignment_endpoint(
    subject: str = Form(...),
    section: str = Form(...),
    year: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    deadline: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")

    file_url = None

    if file and file.filename:
        try:
            unique_name = f"{uuid.uuid4()}_{file.filename}"
            file_dest = ASSIGNMENT_DIR / unique_name

            with open(file_dest, "wb+") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_url = f"/data/assignments/{unique_name}"

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    data = {
        "teacher_id": current_user["id"],
        "subject": subject,
        "section": section,
        "year": year,
        "title": title,
        "description": description,
        "deadline": deadline,
        "file_path": file_url,
    }

    success, msg = assignment.create_assignment(data)

    if not success:
        raise HTTPException(status_code=500, detail=msg)

    return {"status": "success", "message": "Assignment created successfully"}


@app.get("/api/student/assignments")
def get_my_assignments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Unauthorized")

    return assignment.get_student_assignments(current_user["reg_no"])


@app.post("/api/student/ai-assistant")
def get_assignment_help(payload: StudentAIRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Unauthorized")

    response_text = assignment.ai_get_help(
        payload.assignment_description,
        payload.query,
        payload.mode,
    )

    return {"ai_response": response_text}


@app.get("/api/timetable/class-details", response_model=ClassModalResponse, tags=["Student View"])
def get_class_details_endpoint(
    subject: str,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student access only")

    all_stats = attendance.calculate_attendance_stats(conn, current_user)

    subject_stat = None

    for item in all_stats:
        item_dict = dict(item)

        if item_dict.get("subject", "").lower() == subject.lower():
            subject_stat = item_dict
            break

    teacher_name = "N/A"

    try:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT t.name
            FROM teachers t
            JOIN timetable tt ON t.id = tt.teacher_id
            WHERE tt.subject = %s AND tt.section = %s AND tt.year = %s
            LIMIT 1
            """,
            (subject, current_user["section"], current_user["year"]),
        )

        row = cursor.fetchone()

        if row:
            teacher_name = row["name"]
        else:
            cursor.execute(
                """
                SELECT name FROM teachers
                WHERE subject = %s
                LIMIT 1
                """,
                (subject,),
            )

            row_legacy = cursor.fetchone()

            if row_legacy and row_legacy.get("name"):
                teacher_name = row_legacy["name"]

    except Exception as e:
        print(f"Error fetching teacher: {e}")

    if not subject_stat:
        return {
            "subject": subject,
            "attendance_percentage": 100.0,
            "attended": 0,
            "total": 0,
            "status": "Neutral",
            "advice": "No attendance records yet. Go to class!",
            "teacher": teacher_name,
        }

    pct = subject_stat.get("percentage", 0)
    attended = subject_stat.get("attended", subject_stat.get("present", 0))
    total = subject_stat.get("total", subject_stat.get("total_classes", 0))

    status = "Safe"
    advice = "You are in good standing."

    if pct < 75:
        status = "Critical"

        if total > 0:
            try:
                required = int(((0.75 * total) - attended) / 0.25)

                if required < 0:
                    required = 0

                advice = f"ATTENDANCE ALERT! You must attend the next {required} classes to hit 75%."

            except Exception:
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
        "subject": subject_stat.get("subject", subject),
        "attendance_percentage": pct,
        "attended": attended,
        "total": total,
        "status": status,
        "advice": advice,
        "teacher": teacher_name,
    }


@app.get("/api/teacher/results/students", tags=["Results"])
def get_students_for_grading(
    section: str,
    year: int,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")

    student_list = results.get_students_for_teacher(conn, section, year)

    if not student_list:
        raise HTTPException(status_code=404, detail="No students found for this class configuration")

    return student_list


@app.get("/api/student/results", tags=["Results"])
def view_my_results(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Unauthorized")

    return results.get_student_results(conn, current_user["email"])


@app.get("/api/teacher/results/classes", tags=["Results"])
def get_classes_for_results(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")

    return results.get_teacher_classes(conn, current_user["id"])


@app.post("/api/teacher/results/submit", tags=["Results"])
def submit_student_results(
    payload: results.ResultSubmission,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized: Professors only")

    success, message = results.submit_class_results(conn, payload)

    if not success:
        raise HTTPException(status_code=500, detail=f"Submission failed: {message}")

    return {"status": "success", "message": message}


@app.get("/api/feed", tags=["Feed"])
def get_feed(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    return feed.get_feed_logic(conn, current_user["email"])


@app.post("/api/feed/create", tags=["Feed"])
def create_feed_post(
    payload: FeedPostSchema,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    return feed.create_post_logic(
        conn,
        current_user["email"],
        current_user["role"],
        payload.dict(),
    )


@app.post("/api/feed/vote", tags=["Feed"])
def vote_feed_post(
    payload: VoteSchema,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if payload.vote_type not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")

    new_count = feed.vote_post_logic(
        conn,
        current_user["email"],
        payload.post_id,
        payload.vote_type,
    )

    return {"status": "success", "new_count": new_count}


@app.get("/api/professor/assignments")
def get_created_assignments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")

    return assignment.get_professor_assignments_logic(current_user["id"])


@app.get("/api/admin/students", tags=["Admin"])
def get_all_students_admin(
    search: Optional[str] = "",
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    cursor = conn.cursor()

    query = """
        SELECT reg_no, name, email, sex, dob, dept, section, year
        FROM students
    """

    params = []

    if search:
        query += " WHERE reg_no ILIKE %s OR name ILIKE %s"
        params = [f"%{search}%", f"%{search}%"]

    cursor.execute(query, params)
    rows = cursor.fetchall()

    students = []

    for row in rows:
        r = dict(row)

        students.append(
            {
                "id": r["reg_no"],
                "name": r["name"],
                "email": r["email"],
                "section": r["section"],
                "year": r["year"],
                "dob": r["dob"],
                "gender": r["sex"],
                "department": r["dept"],
                "hostel": "Not Assigned",
                "phone": "N/A",
                "address": "N/A",
                "enrollmentDate": "2024-01-01",
                "tags": [f"Year {r['year']}", r["section"]],
            }
        )

    return students


@app.put("/api/admin/students/{student_id}", tags=["Admin"])
def update_student_details(
    student_id: str,
    payload: StudentUpdateSchema,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    field_map = {
        "name": "name",
        "email": "email",
        "year": "year",
        "section": "section",
        "dob": "dob",
        "gender": "sex",
        "department": "dept",
    }

    updates = {}
    incoming_data = payload.dict()

    for frontend_key, db_column in field_map.items():
        if incoming_data.get(frontend_key) is not None:
            updates[db_column] = incoming_data[frontend_key]

    if not updates:
        return {
            "status": "success",
            "message": "No valid database fields changed (Phone/Address are visual only).",
        }

    set_clause = ", ".join([f"{col} = %s" for col in updates.keys()])
    values = list(updates.values())
    values.append(student_id)

    try:
        cursor = conn.cursor()

        cursor.execute(
            f"UPDATE students SET {set_clause} WHERE reg_no = %s",
            values,
        )

        conn.commit()

        return {"status": "success", "message": "Student record updated successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/students/{student_id}/reset-password", tags=["Admin"])
def admin_reset_password(
    student_id: str,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    try:
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE students SET password = reg_no WHERE reg_no = %s",
            (student_id,),
        )

        conn.commit()

        return {"status": "success", "message": f"Password reset to {student_id}"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/dashboard-stats", tags=["Admin"])
def get_admin_dashboard_stats(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COUNT(*) AS count FROM students")
        student_count = cursor.fetchone()["count"]
    except Exception:
        student_count = 0

    try:
        cursor.execute("SELECT COUNT(*) AS count FROM teachers")
        prof_count = cursor.fetchone()["count"]
    except Exception:
        prof_count = 0

    try:
        feed_data = feed.get_feed_logic(conn, current_user["email"])
        feed_count = len(feed_data)
    except Exception as e:
        print(f"Error counting feed: {e}")
        feed_count = 0

    announcement_count = 0
    json_path = BASE_DIR / announcements.ANNOUNCEMENTS_FILE

    if json_path.exists():
        try:
            with open(json_path, "r") as f:
                data = json.load(f)
                announcement_count = len(data)
        except Exception:
            pass

    return {
        "total_students": student_count,
        "total_professors": prof_count,
        "total_feed_posts": feed_count,
        "total_announcements": announcement_count,
    }


@app.get("/api/admin/professors", tags=["Admin"])
def get_all_professors_admin(
    search: Optional[str] = "",
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    cursor = conn.cursor()

    query = "SELECT id, name, email, subject FROM teachers"
    params = []

    if search:
        query += " WHERE name ILIKE %s OR id ILIKE %s"
        params = [f"%{search}%", f"%{search}%"]

    cursor.execute(query, params)
    rows = cursor.fetchall()

    professors = []

    for row in rows:
        r = dict(row)

        professors.append(
            {
                "id": r["id"],
                "name": r["name"],
                "email": r["email"],
                "department": r["subject"],
                "specialization": r["subject"],
                "designation": "Professor",
                "joiningDate": "N/A",
                "phone": "N/A",
                "qualification": "N/A",
                "address": "N/A",
                "tags": [r["subject"]],
            }
        )

    return professors


@app.put("/api/admin/professors/{prof_id}", tags=["Admin"])
def update_professor_details(
    prof_id: str,
    payload: ProfessorUpdateSchema,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    updates = {}

    if payload.name:
        updates["name"] = payload.name

    if payload.email:
        updates["email"] = payload.email

    if payload.department:
        updates["subject"] = payload.department

    if not updates:
        return {"status": "success", "message": "No changes detected."}

    set_clause = ", ".join([f"{col} = %s" for col in updates.keys()])
    values = list(updates.values())
    values.append(prof_id)

    try:
        cursor = conn.cursor()

        cursor.execute(
            f"UPDATE teachers SET {set_clause} WHERE id = %s",
            values,
        )

        conn.commit()

        return {"status": "success", "message": "Professor record updated successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/professors/{prof_id}/reset-password", tags=["Admin"])
def admin_reset_professor_password(
    prof_id: str,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    try:
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE teachers SET password = id WHERE id = %s",
            (prof_id,),
        )

        conn.commit()

        return {"status": "success", "message": f"Password reset to {prof_id}"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/timetable", tags=["Admin"])
def get_admin_timetable(
    section: str,
    year: int,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admins only.")

    cursor = conn.cursor()

    query = """
        SELECT t.id, t.section, t.year, t.day_of_week, t.start_time, t.end_time,
               t.subject, t.teacher_id, t.room_number,
               te.name AS teacher_name
        FROM timetable t
        LEFT JOIN teachers te ON t.teacher_id = te.id
        WHERE t.section = %s AND t.year = %s
    """

    cursor.execute(query, (section, year))
    rows = cursor.fetchall()

    return [dict(row) for row in rows]


@app.post("/api/admin/timetable", tags=["Admin"])
def add_timetable_slot(
    payload: TimetableSchema,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO timetable (
                section, year, day_of_week, start_time, end_time,
                subject, teacher_id, room_number
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload.section,
                payload.year,
                payload.day_of_week,
                payload.start_time,
                payload.end_time,
                payload.subject,
                payload.teacher_id,
                payload.room_number,
            ),
        )

        conn.commit()

        return {"status": "success", "message": "Slot added successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/admin/timetable/{slot_id}", tags=["Admin"])
def update_timetable_slot(
    slot_id: int,
    payload: TimetableSchema,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE timetable
            SET section = %s,
                year = %s,
                day_of_week = %s,
                start_time = %s,
                end_time = %s,
                subject = %s,
                teacher_id = %s,
                room_number = %s
            WHERE id = %s
            """,
            (
                payload.section,
                payload.year,
                payload.day_of_week,
                payload.start_time,
                payload.end_time,
                payload.subject,
                payload.teacher_id,
                payload.room_number,
                slot_id,
            ),
        )

        conn.commit()

        return {"status": "success", "message": "Slot updated successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/timetable/{slot_id}", tags=["Admin"])
def delete_timetable_slot(
    slot_id: int,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        cursor = conn.cursor()

        cursor.execute("DELETE FROM timetable WHERE id = %s", (slot_id,))

        conn.commit()

        return {"status": "success", "message": "Slot deleted successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/feed/delete/{post_id}", tags=["Feed"])
def delete_feed_post(
    post_id: str,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    result = feed.delete_post_logic(
        conn,
        post_id,
        current_user["email"],
        current_user["role"],
    )

    if result.get("status") != "success":
        raise HTTPException(status_code=403, detail=result.get("message"))

    return result


@app.get("/api/me", tags=["Auth"])
def get_current_user_profile(current_user: Dict = Depends(get_current_user)):
    return {
        "id": current_user.get("id", current_user.get("reg_no")),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
    }


@app.get("/api/professor/reports/classes", tags=["Professor Dashboard"])
def get_report_classes(
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")

    return attendance.get_professor_distinct_classes(conn, current_user["id"])


@app.get("/api/professor/reports/summary", tags=["Professor Dashboard"])
def get_report_summary(
    subject: str,
    section: str,
    year: int,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")

    return attendance.get_class_attendance_summary(
        conn,
        current_user["id"],
        subject,
        section,
        year,
    )


@app.get("/api/professor/reports/export", tags=["Professor Dashboard"])
def export_attendance_csv(
    subject: str,
    section: str,
    year: int,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")

    data = attendance.get_class_attendance_summary(
        conn,
        current_user["id"],
        subject,
        section,
        year,
    )

    class_info = f"{subject}_{year}_{section}"

    return attendance.generate_csv_report(data, class_info)


@app.get("/api/professor/reports/student-history", tags=["Professor Dashboard"])
def get_student_history_report(
    subject: str,
    section: str,
    year: int,
    reg_no: str,
    current_user: Dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    if current_user["role"] != "professor":
        raise HTTPException(status_code=403, detail="Unauthorized")

    return attendance.get_student_history_for_class(
        conn,
        current_user["id"],
        subject,
        section,
        year,
        reg_no,
    )


@app.get("/api/debug/db")
def debug_db(conn=Depends(get_db_connection)):
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS count FROM students")
    students = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM teachers")
    teachers = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM timetable")
    timetable = cursor.fetchone()["count"]

    return {
        "database": "Neon PostgreSQL",
        "students": students,
        "teachers": teachers,
        "timetable": timetable,
    }
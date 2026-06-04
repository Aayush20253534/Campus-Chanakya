import json
import os
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types


class RecruitmentUpdate(BaseModel):
    is_hiring: bool
    roles_open: List[str]
    apply_link: str


class ClubUpdateSchema(BaseModel):
    name: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    recruitment_status: Optional[RecruitmentUpdate] = None


class RecommendRequest(BaseModel):
    interests: str
    department: Optional[str] = "General"
    year: Optional[str] = "Current"


class ClubRecItem(BaseModel):
    id: str
    match_score: int
    reason: str


class RecommendationResponse(BaseModel):
    recommendations: List[ClubRecItem]


def get_students_bulk(conn, reg_nos: List[str]):
    if not reg_nos:
        return {}

    placeholders = ",".join(["%s"] * len(reg_nos))
    query = f"""
        SELECT reg_no, name, email, year, section
        FROM students
        WHERE reg_no IN ({placeholders})
    """

    cursor = conn.cursor()
    cursor.execute(query, tuple(reg_nos))
    rows = cursor.fetchall()

    return {row["reg_no"]: dict(row) for row in rows}


def get_all_clubs_logic(clubs_file, conn, current_user, category=None):
    if not clubs_file.exists():
        return []

    try:
        with open(clubs_file, "r") as f:
            clubs_data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

    if category:
        clubs_data = [
            c for c in clubs_data
            if c.get("category", "").lower() == category.lower()
        ]

    all_reg_nos = set()
    for club in clubs_data:
        all_reg_nos.update(club.get("coordinators", []))
        all_reg_nos.update(club.get("members", []))

    student_map = get_students_bulk(conn, list(all_reg_nos))

    user_reg_no = str(current_user.get("reg_no", ""))
    user_role = current_user.get("role", "student")

    for club in clubs_data:
        is_coordinator = user_reg_no in club.get("coordinators", [])
        is_member = user_reg_no in club.get("members", [])

        if is_coordinator:
            club["user_status"] = "coordinator"
        elif is_member:
            club["user_status"] = "member"
        else:
            club["user_status"] = "none"

        hydrated_coords = []
        for reg_no in club.get("coordinators", []):
            hydrated_coords.append(student_map.get(reg_no, {"reg_no": reg_no, "name": "Unknown"}))
        club["coordinators"] = hydrated_coords

        hydrated_members = []
        for reg_no in club.get("members", []):
            if reg_no in student_map:
                m_data = student_map[reg_no].copy()
                if not is_coordinator and user_role != "professor":
                    m_data.pop("email", None)
                    m_data.pop("section", None)
                hydrated_members.append(m_data)
        club["members"] = hydrated_members
        club["member_count"] = len(hydrated_members)

    return clubs_data


def update_club_logic(clubs_file, club_id, payload: ClubUpdateSchema, current_user):
    user_reg_no = str(current_user.get("reg_no", ""))

    with open(clubs_file, "r") as f:
        clubs_data = json.load(f)

    club_idx = next((i for i, c in enumerate(clubs_data) if c["id"] == club_id), -1)
    if club_idx == -1:
        raise HTTPException(status_code=404, detail="Club not found")

    club = clubs_data[club_idx]

    if user_reg_no not in club.get("coordinators", []) and current_user.get("role") != "professor":
        raise HTTPException(status_code=403, detail="Access Denied: Only coordinators can update club details.")

    if payload.name:
        club["name"] = payload.name
    if payload.short_description:
        club["short_description"] = payload.short_description
    if payload.full_description:
        club["full_description"] = payload.full_description
    if payload.category:
        club["category"] = payload.category
    if payload.tags:
        club["tags"] = payload.tags

    if payload.recruitment_status:
        club["recruitment_status"] = {
            "is_hiring": payload.recruitment_status.is_hiring,
            "roles_open": payload.recruitment_status.roles_open,
            "apply_link": payload.recruitment_status.apply_link,
        }

    with open(clubs_file, "w") as f:
        json.dump(clubs_data, f, indent=4)

    return {"status": "success", "message": "Club details updated successfully"}


def recommend_clubs_ai(clubs_file, request: RecommendRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY is missing from environment variables.")
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    if not clubs_file.exists():
        return []

    with open(clubs_file, "r") as f:
        clubs_data = json.load(f)

    club_summaries = []
    for c in clubs_data:
        club_summaries.append(
            {
                "id": c["id"],
                "name": c["name"],
                "tags": c.get("tags", []),
                "description": c.get("short_description", "") + " " + c.get("full_description", "")[:100],
                "category": c.get("category", ""),
            }
        )

    prompt_text = f"""
    You are 'Campus Chanakya', a wise and insightful university student advisor.
    Your goal is to connect students with communities where they will thrive.

    Student Profile:
    - User's Interests/Query: "{request.interests}"
    - Department: "{request.department}"
    - Year: "{request.year}"

    Available Clubs List:
    {json.dumps(club_summaries)}

    Task:
    1. Analyze the student's input and identify keywords.
    2. Select the top 3 clubs that best align with their profile.
    3. If the input is vague, infer general social clubs.
    4. Provide a match_score from 0 to 100.
    5. Write a conversational reason under 2 sentences.

    Output Schema:
    Provide a list of objects with id, match_score, and reason.
    """

    client = genai.Client(api_key=api_key)

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt_text,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RecommendationResponse,
            ),
        )

        if not response.parsed:
            return []

        recommendations = response.parsed.recommendations

        final_results = []
        for rec in recommendations:
            original_club = next((c for c in clubs_data if c["id"] == rec.id), None)
            if original_club:
                result_obj = original_club.copy()
                result_obj["ai_match_score"] = rec.match_score
                result_obj["ai_reason"] = rec.reason
                final_results.append(result_obj)

        final_results.sort(key=lambda x: x.get("ai_match_score", 0), reverse=True)
        return final_results

    except Exception as e:
        print(f"AI Generation Error: {str(e)}")
        return []

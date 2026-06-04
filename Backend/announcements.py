import json
import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from pypdf import PdfReader

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ANNOUNCEMENTS_FILE = "data/announcements.json"

VALID_CATEGORIES = [
    "Academic",
    "Examination",
    "Administrative",
    "Placement",
    "Clubs & Societies",
]

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

if not GEMINI_API_KEY:
    logger.error("CRITICAL: GEMINI_API_KEY not found")


def _safe_json_load(path: str):
    if not os.path.exists(path):
        return {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _safe_json_write(path: str, data: dict):
    Path(path).parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Lightweight PDF text extraction.
    Works for text-based PDFs.
    Scanned PDFs/images are handled by Gemini directly.
    """
    try:
        reader_pdf = PdfReader(file_path)
        text_buffer = ""

        for page in reader_pdf.pages:
            content = page.extract_text()
            if content:
                text_buffer += content + "\n"

        return text_buffer.strip()

    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return ""


def analyze_file_with_gemini(file_path: str, admin_notes: str):
    """
    Sends PDF/image directly to Gemini.
    This replaces EasyOCR/pdf2image/torch, because apparently RAM is not infinite.
    """
    if not client:
        logger.error("Gemini client unavailable")
        return None

    try:
        uploaded_file = client.files.upload(file=file_path)

        prompt = f"""
Analyze this college notice/document. It may be in Hindi, English, or mixed language.

Admin Notes:
{admin_notes}

Tasks:
1. Read/extract the document text.
2. Understand the notice.
3. Return ONLY valid JSON.
4. All generated answers must be in English.
5. Tags must be maximum 3, preferably 1 or 2 only.
6. Category must be one of:
{VALID_CATEGORIES}

JSON schema:
{{
  "ai_generated_title": "Catchy headline, max 6 words",
  "ai_generated_category": "Academic | Examination | Administrative | Placement | Clubs & Societies",
  "ai_generated_tags": ["tag1", "tag2"],
  "ai_generated_short_summary": "One sentence summary",
  "ai_generated_descriptive_summary": "Detailed paragraph summary",
  "ai_generated_relevance_score": 0,
  "extracted_deadline": "YYYY-MM-DD or null"
}}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded_file, prompt],
        )

        clean_json = (
            response.text
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        return json.loads(clean_json)

    except Exception as e:
        logger.error(f"Gemini file analysis failed: {e}")
        return None


def generate_ai_metadata(file_text: str, admin_notes: str):
    """
    Fallback for text-based PDFs or notes-only announcements.
    """
    if not client:
        return None

    file_content_display = file_text if len(file_text.strip()) > 10 else "[No readable document text]"

    prompt = f"""
Analyze this college notice.

ADMIN NOTES:
{admin_notes}

DOCUMENT TEXT:
{file_content_display}

Return ONLY valid JSON.
All generated answers must be in English.
Tags must be maximum 3, preferably 1 or 2.
Category must be one of:
{VALID_CATEGORIES}

JSON schema:
{{
  "ai_generated_title": "Catchy headline, max 6 words",
  "ai_generated_category": "Academic | Examination | Administrative | Placement | Clubs & Societies",
  "ai_generated_tags": ["tag1", "tag2"],
  "ai_generated_short_summary": "One sentence summary",
  "ai_generated_descriptive_summary": "Detailed paragraph summary",
  "ai_generated_relevance_score": 0,
  "extracted_deadline": "YYYY-MM-DD or null"
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        clean_json = (
            response.text
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        return json.loads(clean_json)

    except Exception as e:
        logger.error(f"Gemini metadata generation failed: {e}")
        return None


def _normalize_ai_data(ai_data: dict):
    if not ai_data:
        return None

    category = ai_data.get("ai_generated_category", "Administrative")

    if category not in VALID_CATEGORIES:
        category = "Administrative"

    tags = ai_data.get("ai_generated_tags", [])
    if not isinstance(tags, list):
        tags = []

    return {
        "ai_generated_title": ai_data.get("ai_generated_title", "Notice Update"),
        "ai_generated_category": category,
        "ai_generated_tags": tags[:3],
        "ai_generated_short_summary": ai_data.get(
            "ai_generated_short_summary",
            "A new college notice has been uploaded.",
        ),
        "ai_generated_descriptive_summary": ai_data.get(
            "ai_generated_descriptive_summary",
            "The uploaded notice could not be fully summarized.",
        ),
        "ai_generated_relevance_score": int(ai_data.get("ai_generated_relevance_score", 50) or 50),
        "extracted_deadline": ai_data.get("extracted_deadline"),
    }


def process_existing_announcement(announcement_id: str, file_paths: list, admin_notes: str):
    print(f"--> [Background] Processing started for ID: {announcement_id}")

    if isinstance(file_paths, str):
        file_paths = [file_paths]

    ai_data = None
    full_text_buffer = ""

    try:
        # Best path: send uploaded file directly to Gemini.
        if file_paths:
            for path in file_paths:
                if not path or not os.path.exists(path):
                    continue

                ai_data = analyze_file_with_gemini(path, admin_notes)

                if ai_data:
                    break

                # Fallback for text-based PDFs.
                ext = os.path.splitext(path)[1].lower()
                if ext == ".pdf":
                    pdf_text = extract_text_from_pdf(path)
                    if pdf_text:
                        full_text_buffer += f"\n{pdf_text}"

        # If no file or Gemini file analysis failed, summarize extracted text/admin notes.
        if not ai_data:
            ai_data = generate_ai_metadata(full_text_buffer, admin_notes)

        ai_data = _normalize_ai_data(ai_data)

        if not ai_data:
            ai_data = {
                "ai_generated_title": "Processing Failed",
                "ai_generated_category": "Administrative",
                "ai_generated_tags": [],
                "ai_generated_short_summary": "Could not analyze document.",
                "ai_generated_descriptive_summary": "The AI system could not read or summarize this notice.",
                "ai_generated_relevance_score": 0,
                "extracted_deadline": None,
            }

        data = _safe_json_load(ANNOUNCEMENTS_FILE)

        if announcement_id in data:
            data[announcement_id].update(ai_data)
            _safe_json_write(ANNOUNCEMENTS_FILE, data)
            print(f"--> [Background] Completed: {announcement_id}")
        else:
            print(f"--> [Background] ID not found: {announcement_id}")

    except Exception as e:
        logger.error(f"Background announcement processing failed: {e}")


def disable_announcement(announcement_id: str):
    data = _safe_json_load(ANNOUNCEMENTS_FILE)

    if announcement_id in data:
        data[announcement_id]["active"] = False
        _safe_json_write(ANNOUNCEMENTS_FILE, data)
        return True, "Disabled"

    return False, "ID not found"


def enable_announcement(announcement_id: str):
    data = _safe_json_load(ANNOUNCEMENTS_FILE)

    if announcement_id in data:
        data[announcement_id]["active"] = True
        _safe_json_write(ANNOUNCEMENTS_FILE, data)
        return True, "Enabled"

    return False, "ID not found"


def update_announcement(announcement_id: str, updates: dict):
    data = _safe_json_load(ANNOUNCEMENTS_FILE)

    if announcement_id in data:
        data[announcement_id].update(updates)
        _safe_json_write(ANNOUNCEMENTS_FILE, data)
        return True, "Updated"

    return False, "ID not found"

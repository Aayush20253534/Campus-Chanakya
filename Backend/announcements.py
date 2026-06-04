import json
import os
import logging
import numpy as np
import easyocr
from google import genai 
from pypdf import PdfReader
from pdf2image import convert_from_path
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
ANNOUNCEMENTS_FILE = "data/announcements.json"
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("CRITICAL: GEMINI_API_KEY not found in .env file")
else:
    client = genai.Client(api_key=api_key)
reader = easyocr.Reader(['hi', 'en'], gpu=False)
VALID_CATEGORIES = [
    "Academic", "Examination", 
    "Administrative", "Placement", "Clubs & Societies"
]

def extract_text_complete(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".pdf":
            return _handle_pdf_extraction(file_path)
        elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
            return _handle_image_extraction(file_path)
        else:
            return ""
    except Exception as e:
        logger.error(f"Global Extraction Failed for {file_path}: {e}")
        return ""

def _handle_image_extraction(file_path: str) -> str:
    try:
        result = reader.readtext(file_path, detail=0, paragraph=True)
        return " ".join(result)
    except Exception as e:
        logger.error(f"Image OCR Error: {e}")
        return ""

def _handle_pdf_extraction(file_path: str) -> str:
    text_buffer = ""
    try:
        reader_pdf = PdfReader(file_path)
        for page in reader_pdf.pages:
            content = page.extract_text()
            if content: text_buffer += content + "\n"
    except Exception: pass

    word_count = len([w for w in text_buffer.split() if len(w) > 3])
    
    if word_count >= 15:
        return text_buffer.strip()
    
    return _pdf_to_ocr(file_path)

def _pdf_to_ocr(file_path: str) -> str:
    ocr_result = ""
    try:
        images = convert_from_path(file_path)
        for img in images:
            img_np = np.array(img)
            page_text = reader.readtext(img_np, detail=0, paragraph=True)
            ocr_result += " ".join(page_text) + "\n"
        return ocr_result.strip()
    except Exception as e:
        logger.error(f"PDF OCR Failed: {e}")
        return ""

def generate_ai_metadata(file_text: str, admin_notes: str):
    
    file_content_display = file_text if len(file_text) > 10 else "[Unreadable]"

    prompt = f"""
    Analyze this college notice (Hindi/English). 
    
    [ADMIN NOTES] "{admin_notes}"
    [DOCUMENT TEXT] "{file_content_display}"

    Task: Create a structured JSON summary.
    Important points
    1. The number of tage must be maximum 3 (only if really important) otherwise maximum 2.
    2. All generated answers must be in english only
    3. The answer should stricly contain only the JSON Schema given
    Output JSON Schema:
    {{
        "ai_generated_title": "Catchy Headline (Max 6 words)",
        "ai_generated_category": "One of: {VALID_CATEGORIES}",
        "ai_generated_tags": ["tag1", "tag2", "tag3"],
        "ai_generated_short_summary": "1-sentence summary",
        "ai_generated_descriptive_summary": "Detailed paragraph summary",
        "ai_generated_relevance_score": int (0-100 based on urgency/importance),
        "extracted_deadline": "YYYY-MM-DD" or null
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3-flash-preview', 
            contents=prompt
        )
        
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return None

def process_existing_announcement(announcement_id: str, file_paths: list, admin_notes: str):
    print(f"--> [Background] Processing started for ID: {announcement_id}")
    
    full_text_buffer = ""
    if isinstance(file_paths, str): file_paths = [file_paths]
        
    for path in file_paths:
        try:
            text = extract_text_complete(path)
            if text: full_text_buffer += f"\n {text}"
        except Exception as e:
            logger.error(f"Error processing file {path}: {e}")

    ai_data = generate_ai_metadata(full_text_buffer, admin_notes)
    
    if not ai_data:
        ai_data = {
            "ai_generated_title": "Processing Failed", 
            "ai_generated_short_summary": "Could not analyze document.",
            "extracted_deadline": None
        }

    try:
        if os.path.exists(ANNOUNCEMENTS_FILE):
            with open(ANNOUNCEMENTS_FILE, "r") as f:
                data = json.load(f)
                
            if announcement_id in data:
                data[announcement_id].update(ai_data)
                with open(ANNOUNCEMENTS_FILE, "w") as f:
                    json.dump(data, f, indent=4)
                    
                print(f"--> [Background] Completed: {announcement_id}")
    except Exception as e:
        print(f"--> [Background] Error updating JSON: {e}")

def disable_announcement(announcement_id: str):
    if not os.path.exists(ANNOUNCEMENTS_FILE): return False, "DB not found"
    try:
        with open(ANNOUNCEMENTS_FILE, "r") as f: data = json.load(f)
        if announcement_id in data:
            data[announcement_id]["active"] = False
            with open(ANNOUNCEMENTS_FILE, "w") as f: json.dump(data, f, indent=4)
            return True, "Disabled"
        return False, "ID not found"
    except Exception as e: return False, str(e)

def update_announcement(announcement_id: str, updates: dict):
    if not os.path.exists(ANNOUNCEMENTS_FILE): return False, "DB not found"
    try:
        with open(ANNOUNCEMENTS_FILE, "r") as f: data = json.load(f)
        if announcement_id in data:
            data[announcement_id].update(updates)
            with open(ANNOUNCEMENTS_FILE, "w") as f: json.dump(data, f, indent=4)
            return True, "Updated"
        return False, "ID not found"
    except Exception as e: return False, str(e)

def enable_announcement(announcement_id: str):
    if not os.path.exists(ANNOUNCEMENTS_FILE): return False, "DB not found"
    try:
        with open(ANNOUNCEMENTS_FILE, "r") as f: data = json.load(f)
        if announcement_id in data:
            data[announcement_id]["active"] = True  # <--- Set to True
            with open(ANNOUNCEMENTS_FILE, "w") as f: json.dump(data, f, indent=4)
            return True, "Enabled"
        return False, "ID not found"
    except Exception as e: return False, str(e)
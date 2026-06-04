import uuid
from datetime import datetime
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

FIXED_CATEGORIES = [
    "Announcement",
    "Event",
    "Question",
    "Research",
    "Lost & Found",
    "Opinion",
    "General",
]


def init_feed_db(conn):
    """Optional Postgres initializer. Safe to call with a Neon connection."""
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            author_role TEXT,
            author_id TEXT,
            title TEXT,
            content TEXT,
            category TEXT,
            timestamp TIMESTAMP,
            upvotes INTEGER DEFAULT 0,
            downvotes INTEGER DEFAULT 0
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS post_votes (
            post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
            user_id TEXT,
            vote_type TEXT CHECK (vote_type IN ('up', 'down')),
            PRIMARY KEY (post_id, user_id)
        )
        """
    )
    conn.commit()


def analyze_post(title, content):
    if not client:
        return False, "AI Moderator is currently unavailable. Please try again later.", "N/A"

    try:
        categories_str = ", ".join(FIXED_CATEGORIES)

        prompt = f"""
You are Chanakya, the supreme guardian of a university digital campus. Your duty is to protect the community from toxicity, misinformation, and distraction.

INPUT TO ANALYZE:
Title: "{title}"
Content: "{content}"

PHASE 1: STRICT SAFETY FILTER
Reject content containing harassment, hate, politics/controversy, NSFW/obscenity, spam/promotion, or misinformation.
If unsure, reject it.

PHASE 2: CATEGORIZATION
If safe, assign exactly one category from: [{categories_str}]
Use "General" if no other category fits.

OUTPUT FORMAT:
Reply with exactly one line.
Rejected: UNSAFE | <reason>
Accepted: SAFE | <Category Name>
"""

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
        )

        if not response or not response.text:
            print("Chanakya Alert: AI returned empty response. Defaulting to REJECT.")
            return False, "System was unable to verify safety. Please try again.", "N/A"

        text = response.text.strip()
        parts = text.split("|")

        if len(parts) >= 2:
            status = parts[0].strip().upper()
            detail = parts[1].strip()

            if status == "UNSAFE":
                return False, detail, "N/A"
            if status == "SAFE":
                category = detail if detail in FIXED_CATEGORIES else "General"
                return True, "Safe", category

        if "UNSAFE" in text.upper() or "REJECT" in text.upper():
            return False, "Content flagged by automated safety check.", "N/A"

        print(f"Chanakya Alert: Unparseable AI response: '{text}'")
        return False, "Content could not be verified. Please rephrase and try again.", "N/A"

    except Exception as e:
        print(f"Chanakya Critical Error: {e}")
        return False, "AI Moderator is currently unavailable. Please try again later.", "N/A"


def create_post_logic(conn, user_id, user_role, data):
    is_safe, message, ai_category = analyze_post(data["title"], data["content"])

    if not is_safe:
        return {
            "status": "rejected",
            "message": f"Chanakya blocked this post: {message}",
        }

    post_id = str(uuid.uuid4())
    timestamp = datetime.now()

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO posts (id, author_id, author_role, title, content, category, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            post_id,
            user_id,
            "Anonymous " + user_role.capitalize(),
            data["title"],
            data["content"],
            ai_category,
            timestamp,
        ),
    )
    conn.commit()

    return {
        "status": "success",
        "post_id": post_id,
        "category": ai_category,
        "message": "Post published successfully.",
    }


def get_feed_logic(conn, current_user_email=None):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM posts ORDER BY timestamp DESC")
    posts = [dict(row) for row in cursor.fetchall()]

    user_votes = {}
    if current_user_email:
        cursor.execute(
            "SELECT post_id, vote_type FROM post_votes WHERE user_id = %s",
            (current_user_email,),
        )
        for row in cursor.fetchall():
            user_votes[row["post_id"]] = row["vote_type"]

    formatted_posts = []
    for p in posts:
        try:
            raw_time = p["timestamp"]
            post_time = raw_time if isinstance(raw_time, datetime) else datetime.fromisoformat(str(raw_time))
            diff = datetime.now() - post_time
            if diff.days > 0:
                time_str = f"{diff.days} days ago"
            elif diff.seconds > 3600:
                time_str = f"{diff.seconds // 3600} h ago"
            elif diff.seconds > 60:
                time_str = f"{diff.seconds // 60} m ago"
            else:
                time_str = "Just now"
        except Exception:
            time_str = "Recently"

        cat_lower = (p.get("category") or "General").lower().replace("&", "").replace(" ", "")
        tag_class = f"tag-{cat_lower}"

        formatted_posts.append(
            {
                "id": p["id"],
                "title": p["title"],
                "content": p["content"],
                "author": p["author_role"],
                "category": p["category"],
                "tag_class": tag_class,
                "timestamp": time_str,
                "votes": (p.get("upvotes") or 0) - (p.get("downvotes") or 0),
                "user_vote": user_votes.get(p["id"], None),
                "can_delete": bool(p.get("author_id")) and p.get("author_id") == current_user_email,
            }
        )

    return formatted_posts


def vote_post_logic(conn, user_id, post_id, vote_type):
    cursor = conn.cursor()

    cursor.execute(
        "SELECT vote_type FROM post_votes WHERE post_id = %s AND user_id = %s",
        (post_id, user_id),
    )
    existing_vote = cursor.fetchone()

    if existing_vote:
        prev_type = existing_vote["vote_type"]

        if prev_type == vote_type:
            cursor.execute(
                "DELETE FROM post_votes WHERE post_id = %s AND user_id = %s",
                (post_id, user_id),
            )
            col = "upvotes" if vote_type == "up" else "downvotes"
            cursor.execute(f"UPDATE posts SET {col} = GREATEST({col} - 1, 0) WHERE id = %s", (post_id,))
        else:
            cursor.execute(
                "UPDATE post_votes SET vote_type = %s WHERE post_id = %s AND user_id = %s",
                (vote_type, post_id, user_id),
            )
            if vote_type == "up":
                cursor.execute(
                    "UPDATE posts SET upvotes = upvotes + 1, downvotes = GREATEST(downvotes - 1, 0) WHERE id = %s",
                    (post_id,),
                )
            else:
                cursor.execute(
                    "UPDATE posts SET downvotes = downvotes + 1, upvotes = GREATEST(upvotes - 1, 0) WHERE id = %s",
                    (post_id,),
                )
    else:
        cursor.execute(
            "INSERT INTO post_votes (post_id, user_id, vote_type) VALUES (%s, %s, %s)",
            (post_id, user_id, vote_type),
        )
        col = "upvotes" if vote_type == "up" else "downvotes"
        cursor.execute(f"UPDATE posts SET {col} = {col} + 1 WHERE id = %s", (post_id,))

    conn.commit()

    cursor.execute("SELECT upvotes, downvotes FROM posts WHERE id = %s", (post_id,))
    row = cursor.fetchone()
    return (row["upvotes"] or 0) - (row["downvotes"] or 0)


def delete_post_logic(conn, post_id, user_id, user_role=None):
    cursor = conn.cursor()

    cursor.execute("SELECT author_id FROM posts WHERE id = %s", (post_id,))
    post = cursor.fetchone()

    if not post:
        return {"status": "error", "message": "Post not found."}

    is_admin = user_role == "admin"
    is_owner = post["author_id"] == user_id

    if not is_admin and not is_owner:
        return {"status": "error", "message": "You can only delete your own posts."}

    cursor.execute("DELETE FROM post_votes WHERE post_id = %s", (post_id,))
    cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
    conn.commit()

    return {"status": "success", "message": "Post deleted successfully."}

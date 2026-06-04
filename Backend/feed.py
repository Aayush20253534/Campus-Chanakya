import sqlite3
import uuid
from datetime import datetime
from google import genai
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Initialize the Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Fixed Categories List
FIXED_CATEGORIES = [
    "Announcement", 
    "Event", 
    "Question", 
    "Research", 
    "Lost & Found", 
    "Opinion", 
    "General"
]

def init_feed_db(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_role TEXT,
        author_id TEXT,
        title TEXT,
        content TEXT,
        category TEXT,
        timestamp DATETIME,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS post_votes (
        post_id TEXT,
        user_id TEXT,
        vote_type TEXT,
        PRIMARY KEY (post_id, user_id)
    )
    """)

    cursor.execute("PRAGMA table_info(posts)")
    existing_columns = [row[1] for row in cursor.fetchall()]

    if "author_id" not in existing_columns:
        cursor.execute("ALTER TABLE posts ADD COLUMN author_id TEXT")

    conn.commit()
    conn.close()

def analyze_post(title, content):
    """
    Uses Gemini API to moderate and categorize content.
    
    FAIL-SAFE POLICY: 
    - If API fails -> REJECT
    - If response format is wrong -> REJECT
    - If content is borderline -> REJECT
    """
    try:
        categories_str = ", ".join(FIXED_CATEGORIES)
        
        # Enhanced Prompt Engineering for stricter moderation
        prompt = f"""
You are Chanakya, the supreme guardian of a university digital campus. Your duty is to protect the community from toxicity, misinformation, and distraction.

**INPUT TO ANALYZE:**
Title: "{title}"
Content: "{content}"

━━━━━━━━━━━━━━━━━━━━━━
**PHASE 1: STRICT SAFETY FILTER (ZERO TOLERANCE)**
━━━━━━━━━━━━━━━━━━━━━━
You MUST REJECT the content if it contains:
1. **Harassment/Bullying:** Any personal attacks, naming students/teachers negatively, or passive-aggressive mocking.
2. **Hate/Discrimination:** Racism, casteism, sexism, religious insults, or regional bias.
3. **Politics/Controversy:** Political propaganda, election campaigning, or sensitive social issues that cause unrest.
4. **NSFW/Obscenity:** Sexual content, innuendos, drugs, alcohol, or violence.
5. **Spam/Promotion:** Ads, referral links, selling items (except academic materials), or "follow me" posts.
6. **Misinformation:** Rumors disguised as official news (e.g., "Exam cancelled" without proof).

**CRITICAL RULE:** If you are unsure or the content feels "off", borderline, or manipulative -> **REJECT IT.**

━━━━━━━━━━━━━━━━━━━━━━
**PHASE 2: CATEGORIZATION**
━━━━━━━━━━━━━━━━━━━━━━
If SAFE, assign exactly ONE category from: [{categories_str}]
- Use "General" if no other category fits perfectly.

━━━━━━━━━━━━━━━━━━━━━━
**OUTPUT FORMAT (STRICT)**
━━━━━━━━━━━━━━━━━━━━━━
Reply with EXACTLY ONE line. Do not add markdown, bolding, or explanations.

Format if REJECTED:
UNSAFE | <Brief, specific reason for rejection>

Format if ACCEPTED:
SAFE | <Category Name>
"""
        
        # API Call
        response = client.models.generate_content(
            model='gemini-3-flash-preview', # Upgraded to 2.0 Flash for better reasoning/speed
            contents=prompt
        )
        
        # 1. Check for empty/none response (First layer of fail-safe)
        if not response or not response.text:
            print("Chanakya Alert: AI returned empty response. Defaulting to REJECT.")
            return False, "System was unable to verify safety. Please try again.", "N/A"

        text = response.text.strip()
        
        # 2. Parse the response
        parts = text.split("|")
        
        if len(parts) >= 2:
            status = parts[0].strip().upper()
            detail = parts[1].strip()
            
            if status == "UNSAFE":
                return False, detail, "N/A"
            elif status == "SAFE":
                # Validate category matches known list
                category = detail if detail in FIXED_CATEGORIES else "General"
                return True, "Safe", category
        
        # 3. Fallback Parsing (Second layer of fail-safe)
        # If the model rambled or didn't use the pipe |, checks keywords
        if "UNSAFE" in text.upper() or "REJECT" in text.upper():
            return False, "Content flagged by automated safety check.", "N/A"
            
        # 4. AMBIGUITY FAIL-SAFE
        # If the model returned text that doesn't look like our format at all
        # (e.g. "I cannot process this"), we REJECT instead of accept.
        print(f"Chanakya Alert: Unparseable AI response: '{text}'")
        return False, "Content could not be verified. Please rephrase and try again.", "N/A"

    except Exception as e:
        # 5. EXCEPTION FAIL-SAFE
        # Network errors, API key issues, Quota limits -> REJECT
        print(f"Chanakya Critical Error: {e}")
        return False, "AI Moderator is currently unavailable. Please try again later.", "N/A"

def create_post_logic(conn, user_id, user_role, data):
    """
    Creates a post with AI analysis.
    """
    # 1. Analyze Content
    is_safe, message, ai_category = analyze_post(data['title'], data['content'])
    
    if not is_safe:
        return {
            "status": "rejected", 
            "message": f"Chanakya blocked this post: {message}"
        }

    # 2. Save to DB
    post_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO posts (id, author_id, author_role, title, content, category, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        post_id,
        user_id,
       "Anonymous " + user_role.capitalize(),
        data["title"],
        data["content"],
        ai_category,
        timestamp
    ))
    conn.commit()
    
    return {
        "status": "success", 
        "post_id": post_id, 
        "category": ai_category,
        "message": "Post published successfully."
    }

def get_feed_logic(conn, current_user_email=None):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM posts ORDER BY timestamp DESC")
    posts = [dict(row) for row in cursor.fetchall()]
    
    user_votes = {}
    if current_user_email:
        cursor.execute("SELECT post_id, vote_type FROM post_votes WHERE user_id = ?", (current_user_email,))
        for row in cursor.fetchall():
            user_votes[row["post_id"]] = row["vote_type"]

    formatted_posts = []
    for p in posts:
        try:
            post_time = datetime.fromisoformat(p["timestamp"])
            diff = datetime.now() - post_time
            if diff.days > 0:
                time_str = f"{diff.days} days ago"
            elif diff.seconds > 3600:
                time_str = f"{diff.seconds // 3600} h ago"
            elif diff.seconds > 60:
                time_str = f"{diff.seconds // 60} m ago"
            else:
                time_str = "Just now"
        except:
            time_str = "Recently"

        cat_lower = p["category"].lower().replace("&", "").replace(" ", "")
        tag_class = f"tag-{cat_lower}"

        formatted_posts.append({
            "id": p["id"],
            "title": p["title"],
            "content": p["content"],
            "author": p["author_role"],
            "category": p["category"],
            "tag_class": tag_class,
            "timestamp": time_str,
            "votes": (p["upvotes"] or 0) - (p["downvotes"] or 0),
            "user_vote": user_votes.get(p["id"], None),
            "can_delete": bool(p.get("author_id")) and p.get("author_id") == current_user_email
        })
        
    return formatted_posts

def vote_post_logic(conn, user_id, post_id, vote_type):
    """
    StackOverflow style voting:
    - Clicking the same vote type again REMOVES the vote (toggle).
    - Clicking the opposite vote type SWITCHES the vote.
    - Updates net score: (upvotes - downvotes).
    """
    cursor = conn.cursor()
    
    # Check if a vote already exists for this user on this post
    cursor.execute("SELECT vote_type FROM post_votes WHERE post_id = ? AND user_id = ?", (post_id, user_id))
    existing_vote = cursor.fetchone()
    
    if existing_vote:
        prev_type = existing_vote[0]
        
        if prev_type == vote_type:
            # TOGGLE OFF: User clicked the same button again
            cursor.execute("DELETE FROM post_votes WHERE post_id = ? AND user_id = ?", (post_id, user_id))
            col = "upvotes" if vote_type == "up" else "downvotes"
            cursor.execute(f"UPDATE posts SET {col} = {col} - 1 WHERE id = ?", (post_id,))
        else:
            # SWITCH VOTE: User clicked the opposite button
            cursor.execute("UPDATE post_votes SET vote_type = ? WHERE post_id = ? AND user_id = ?", (vote_type, post_id, user_id))
            if vote_type == "up":
                # +1 upvote, -1 downvote
                cursor.execute("UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?", (post_id,))
            else:
                # +1 downvote, -1 upvote
                cursor.execute("UPDATE posts SET downvotes = downvotes + 1, upvotes = upvotes - 1 WHERE id = ?", (post_id,))
    else:
        # NEW VOTE: No previous vote exists
        cursor.execute("INSERT INTO post_votes (post_id, user_id, vote_type) VALUES (?, ?, ?)", (post_id, user_id, vote_type))
        col = "upvotes" if vote_type == "up" else "downvotes"
        cursor.execute(f"UPDATE posts SET {col} = {col} + 1 WHERE id = ?", (post_id,))
    
    conn.commit()
    
    # Return the new net score
    cursor.execute("SELECT upvotes, downvotes FROM posts WHERE id = ?", (post_id,))
    row = cursor.fetchone()
    return (row[0] or 0) - (row[1] or 0)

def delete_post_logic(conn, post_id, user_id, user_role=None):
    cursor = conn.cursor()

    cursor.execute(
        "SELECT author_id FROM posts WHERE id = ?",
        (post_id,)
    )

    post = cursor.fetchone()

    if not post:
        return {
            "status": "error",
            "message": "Post not found."
        }

    is_admin = user_role == "admin"
    is_owner = post["author_id"] == user_id

    if not is_admin and not is_owner:
        return {
            "status": "error",
            "message": "You can only delete your own posts."
        }

    cursor.execute("DELETE FROM post_votes WHERE post_id = ?", (post_id,))
    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()

    return {
        "status": "success",
        "message": "Post deleted successfully."
    }
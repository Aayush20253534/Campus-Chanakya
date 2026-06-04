# ---

**🎓 Campus Chanakya**

### ***The AI-Powered Guardian & Advisor for University Life***

**Campus Chanakya** is a next-generation University ERP and Student Community platform designed to replace outdated portals with an intelligent, centralized assistant. Named after the legendary scholar, it uses **Google Gemini 3 Flash Preview** to act as a wise "Chanakya," guiding students through academics, placements, and campus life.

## ---

**🚀 Key Features**

Campus Chanakya acts as an **Agentic Workflow** system, guiding the student through every aspect of campus life across 8 distinct modules.

### **1\. 📊 Unified Smart Dashboard**

* **KPI Cards:** Instantly view high-level metrics including **Cumulative Performance Index (6.59)**, **Overall Attendance (84%)**, and **Institute Rank (3)**.  
* **Priority Feeds:** "Recent Assignments" and "Official Announcements" widgets are placed front-and-center, ensuring critical deadlines are never missed.  
* **Live Schedule:** A timeline view of the day's classes with room numbers (e.g., "NLH1").

### **2\. 📢 Smart Announcements (OCR \+ AI)**

* **AI Metadata Cards:** Every notice is processed by Gemini to generate a clean **"AI Summary"** and a concise **"AI Generated Title"** (replacing vague filenames).  
* **Relevance Scoring:** A dynamic badge (e.g., **"Relevance: 100%"**) tells the student exactly how important the notice is to them specifically.  
* **Categorization:** Auto-tagged labels such as B.TECH, SCHOLARSHIP, or DISCIPLINE for quick filtering.

### **3\. 🗓️ Dynamic Timetable**

* **Visual Grid:** A clear, color-coded weekly view separating lectures, labs, and breaks.  
* **Location Intelligence:** Each slot clearly displays the subject (e.g., "Computer Programming") along with the specific **Room Code** (e.g., "NLH2", "GS1") in a distinct pill.

### **4\. 🛡️ Attendance & "Bunk" Advisor**

* **Real-Time Status:** The "Today's Schedule" section marks classes as **"Live"** or **"Next"** to keep students synchronized.  
* **Strategic Insights:** Instead of just a percentage, Chanakya gives actionable advice for every subject:  
  * *Safe Zone:* **"You can miss 1 more class while staying above 75%."**  
  * *Danger Zone:* **"You must attend the next 3 consecutive classes to reach 75%."**  
* **Detailed Metrics:** Breakdown of "Present", "Absent", and "Total" classes for full transparency.

### **5\. 📝 AI-Assisted Assignments**

* **Deadline Tracker:** Cards display a countdown (e.g., **"2 days left"**) and status tags like Urgent or Overdue.  
* **Smart Filters:** Quickly toggle between "Due Soon", "Overdue", and "Submitted" tasks.  
* **Resource Access:** A direct **"See Original Document"** button allows students to preview the professor's prompt without leaving the dashboard.

### **6\. 🎭 Clubs & Committees**

* **Discovery Hub:** A visual gallery of all campus bodies, from the **"Garba Committee"** to the **"Robotics Club"**.  
* **Smart Filtering:** One-click tags to filter clubs by type: Technical, Cultural, or Sports.  
* **Tag System:** Each club card highlights its focus areas (e.g., "Dance", "Coding", "Aeromodelling") to help students find their tribe.

### **7\. 📈 Exam Results & Analytics**

* **Transcript View:** A digital report card showing **Current SGPA**, **Cumulative GPA**, and **Total Credits** earned.  
* **Granular Breakdown:** A detailed table listing every subject with its Code, Credits, Internal/External marks, and Final Grade.  
* **Export Options:** Students can filter results by Semester and download the official transcript as a PDF.

### **8\. 💬 "Clean Feed" Social Network**

* **Anonymous Community:** A Reddit-style feed where students can share opinions, confessions, or questions anonymously.  
* **AI Auto-Categorization:** Gemini automatically tags posts into buckets like General | Student, Opinion | Student, or Announcement.  
* **Engagement:** Features an **Upvote/Downvote** system to highlight the most relevant community discussions.  
* **Safety First:** AI moderation actively scans for toxicity, ensuring the feed remains constructive.

## ---

**🛠️ Tech Stack**

* **Backend:** Python, FastAPI  
* **AI Engine:** Google Gemini API (gemini-3-flash-preview)  
* **Database:** SQLite3 (Lightweight & Fast)  
* **OCR & File Processing:** EasyOCR, pdf2image, pypdf  
* **Authentication:** JWT (JSON Web Tokens) \+ Argon2 Hashing  
* **Background Tasks:** FastAPI BackgroundTasks for heavy OCR jobs

## ---

**⚙️ Installation & Setup**

### **Prerequisites**

* Python 3.9+  
* Google Gemini API Key

### **1\. Clone the Repository**

git clone https://github.com/yourusername/campus-chanakya.git  
cd campus-chanakya

### **2\. Create Virtual Environment**

python \-m venv venv  
source venv/bin/activate  \# On Windows: venv\\Scripts\\activate

### **3\. Install Dependencies**

pip install \-r requirements.txt

*(Make sure easyocr, fastapi, uvicorn, google-genai, python-multipart, pypdf, pdf2image are in your requirements.txt)*

### **4\. Configure Environment Variables**

Create a .env file in the root directory:

Ini, TOML

GEMINI\_API\_KEY\=your\_google\_gemini\_api\_key  
SECRET\_KEY\=your\_jwt\_secret\_key

### **5\. Initialize Database & Run**

The system auto-initializes the SQLite DB on first run.

uvicorn main:app \--reload

## ---

**📂 Project Structure**

├── main.py              \# Entry point & API Routes  
├── announcements.py     \# OCR & AI Notice processing  
├── attendance.py        \# Logic for attendance & "Bunk Advisor"  
├── assignment.py        \# Assignment handling & AI help  
├── feed.py              \# Social feed with AI Moderation  
├── clubs.py             \# Club recommendations logic  
├── results.py           \# CGPA/SGPA & Rank calculation  
├── data/                \# Database & Upload storage  
└── .env                 \# API Keys

## ---

**🤖 AI Workflow Example (Notice Board)**

1. **Input:** Admin uploads a blurry photo of a notice about "End Sem Dates".  
2. **OCR Layer:** EasyOCR extracts raw text from the image.  
3. **GenAI Layer:** The text is sent to **Gemini Flash** with a system prompt: *"Extract the deadline, summarize this in 10 words, and rate urgency."*  
4. **Output:** JSON structure { "title": "End Sem Schedule", "deadline": "2025-11-20", "priority": "High" }.  
5. **Frontend:** Student sees a clean card with a "High Priority" badge.

## ---

**🔮 Future Roadmap**

* **Timetable Optimization:** AI suggestion for rescheduling canceled classes based on teacher/student availability.  
* **Alumni Connect:** Matching current students with alumni based on project stacks.  
* **Voice Assistant:** "Hey Chanakya, what's my attendance in Physics?"

## ---

**👨‍💻 Contributors**

* ### **Aayansh Niranjan – *The System Core* (Full Backend Development & API Integration)**

* ### **Aayush Thakur – *The Interface Sculptor* (Frontend Engineering & UI/UX Experience)**

* ### **Shashwat Agarwal – *The Neural Architect* (Database Architecture & AI Prompt Engineering)**

* ### **Adya Tripathi – *The Brand Alchemist* (Visual Identity, Logo & Creative Assets)**

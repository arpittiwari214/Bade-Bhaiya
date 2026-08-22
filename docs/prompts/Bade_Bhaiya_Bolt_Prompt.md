# 🌟 Ultra-Detailed Prompt for Bolt Website Builder

**Build me a mobile-first web application called *Bade Bhaiya* — a Digital Career & Education Guidance Platform for students in Northern India.**  

---

## 🎯 Purpose & Vision  
The platform should act as a **one-stop personalized career and education advisor** for students. It should:  
- Help students (priority order: **Class 12 → Graduates → Class 10**) choose the right subject stream, degree, and career path.  
- Use **quiz-based profiling** to generate personalized career recommendations.  
- Display **AI-driven career roadmaps** in both **tree view** and **card view**.  
- Provide **government college directory** with course info, cutoffs, location, facilities, and admission deadlines.  
- Share **scholarships, study materials, sample papers, and reminders**.  
- Have a **friendly mentor tone**: “Bade Bhaiya” (like an elder brother in India, casual, relatable, trustworthy).  

---

## 🎨 Design Style & Branding  
- **Hybrid look**: trustworthy and official (like government portals), but also modern, vibrant, and youth-friendly.  
- **Colors**:  
  - Primary: Deep Blue (trust, govt tone)  
  - Secondary: Green/Orange accents (youthful, approachable)  
  - Background: White/light grey (clean look)  
- **Typography**: Clean, sans-serif (e.g., Inter, Poppins).  
- **Icons**: Friendly, simple icons for categories (Govt Jobs, Corporate, Entrepreneurship, Higher Studies).  
- **Tone of Voice**: Informal but caring (like a brother/mentor). Example UI line: *“Bhaiya is here to guide you — let’s start your journey!”*  

---

## 📑 Core Pages & Features  

### 1. Landing Page  
- Hero section: “**Bade Bhaiya – Your Friendly Career Mentor**”  
- Tagline: “Helping you choose the right path after Class 10, 12, and Graduation.”  
- Call-to-action (CTA) button: *“Start Quiz”*.  
- Highlights section (4 cards with icons):  
  - Personalized Career Roadmaps  
  - Government Colleges Directory  
  - Scholarships & Study Materials  
  - Notifications & Reminders  
- Footer with About, Contact, Privacy, Terms.  

---

### 2. Registration / Login Page  
- Collect mandatory fields:  
  - Name  
  - Age  
  - Gender  
  - Current Class (10, 12, Graduate)  
  - State, District  
  - Subjects & Marks/Grades  
  - Email / Phone  
- Login options:  
  - Email + Password  
  - Google Login  
  - Phone Number + OTP  
- Allow **limited preview without login**, but show prompt to register for full roadmap.  

---

### 3. Quiz Page  
- **Step 1**: Short adaptive quiz (5–10 questions).  
- **Step 2**: Longer deep-dive quiz later if student continues.  
- **Question types**:  
  - Multiple Choice Questions (MCQs)  
  - Likert Scale (1–5 ratings: “Strongly Agree → Strongly Disagree”)  
  - Mini skill/aptitude puzzles (logic/math).  
- Friendly intro text: *“Bhaiya will ask you some quick questions to understand your strengths.”*  
- Show quiz progress bar.  

---

### 4. Results / Roadmap Page  
- Display **career roadmap** in two views:  
  - **Tree View** 🌳: Branches expand from current stage → stream → degree → jobs/higher studies.  
  - **Card View** 🗂️: Expandable cards with summary and details.  
- Each roadmap node shows:  
  - Name (e.g., B.Sc. Physics, MBA, SSC Exam)  
  - Timeline (years)  
  - Cost range (fees estimate or “data not available”)  
  - Entrance exams required  
  - Scholarships available  
  - Future opportunities / next steps  
- Pathways are visually labeled with badges:  
  - Govt Jobs  
  - Corporate  
  - Entrepreneurship  
  - Higher Studies  
- Show **match percentage (confidence)** for each option.  
- CTA buttons: “See Colleges”, “Save Roadmap”, “Set Reminder”.  

---

### 5. College Directory Page  
- Step 1: Show **types of colleges** (e.g., Govt Science Colleges, Govt Commerce Colleges).  
- Step 2: If student clicks, show **specific government colleges** with:  
  - Courses offered  
  - Cut-offs & eligibility  
  - Distance from user (integrate Google Maps API)  
  - Facilities (hostel, lab, library, internet)  
  - Admission deadlines & process  
  - Contact info  
- Option to **download PDF info pack** for offline use.  

---

### 6. Scholarships & Materials Page  
- Section 1: Scholarships list (with deadlines, eligibility, and application links).  
- Section 2: Sample papers and study materials (downloadable PDFs).  
- Section 3: Notifications & Reminders (timeline of important dates).  
- Option for students to **set their own custom reminders**.  

---

### 7. Dashboard / Profile Page  
- Shows student’s:  
  - Saved roadmaps  
  - Quiz results summary  
  - Reminders & notifications  
  - Personal info (editable)  
- Friendly greeting: *“Welcome back, Bhaiya is here for you!”*  

---

### 8. Admin Dashboard (Central Team Only)  
- Analytics to track:  
  - User signups & active users  
  - Quiz completion rate  
  - Top career paths chosen  
  - College searches & click-throughs  
  - Registration conversions from anonymous users  
  - Usage by state/district  
- Download/export data as CSV.  

---

## 🔔 Notifications System  
- Notify students about:  
  - Admission dates  
  - Scholarship deadlines  
  - Entrance test dates  
  - Counseling schedules  
- Custom reminders: student sets personal alerts.  
- Examples of tone:  
  - *“Bhaiya reminder: DU admission closes in 3 days.”*  
  - *“Scholarship deadline tomorrow — don’t miss it!”*  

---

## ⚙️ Technical Features  
- Mobile-first responsive design.  
- Works on low bandwidth (pages ≤1MB).  
- Offline support: cached content + downloadable PDFs.  
- Cloud hosting, secure login (email, Google, phone OTP).  
- Google Maps API integration for college distances.  
- Push notifications + SMS/email alerts.  

---

## 📊 Visual & UX Extras  
- Option to switch between **Tree view** and **Card view** in roadmap.  
- Friendly mentor microcopy everywhere (onboarding, buttons, alerts). Examples:  
  - Onboarding: *“Hey! I’m your Bade Bhaiya — let’s find your path.”*  
  - Button: *“See Colleges”*, *“Save Roadmap”*  
  - Error: *“Service unavailable, Bhaiya will be back soon.”*  
- Branding hybrid: half-formal, half-youthful (govt trust + friendly brother).  

---

## 🚀 Rollout  
- Launch across **all Northern states at once**.  
- Expected initial users: under 50,000 in Year 1.  
- MVP = **Balanced**: not barebones, not over-engineered.  

---

👉 Use this detailed specification to generate the **frontend website structure** in Bolt, with all pages, flows, and design elements scaffolded.  

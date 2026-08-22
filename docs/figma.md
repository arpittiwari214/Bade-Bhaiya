Design a modern, responsive web application for a Digital Guidance Platform for Students (Smart India Hackathon project). The platform should help students choose the right stream, degree, and career path, discover nearby government colleges, and explore scholarships.

🔹 Overall Style:
- Clean, professional, and educational.
- Color palette: Primary Blue (#2563EB), Secondary Green (#16A34A), Accent Amber (#F59E0B), Light Gray background (#F9FAFB), Dark text (#111827).
- Typography: Poppins for headings, Inter for body text.
- Rounded corners, card-based layout, soft shadows.

🔹 Pages to Design:
1. **Landing Page**
   - Header with logo and navigation (Home, Features, Colleges, Scholarships, Contact).
   - Hero section with tagline “Choose the Right Path for Your Future” and CTA buttons (“Start Quiz”, “Explore Colleges”).
   - Problem & Solution section (two-column layout with text + illustration).
   - Features section (cards for Quiz, Roadmap, Colleges, Scholarships).
   - Final CTA section “Get Started Today – Sign Up Free.”
   - Footer with links (Privacy Policy, Terms, Accessibility, Contact).

2. **Login / Sign Up Page**
   - Simple form with Email/Phone and Password/OTP.
   - Role selection buttons (Student | Parent | Admin).
   - Primary Login button.

3. **Student Dashboard**
   - Sidebar navigation (Quiz, Roadmap, Colleges, Scholarships, Profile).
   - Main area: Personalized Roadmap visual, recommended colleges, and scholarships.
   - Right panel: Notifications and deadlines.

4. **Quiz Page**
   - Progress bar at the top.
   - Question text with multiple choice options (radio buttons).
   - Navigation buttons (Previous, Next, Submit).

5. **Roadmap Page**
   - Visual timeline showing stages: Current level → Suggested Streams → Degree Options → Career Outcomes.
   - Progress indicators with icons.

6. **Colleges Directory**
   - Search bar at the top.
   - Filters panel (Stream, Location, Fees).
   - College cards showing name, cutoff, facilities.
   - College detail page with full info.

7. **Scholarships Page**
   - List of scholarships (cards with title, amount, eligibility, deadline).
   - Apply/Save button.

8. **Parent Dashboard**
   - Tabs: Explore Courses, Compare Colleges, Success Stories, Contact Counselor.
   - Card layout for each section.

9. **Admin Dashboard**
   - Sidebar: Manage Colleges, Scholarships, Career Paths, Analytics, Feedback.
   - Main area with forms and tables for data.
   - Analytics section with simple charts.

10. **Contact Page**
    - Contact form (Name, Email, Message).
    - Map or illustration on the right.
    - Footer links.

🔹 Additional Notes:
- Use card layouts, simple icons, and progress indicators.
- Mobile-friendly responsive designs.
- Keep a consistent visual identity across all pages.


//prompt 2//
Design a modern, responsive web application prototype for "Bade Bhaiya" – a Digital Guidance Platform for Students. 
The platform should act like a big brother, guiding students in choosing the right subject stream, degree, and career path, 
discovering nearby government colleges, and exploring scholarships.

🔹 Overall Style:
- Clean, aesthetic, and student-friendly with a professional edge.
- Color palette: Primary Blue (#2563EB), Secondary Green (#16A34A), Accent Amber (#F59E0B), Light Gray background (#F9FAFB), Dark text (#111827).
- Typography: Poppins for headings, Inter for body text.
- Rounded corners, card-based layout, soft shadows, modern icons.

🔹 Pages to Design:

1. **Landing Page**
   - Header with logo “Bade Bhaiya” and navigation (Home, Features, Colleges, Scholarships, Contact).
   - Hero section: tagline “Your Big Brother in Career Guidance” with CTA buttons (“Start Quiz”, “Explore Colleges”, “Try as Guest”).
   - Problem & Solution section (two-column layout with illustration).
   - Features section (cards for Quiz, Roadmap, Colleges, Scholarships).
   - Final CTA section “Get Started Today – Free Access as Guest or Sign Up.”
   - Footer with links (Privacy Policy, Terms, Accessibility, Contact).

2. **Guest Profile (New Feature)**
   - Option to access the platform as Guest (no login required).
   - Full access to all features: Quiz, Roadmap, Colleges, Scholarships.
   - Banner: “You are browsing as Guest – Sign up to save your progress.”

3. **Career Mapping Demo (Special Guest Page)**
   - Visual career maps for 2–3 sample students (demo mode).
   - Example 1: Class 12 Science (PCB) → Suggested: B.Sc. Nursing / MBBS → Career paths: Govt Exams, Hospital Jobs.
   - Example 2: Class 12 Commerce → Suggested: B.Com / BBA → Career paths: MBA, Chartered Accountant, Banking Jobs.
   - Example 3: Class 12 Arts → Suggested: B.A. Journalism → Career paths: Media, UPSC, NGOs.
   - Each roadmap shown as a flowchart/timeline with progress steps.

4. **Login / Sign Up Page**
   - Standard login form with role selection (Student, Parent, Admin).
   - But also include “Continue as Guest” button.

5. **Student Dashboard**
   - Sidebar navigation (Quiz, Roadmap, Colleges, Scholarships, Profile).
   - Main area: Personalized roadmap, recommended colleges, scholarships.
   - Right panel: Notifications & deadlines.

6. **Quiz Page**
   - Progress bar at the top.
   - Question text with multiple choice options (radio buttons).
   - Navigation buttons (Previous, Next, Submit).

7. **Roadmap Page**
   - Personalized timeline showing Current stage → Suggested streams → Degree options → Career outcomes.
   - Progress indicators with checkmarks.

8. **Colleges Directory**
   - Search bar at the top.
   - Filters panel (Stream, Location, Fees).
   - College cards with name, rating, cutoff, facilities.

9. **Scholarships Page**
   - List of scholarships (cards with title, amount, eligibility, deadline).
   - Apply/Save button.

10. **Parent Dashboard**
    - Tabs: Explore Courses, Compare Colleges, Success Stories, Contact Counselor.

11. **Admin Dashboard**
    - Sidebar: Manage Colleges, Scholarships, Career Paths, Analytics, Feedback.
    - Main area with forms and tables.

12. **Contact Page**
    - Contact form (Name, Email, Message).
    - Map or illustration on the right.
    - Footer links.

🔹 Special Notes:
- Add “Guest Profile” button on Landing and Login pages.
- Guest Dashboard should look like Student Dashboard but show Career Mapping Demo.
- Use card layouts, simple icons, and progress indicators.
- Mobile-first responsive designs.



//prompt 3//

Update the Quiz page so that options allow multiple selections (checkboxes instead of radio buttons). Based on different combinations of answers, generate varied result suggestions across multiple domains (e.g., Science → MBBS/B.Sc.; Commerce → B.Com/BBA; Arts → B.A./Journalism; Vocational → Skill-based careers), not just IT/Computer Science.

Enhance the result page with a dynamic career roadmap visualization: a horizontal progress path with milestones (Class 10 → Class 12 → Degree Options → Career Outcomes). Show progress with an animated gradient fill and a character icon moving along the roadmap as the candidate advances.


//prompt4//

# 🔹 Figma Prompt — Updated Website with Fixes & New Features  

**Design a modern, responsive web application update for “Bade Bhaiya” – Digital Guidance Platform for Students.**  
This is an upgrade to the existing design. Maintain the same style (color palette, typography, rounded cards, clean UI), but fix current malfunctions and add new features.  

---

## 🔧 Fixes to Implement

### 1. Quiz Section (Responsiveness)  
- Ensure quiz options (checkboxes/multiple-select) respond instantly on click, without lag.  
- Add smooth hover + click states for better UX feedback.  
- Optimize mobile responsiveness (tap-friendly buttons, larger hit areas).  

### 2. Career Path Recommendation Logic  
- Recommendations should be **directly tied to quiz input**.  
- Add logical mappings:  
  - **Science (PCB)** → MBBS, BDS, Nursing, B.Sc. Life Sciences.  
  - **Science (PCM)** → B.Tech, B.Sc., NDA, Merchant Navy.  
  - **Commerce** → B.Com, BBA, CA, CS, CMA, Banking.  
  - **Arts/Humanities** → B.A., Journalism, UPSC, NGOs, Law.  
  - **Vocational** → Skill-based diplomas, ITI, entrepreneurship.  
- Show **confidence levels + “Why this fits you” explanation** under each suggestion.  

### 3. Colleges Directory Expansion  
- Add **more colleges across streams and locations** (not just a few).  
- Include filters: Stream, Fees, Location, Govt/Private, Facilities.  
- Show more detailed **college cards** (cutoff, eligibility, facilities, ratings, contact info).  

### 4. Personalized Roadmap Enhancement  
- Roadmap should be **dynamic based on quiz results + profile**.  
- Show **step-by-step journey** (Current Stage → Stream → Degree → Career).  
- Add **animated progress tracker** with icons.  
- Allow users to **click milestones for deeper details** (e.g., exams needed, scholarship options, future jobs).  

---

## 🤖 New Feature: “Bade Bhaiya” Chatbot  

- Add a **chatbot assistant** named **Bade Bhaiya**.  
- **Style:** Friendly, mentor-like, big brother personality.  
- **Location:** Floating chatbot button (bottom-right corner) available on all pages.  

### Chatbot Features  
- Greets user by role (Student/Parent/Guest/Admin).  
- Provides **step-by-step guidance**:  
  - Example flow: “Let’s start with a quiz → Based on your results, here are colleges → Here’s a roadmap → Here are scholarships.”  
- Can answer FAQs:  
  - “Which stream suits me?”  
  - “How to apply for scholarships?”  
  - “Best colleges near me?”  
- Option to switch language (English/Hindi).  
- Links directly to relevant pages (Quiz, Colleges, Roadmap, Scholarships).  

---

## 🔹 Additional Notes
- Keep style consistent with previous design:  
  - **Colors:** Blue (#2563EB), Green (#16A34A), Amber (#F59E0B), Light Gray (#F9FAFB).  
  - **Typography:** Poppins for headings, Inter for body text.  
- Prioritize **mobile responsiveness**.  
- Use **card layouts, smooth animations, progress indicators**.  
- Maintain **student-friendly + professional vibe**.  


//prompt 5//
# 🔹 Figma Prompt — Enhanced Quiz, Profiling & Recommendations

**Design an improved version of the “Bade Bhaiya” Digital Guidance Platform.**  
This is an upgrade to the existing design, focusing on **better quiz responsiveness, detailed student profiling, and smarter recommendations**.  
Keep the existing design style (blue/green/amber palette, Poppins + Inter fonts, card-based layout, responsive UI).  

---

## 🔧 Fixes & Improvements

### 1. Quiz Responsiveness (Efficiency Upgrade)
- Make quiz options **instantly responsive** on click (no lag).  
- Add **clear hover/click states** with animations for feedback.  
- Support **fast mobile tap recognition** (bigger touch targets).  
- Ensure answers auto-save (local storage + sync for signed-in users).  

### 2. Student Profiling at Sign-Up
During **sign-up or onboarding**, ask for:  
- Name, email/phone, gender, preferred language.  
- **Schooling data**:  
  - Class 10 school, marks, subjects taken.  
  - Class 12 school, marks, stream chosen (Arts/Science/Commerce/Vocational).  
- Current stage:  
  - Class 10 student / Class 12 student / Graduate / Parent.  
- Location (city, district, state).  

✅ This data becomes part of the **student profile** and influences recommendations.  

### 3. Pre-Quiz Personal Questions
Before the main aptitude quiz, add a **short profile-based questionnaire**:  
- Have you completed Class 10? (Yes/No)  
- Are you currently in Class 12? (Yes/No)  
- Are you doing graduation right now? (Yes/No)  
- If yes, which degree are you pursuing? (Dropdown: B.A., B.Sc., B.Com, B.Tech, MBBS, etc.)  
- Future interest areas (checkboxes): Government Jobs, Higher Studies, Private Jobs, Entrepreneurship.  

👉 These answers **filter & personalize** the main quiz flow.  

### 4. Smarter Career Path Recommendations
- Recommendations should now use a **hybrid model**:  
  - **Profile Data** (education stage, marks, stream, location).  
  - **Quiz Answers** (interests, skills, preferences).  
- Example logic:  
  - If **Student = Class 12 (PCB)** → Prioritize MBBS, Nursing, B.Sc. Life Sciences.  
  - If **Student = Class 12 (Commerce)** → Suggest B.Com, BBA, CA, Banking.  
  - If **Student = Graduate (B.A. English)** → Suggest M.A., UPSC, Teaching, Journalism.  
- Each recommendation card should show:  
  - **Suggested Path** (Stream/Degree).  
  - **Why recommended** (based on quiz + profile).  
  - **Confiden**



//prompt 5//


- Context passed to Gemini:
- Student profile (class, marks, stream, location).  
- Quiz results (interests, strengths, preferences).  
- College + scholarship data (from database).  

---

## 🔧 Functional Flow
1. Greeting → “Arre chhote! Tell me, are you in Class 10, Class 12, or graduation right now?”  
2. Student reply → Gemini processes profile + quiz context.  
3. Recommendations:  
 - Suggest suitable streams/degrees.  
 - Show nearby government colleges (cards).  
 - Share scholarships with deadlines.  
 - Guide next steps (exams, applications).  
4. Option to “Download Roadmap PDF” or “Save to Profile”.  
5. If unsure, Bade Bhaiya says: *“I don’t know this exactly, better check official college site.”*  

---

## 📱 Mobile Responsiveness
- Compact chat window for mobile.  
- Large tap targets for options.  
- Voice input support for Hindi/English queries.  

---

## 🔹 Additional Notes
- Ensure **chat UI feels human and warm**, not robotic.  
- Add **emoji use** in replies (e.g., ✅, 📚, 🎯) for friendliness.  
- Maintain consistency with the platform’s design (card layouts, rounded corners, soft shadows).  


// prompt 6//


# 🔹 Figma AI Prompt — Enhanced AI-Driven "Bade Bhaiya" Guidance Platform

**Design an upgraded AI-driven guidance platform with chatbot “Bade Bhaiya” at its core.**  
The system should use **Gemini API** (or other AI) to generate dynamic, personalized recommendations for **Colleges, Scholarships, and Career Roadmaps**.  

---

## 🎨 Style & Personality
- Mentor vibe: Warm, big-brotherly, supportive.  
- UI Design: Rounded cards, soft shadows, pastel accent colors.  
- Fonts: **Poppins (headings), Inter (body)**.  
- Color palette: Blue (#2563EB), Green (#16A34A), Amber (#F59E0B), Light Gray (#F9FAFB), Dark Gray text (#111827).  
- Add **emoji usage in chatbot** to make it relatable (📚, 🎯, ✅, 🌟).  

---

## 🤖 Core AI-Driven Modules

### 1. **AI-Driven College Recommendation**
- Input: Student profile (class, stream, marks, location, quiz results).  
- AI logic: Gemini suggests **colleges based on profile + filters** (Govt focus).  
- College Cards UI:
  - Name, Cut-off, Facilities, Fees, Distance.  
  - **AI Tagline**: "This college fits you because your interest in Biology + PCB stream matches B.Sc. Life Sciences here."  
  - Save/Apply buttons.  
- Smart filters: By stream, location, affordability, facilities.  

---

### 2. **AI-Driven Scholarships**
- AI recommends scholarships based on:  
  - Student stage (Class 10, 12, UG, PG).  
  - Marks, family income, caste/category if provided.  
  - Location (state, district).  
- Scholarship Cards UI:
  - Title, Eligibility, Deadline, Amount, Apply Link.  
  - **AI Explanation**: "Since you scored 85% in Class 12 and are from UP, you are eligible for UP Govt Merit Scholarship."  
- Filters: Central, State, Category-based, Need-based.  

---

### 3. **AI-Driven Roadmap (Granular Sub-Steps)**
- Roadmap visualized as **interactive timeline with milestones + sub-milestones**.  
- Example Flow for Class 10 → Career Path:
  - **Stage 1: Current Level**
    - Class 10 Completed ✅
    - Marks: 75% (AI uses this in recommendations)  
  - **Stage 2: Stream Selection**
    - Science (PCM/PCB) → Sub-options: PCM → Engineering, NDA; PCB → Medicine, B.Sc.  
    - Commerce → Sub-options: Accounts, Business, Economics.  
    - Arts → Sub-options: Journalism, UPSC, Law.  
    - Vocational → Sub-options: ITI, Skill Programs.  
  - **Stage 3: Degree Options**
    - If Science → B.Tech, B.Sc, MBBS, Nursing.  
    - If Commerce → B.Com, BBA, CA Foundation.  
    - If Arts → B.A, Journalism, Law.  
  - **Stage 4: Career Outcomes**
    - Govt Exams, Higher Studies, Private Jobs, Entrepreneurship.  
  - **Stage 5: Micro-Steps (NEW)**
    - Entrance Exams → Application Deadlines → Scholarship Mapping → Recommended Study Resources.  
- Each sub-step should have clickable nodes → Show AI-driven explanations + resources.  

---

## 💬 Chatbot "Bade Bhaiya" (Gemini Integration)
- Persona Prompt for Gemini:  


//prompt//

- Chatbot UI:
- Floating chat button (bottom-right).  
- Window: Bade Bhaiya avatar, conversation log, input box (text + voice).  
- Smart suggestions (buttons inside chat): “View Colleges”, “Find Scholarships”, “Show Roadmap”.  
- Flow:
1. Greeting → "Hello! Main tumhara Bade Bhaiya hoon. Chalo tumhara career roadmap banate hain."  
2. Asks profile info → collects class, marks, stream.  
3. Suggests **stream → degree → career path** with micro-steps.  
4. Shows **AI-generated roadmap + colleges + scholarships** inside chat or as linked cards.  

---

## 🔧 Functional Flow (Enhanced)
1. **Landing Page** → Login / Guest → Profile setup.  
2. **Profile Collection** → Class, Stream, Marks, Location.  
3. **Quiz (Pre-Questions + Aptitude Quiz)** → AI tags generated.  
4. **Bade Bhaiya Chatbot** → Explains results step by step.  
5. **AI-Driven Roadmap** → Granular milestones (Current → Stream → Degree → Exams → Scholarships → Career).  
6. **College Recommendations** → AI-filtered list with “Why This College for You” note.  
7. **Scholarship Recommendations** → Personalized list with deadlines + apply buttons.  
8. **Save/Export Options** → Roadmap PDF, Save Colleges, Save Scholarships.  

---

## 📱 Mobile Responsiveness
- Compact chat design, scrollable roadmap.  
- Tap-friendly cards for colleges & scholarships.  
- Voice input + Hindi/English switcher.  

---

## 🔹 Additional Notes
- Ensure **every AI recommendation has a WHY explanation** → builds trust.  
- Sub-steps make the roadmap **actionable, not just visual**.  
- Use **animations**: character icon moving on roadmap, progress bars for steps.  
- Make chatbot **central guide** that connects all modules together.  

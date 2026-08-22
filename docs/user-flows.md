# User Flows — Bade Bhaiya

---

## 1 — Student Flow (Primary / Full Experience)

**Goal:** Student discovers the platform, takes the aptitude/interest quiz (multi-select), receives tailored recommendations, explores colleges & scholarships, and follows a personalized roadmap to apply.

### Entry points

* Click **Start Quiz** on Landing Page
* Click **Continue as Guest → then Start Quiz**
* Click **Sign Up / Login** → Student role

### Steps

1. **Landing → Sign up / Continue as Guest**

   * User chooses Student role or Guest.
   * If signing up: provide name, phone/email, class/grade, preferred language → submit → verify (OTP/email).
2. **Onboarding Tour (first-time)**

   * Short 3-slide tour: What quiz does, what roadmap is, how to save/apply.
3. **Profile setup**

   * If signed up: fill profile details (age, gender, board, current class, subjects of interest, location).
   * If guest: show a temporary profile banner with “You are browsing as Guest — sign up to save.”
4. **Take Aptitude & Interest Quiz**

   * Multi-select questions (checkboxes allowed) + some single-select items.
   * Progress bar shows question progress.
   * Option to pause & resume (if logged in).
5. **Quiz Processing**

   * Client collects answers; scoring engine applies weighted rules or basic heuristic to map to streams & courses (not always IT).
6. **Results Page**

   * Show 2–4 recommended streams/courses with explanation (why this fit), confidence level, and suggested next steps.
   * Show **“View Roadmap”** and **“Explore Colleges”** CTAs.
7. **Personalized Roadmap**

   * Visual roadmap (animated) from current stage → suggested stream → degree options → career outcomes.
   * Each roadmap node is clickable and opens deeper info (eg. degree → typical jobs, relevant entrance exams, study resources).
8. **Colleges & Scholarships**

   * From roadmap or main nav: Search/filter government colleges by course/location/fees.
   * College details include eligibility, cut-offs, facilities, contact.
   * Scholarships list with eligibility; Apply/Save CTA (Apply opens external link or admin-managed form).
9. **Save & Track**

   * Signed-up users can save college / scholarship to their profile and set reminders.
   * Notifications show upcoming deadlines (timeline tracker).
10. **Apply / Export**

    * Provide links or steps to apply; allow Download Career Report (PDF) for signed-in students.
11. **Feedback**

    * After key actions, prompt short feedback (1–2 star + comment) to improve recommendations.

### Acceptance criteria

* Quiz supports multi-select and returns varied recommendations (not biased to a single domain).
* Roadmap visual updates according to quiz output.
* Search & filter returns relevant colleges within 2–3 seconds.
* Signed-in users can save items and see them persist across sessions.

### Edge cases & error handling

* Network loss during quiz → autosave to localStorage (if logged in, sync when online).
* Guest trying to Save or Apply → show modal: “Sign up to save your progress” (option to continue applying via external link).
* No colleges found for a filter → show “No results” + suggested broader filters.
* Duplicate scholarship entries → deduplicate by unique id.

---

## 2 — Guest Flow (Demo / Quick Access)

**Goal:** Let judges or casual users experience full features quickly without signup; show demo roadmaps for 2–3 sample students.

### Steps

1. **Landing → Try as Guest**

   * Click **Try as Guest** (prominent CTA).
2. **Guest Home / Guest Dashboard**

   * Show a Guest banner: “You are browsing as Guest — sign up to save.”
   * Provide quick links: Start Demo Quiz, See Demo Roadmaps, Explore Colleges, See Scholarships.
3. **Demo Quiz or Pre-filled Examples**

   * Option A: Take quick quiz (no save) → get instant recommendations.
   * Option B: View 2–3 demo profiles (predefined: Science(PCB) student, Commerce student, Arts student) and their career roadmaps.
4. **Interact with Roadmap**

   * Click nodes on demo roadmap to show college and scholarship suggestions.
5. **Explore Colleges & Scholarships**

   * Full browsing allowed; actions that change state (save, set reminders) prompt signup.
6. **Exit**

   * Prompt small modal: “Sign up to save your settings” with benefits.

### Acceptance criteria

* Guest can access all read features (quiz, roadmaps, directories) without registration.
* Demo profiles are accessible from Guest Dashboard and clearly labeled as demo/sample.
* Guest cannot persist changes — any Save action triggers signup modal.

### Edge cases

* Guest closes tab mid-quiz → no data saved (unless browser local storage used for temporary state).
* Guest applies externally → track referral link if possible.

---

## 3 — Parent Flow (Awareness & Decision Support)

**Goal:** Parents can explore career paths, compare colleges, and contact counselors to help decide for their child.

### Steps

1. **Landing → Parent choose role or continue as Parent guest**
2. **Parent Dashboard**

   * Tabs: Explore Courses, Compare Colleges, Success Stories, Contact Counselor.
3. **Explore Courses**

   * Browse short, non-technical explanations of each stream and degree outcomes (jobs, salary range, further study).
4. **Compare Colleges**

   * Select 2–3 colleges and compare side-by-side (fees, distance, facilities, cutoffs).
5. **Success Stories**

   * Short case studies of students who chose government colleges and their career outcomes.
6. **Contact Counselor**

   * Fill form to request a callback/virtual counseling session; choice of language.
7. **Receive Guidance**

   * Counselors (managed by admin) respond — optionally shown as in-app messages + email.

### Acceptance criteria

* Compare tool allows 2–3 college comparison with clear fields.
* Parent contact form routes to admin dashboard and logs a ticket.

### Edge cases

* Parent requests counselor but no slots → show estimated wait and alternatives (FAQ, recorded webinar).

---

## 4 — Admin Flow (Content & Moderation)

**Goal:** Admins manage colleges, scholarships, career paths, and review analytics and feedback.

### Entry points

* Admin login (secure credentials + optional 2FA)

### Steps

1. **Admin Login**

   * Authenticate with secure password/2FA.
2. **Admin Dashboard**

   * Overview: pending updates, active users, key metrics.
3. **Manage Colleges**

   * CRUD interface: add/edit/delete college entries; fields: name, courses offered, cutoffs, facilities, contact.
   * Upload images/documents.
4. **Manage Scholarships**

   * CRUD scholarships with deadlines + application URLs.
5. **Manage Career Paths**

   * Edit mapping rules between quiz outcomes and recommended streams/courses; update descriptions.
6. **Analytics**

   * View dashboards: quizzes taken, top recommended courses, clicks on colleges, conversions (guest→signup), pilot district metrics.
7. **Manage Feedback**

   * Read & respond to user feedback, mark as resolved.
8. **Content Approval Workflow**

   * Proposed content (from partners/teachers) can be submitted for review and published by admin.

### Acceptance criteria

* Admin can successfully add/update colleges and scholarships and changes reflect on the public site within minutes.
* Analytics are readable and exportable (CSV).
* Role-based access control prevents unauthorized access.

### Edge cases & security

* Admin actions must be logged (audit trail).
* Rate-limit API endpoints for CRUD to avoid accidental mass updates.
* If admin edits live data, show preview & confirm before publishing.

---

## 5 — Quiz → Roadmap Logic (Mapping Rules)

**Goal:** Ensure quiz combinations produce varied, balanced outputs.

### Mapping rules (high-level)

* Each question has weighted tags (e.g., interest: biology → +2 for medical streams; interest: problem-solving → +2 for engineering).
* Multi-select answers aggregate weights across tags.
* Apply tie-breakers: if two streams tie, show top two with equal confidence; provide pros/cons for both.
* Include non-technical suggestions (arts, vocational) when corresponding weights exist.
* Avoid over-weighting any single tag that biases to IT by default.

### Acceptance criteria

* For same input pattern, output is consistent.
* Different combinations produce different domain recommendations (e.g., PCB-heavy returns MBBS/B.Sc, not IT).
* Provide confidence score and explanation for each recommended pathway.

---

## 6 — Notifications, Reminders & Timeline Tracker

**Goal:** Students receive timely reminders for admissions, scholarships, and exams.

### Behaviors

* Timeline widget shows upcoming deadlines.
* Users can set reminders (email / push / SMS).
* Admin can post district-specific alerts.

### Acceptance criteria

* Reminder scheduling respects user timezone and language.
* Reminders are cancelable.

---

## 7 — Accessibility & Localization

**Goal:** Platform usable by students in diverse regions & abilities.

### Requirements

* Text-to-speech for long descriptions / career explanations.
* UI supports Hindi + at least one regional language.
* Keyboard navigation & ARIA labels.

---

## Deliverables & Next Steps

* Copy these flows to `/SIH/docs/user-flows.md`.
* Use flows to:

  * Implement front-end routes & UX.
  * Define back-end API endpoints (quiz, user, colleges, scholarships, admin).
  * Produce acceptance test cases for the hackathon demo.

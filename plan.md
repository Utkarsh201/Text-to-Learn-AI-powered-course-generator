## Step-by-Step Implementation Plan: Text-to-Learn Course Generator

We will build a full-stack AI-powered course generator using Hugging Face, background queues (Bull/Redis), and PostgreSQL. 

Follow this guide step-by-step. Ask me for help when you are ready to tackle each step!

### Step 1: PostgreSQL & Prisma Setup (Backend)
1. Initialize Prisma ORM in your backend (`npm install prisma @prisma/client` and `npx prisma init`).
2. Update your `User` model in `schema.prisma` to match existing Auth0 data.
3. Add models for `Course`, `Module`, and `Lesson` with appropriate relations in `schema.prisma`.
4. Run `npx prisma db push` to sync your database schema to PostgreSQL.
5. *Action:* Implement API connection logic replacing Mongoose with Prisma client in `backend/config/db.js` (or similar).

### Step 2: Hugging Face AI Service (Backend)
1. Create a prompt structure designed to output valid JSON for the course syllabus. Ensure it enforces Hinglish explanations if tested.
2. Implement `backend/services/aiService.js` that calls the Hugging Face Inference API.
3. Test this service using a hardcoded prompt to verify you get a valid JSON course structure back.

### Step 3: Background Worker & Queues (Backend)
1. Install and setup Redis and Bull (`npm install bull`).
2. Create queue connection `backend/services/courseQueue.js`.
3. Create worker logic `backend/services/courseWorker.js` that consumes the queue, calls `aiService`, and saves the final parsed JSON to PostgreSQL using Prisma.
4. Integrate the existing email system so the worker sends a completion email to the user when done.

### Step 4: Core Course Endpoints (Backend)
1. `POST /api/courses/generate`: Endpoint to validate user prompt, create a queued job, and immediately return `{ job_id, status: 'processing' }`.
2. `GET /api/courses`: Fetch all courses belonging to the currently authenticated user from Prisma.
3. `GET /api/courses/:id`: Fetch a specific course, including its modules and lessons.

### Step 5: Frontend Layout & Routing (Frontend)
1. Setup React Router in `frontend/src/App.jsx`.
2. Map out empty routes for Home (`/`), Course Page (`/course/:id`), and Lesson View (`/lesson/:courseId/:lessonId`).
3. Create a layout wrap with your `Navbar` (with Auth0 login/logout) and a `SidebarNavigation`.

### Step 6: Triggering Course Generation (Frontend)
1. On the Home page, create a `PromptForm` component.
2. Implement API call via `frontend/src/utils/api.js` to dispatch the prompt to `POST /api/courses/generate`.
3. Add a visually appealing loading state or a toast notification saying "Course is generating in the background...".

### Step 7: Viewing the Syllabuses & Lessons (Frontend)
1. Fetch and list all completed courses on the Home page.
2. On `CourseOverview`, render the syllabus by mapping over the modules and nested lessons. 
3. On `LessonViewer`, visualize the rich text, markdown/code blocks, and external links for the selected lesson.

### Step 8: Polish (Frontend)
1. Implement PDF downloading by adding `html2pdf.js` to the Lesson View component.
2. Ensure the UI handles responsive design.
3. Perform end-to-end testing from input prompt to receiving the email to reading the downloaded PDF.

**Decisions:**
- Database shifted from MongoDB to **PostgreSQL with Prisma** for better typing and relational integrity.
- Hugging Face used for AI outputs, handled asynchronously via **Redis/Bull queues**.
- Client requests a course, goes about their business, and is emailed when it's structurally ready in the DB.

*Whenever you are ready, say "Let's start Step 1" and I will help you write the code for the Prisma schema!*

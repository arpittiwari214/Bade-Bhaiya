You are an autonomous full-stack project generator. On this Windows machine, CREATE a folder at this exact path and place the full project there:

%USERPROFILE%\Desktop\Bade Bhaiya Project

If you have permissions, create that folder programmatically and write all files directly into it. If you cannot write to that exact path programmatically, create the full project in the generator's workspace and then put a clear PowerShell copy/move block at the top of README.md showing how to move the generated folder to the Desktop. After files are created, initialize a git repository inside the project folder and make an initial commit with this exact message:

chore: initial generated Bade Bhaiya full-stack scaffold

-- High-level goal --
Generate a fully working Windows-local full-stack web app named "Bade Bhaiya" that can be run locally with Node.js (v18+). Use TypeScript for server and client, SQLite for DB, and make the dev workflow runnable on Windows (PowerShell commands).

-- Project path & name (must match exactly) --
%USERPROFILE%\Desktop\Bade Bhaiya Project

-- Required stack --
- Backend: Node.js 18+, TypeScript, Express
- DB: SQLite file at ./data/bade_bhaiya.sqlite (use knex + better-sqlite3)
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- Auth: JWT (httpOnly cookie preferred), bcrypt
- Tooling: ESLint, Prettier, Husky, lint-staged, ts-node-dev, concurrently
- Package manager: npm
- Dev ports: frontend 5173, backend 4000

-- Must-create file structure (place at the Desktop path) --
/Bade Bhaiya Project
  /server
    package.json, tsconfig.json, src/
      index.ts, app.ts, routes/, controllers/, services/, middleware/, db/knexfile.ts, db/migrations/, db/seeds/, utils/, types/
    .env.example, Dockerfile, jest.config.ts
  /client
    package.json, tsconfig.json, vite.config.ts, src/
      main.tsx, App.tsx, pages/(Login,Register,Dashboard,Profile,Projects,Admin), components/, hooks/, styles/
    tailwind.config.cjs
  /data
    (bade_bhaiya.sqlite created by seed)
  README.md
  docker-compose.yml
  .gitignore
  .eslintrc.cjs
  .prettierrc

-- Backend requirements (exact) --
- Use knex migrations to create tables: users, profiles, projects, recommendations, activity_log with proper FKs and indexes.
- Tables:
  - users: id (uuid), email UNIQUE, password_hash, role (student|mentor|admin), created_at
  - profiles: id, user_id FK, name, dob, education, skills JSON, roadmap JSON, created_at, updated_at
  - projects: id, owner_id FK, title, description, status, created_at
  - recommendations: id, profile_id FK, title, rationale, score numeric, created_at
  - activity_log: id, user_id, action, meta JSON, created_at
- Implement REST API with validation using zod:
  - POST /api/auth/register
  - POST /api/auth/login (set httpOnly cookie when possible)
  - GET /api/users/me
  - PUT /api/users/me
  - CRUD /api/projects
  - GET /api/recommendations?profileId=...
  - POST /api/recommendations/generate (deterministic rule-based generator using profile.skills; NO external APIs; add clear TODO where LLM can be integrated)
  - GET /api/admin/stats (admin-only)
  - POST /api/admin/seed (admin-only, idempotent)
- Middleware:
  - JWT auth (Authorization: Bearer … and cookie fallback)
  - role-check (admin)
  - per-IP in-memory rate limiter
  - helmet, cors (allow http://localhost:5173)
  - centralized JSON error handler: { error: string, details?: any }
- Passwords hashed with bcrypt (BCRYPT_SALT_ROUNDS via env)
- Provide server scripts: dev, start, migrate, migrate:rollback, seed
- Add at least 2 Jest unit tests for auth and one core endpoint

-- Frontend requirements (exact) --
- React + Vite + TypeScript under /client
- Pages: Login, Register, Dashboard, Profile, Projects, AdminPanel
- Dashboard displays:
  - roadmap visual from profile.roadmap JSON (timeline/steps)
  - progress bar for overallCompletion
  - recommendations panel calling /api/recommendations
  - projects list with create/edit
- Auth: prefer httpOnly cookie; fallback to secure localStorage (documented)
- API calls attach Authorization header if localStorage token used
- Use react-hook-form + zod resolver for forms
- Provide one React Testing Library test for a key component
- Build outputs to /client/dist

-- Seeds & data (idempotent) --
- Create seed data that results in ./data/bade_bhaiya.sqlite:
  - 3 users: student@example.com (Passw0rd!), mentor@example.com, admin@example.com — document creds in README
  - Sample profiles including skills arrays and roadmap JSON
  - 5 projects
  - 8 recommendations with rationales

-- Config & env --
- Root .env.example and /server/.env.example with:
  JWT_SECRET=change_me
  NODE_ENV=development
  DATABASE_FILE=./data/bade_bhaiya.sqlite
  PORT=4000
  BCRYPT_SALT_ROUNDS=10
- Use dotenv (do not commit real .env)

-- Dev & production scripts --
- Root-level scripts (or documented root workflow) to:
  - dev: run server:dev and client:dev concurrently (PowerShell-friendly)
  - build: build client
  - start: serve built client via Express when NODE_ENV=production
- Server should serve /client/dist in production
- Provide export-zip script to create deployable zip excluding node_modules

-- README (Windows-first) must include --
- Top note: this project folder was created by Gemini CLI at: %USERPROFILE%\Desktop\Bade Bhaiya Project
- Exact PowerShell commands for manual folder creation & movement only as fallback:
  md "$env:USERPROFILE\Desktop\Bade Bhaiya Project"
  cd "$env:USERPROFILE\Desktop\Bade Bhaiya Project"
- Step-by-step Windows setup (PowerShell examples):
  - Install Node.js v18+
  - cd "%USERPROFILE%\Desktop\Bade Bhaiya Project\server" ; npm install
  - cd "%USERPROFILE%\Desktop\Bade Bhaiya Project\client" ; npm install
  - Run migrations & seeds:
    cd "%USERPROFILE%\Desktop\Bade Bhaiya Project\server"
    npm run migrate
    npm run seed
  - Run dev:
    cd "%USERPROFILE%\Desktop\Bade Bhaiya Project"
    npm run dev
  - Production build & start:
    npm run build
    npm start
- Provide example PowerShell curl or Invoke-RestMethod examples for register/login and protected endpoints
- Document credentials for seeded users (dev-only)
- Troubleshooting Windows-specific issues

-- Quality, security & CI --
- Use helmet, zod validation, bcrypt hashing
- ESLint + Prettier configuration and lint scripts
- Husky pre-commit + lint-staged
- GitHub Actions workflow (.github/workflows/ci.yml) to run lint & tests
- Insert TODOs for LLM integration at /server/services/recommendationAi.ts

-- Acceptance criteria (must be true) --
1. Gemini CLI must create folder %USERPROFILE%\Desktop\Bade Bhaiya Project (or clearly document why it couldn't and provide precise copy commands).
2. After running npm install in /server and /client, then npm run migrate && npm run seed, running npm run dev from the project root should expose:
   - Frontend at http://localhost:5173
   - Backend at http://localhost:4000
3. TypeScript compiles without errors.
4. README contains all PowerShell commands and example credentials.
5. Git repo initialized with initial commit message exactly:
   chore: initial generated Bade Bhaiya full-stack scaffold

-- Final strict instructions to you (generator) --
- Create every file with runnable TypeScript code and clear inline comments.
- Prefer working, secure defaults over advanced features.
- Initialize git in the created Desktop folder and make the initial commit with the exact message above.
- Stop after creating files and making the initial commit. If you cannot write to %USERPROFILE%\Desktop, include a clear top-of-README note explaining the limitation and precise PowerShell commands the user should run to move the generated project to the Desktop.

Generate the full project now and place it at %USERPROFILE%\Desktop\Bade Bhaiya Project.

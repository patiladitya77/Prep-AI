<div align="center">

# PrepAI

### AI-Powered Mock Interview & Resume Analysis Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis)](https://upstash.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

PrepAI helps job seekers practice technical and behavioral interviews with personalized AI-generated questions, real-time proctoring, and detailed performance analytics — all powered by Google Gemini.

</div>

---

## Overview

PrepAI is a full-stack SaaS platform that simulates real job interviews. Users upload their resume and a job description, and the system generates 10 highly personalized interview questions using Google Gemini AI. During the interview, a real-time proctoring system monitors the candidate via webcam using MediaPipe FaceMesh — detecting tab switches, gaze direction, and multiple faces. After the session, every answer is scored and critiqued by Gemini, producing a detailed results report with strengths, improvements, and an overall grade.

The platform also includes a standalone resume analyzer that scores resumes across five dimensions and provides actionable feedback, optionally matched against a specific job description.

**Target users:** Software engineers, CS students, and career switchers preparing for technical interviews.

---

## Features

### AI Interview Engine

- Generates 10 personalized questions per session using the candidate's resume + job description
- Questions are tailored by role (frontend, backend, fullstack, etc.) and experience level (0–2, 3–5, 5+ years)
- Difficulty scales automatically: fundamentals for juniors, system design for seniors
- Behavioral and technical question mix (2:1 ratio)
- Fallback question sets if Gemini is unavailable

### Real-Time Proctoring

- MediaPipe FaceMesh detects face presence, gaze direction, and multiple faces in frame
- Tab-switch and window-blur detection with keyboard shortcut blocking (DevTools, Alt+Tab, etc.)
- Configurable warning threshold (default: 3 warnings → auto-terminate)
- Continuous look-away detection with configurable timeout
- Calibration period before monitoring begins

### Answer Evaluation

- Each answer scored 1–10 by Gemini with detailed feedback
- Returns structured strengths, improvements, and overall feedback
- Rate-limited API calls (8/min) with graceful fallback scoring based on answer length/quality
- Session finalization calculates overall score, grade, and completion percentage

### Resume Analysis

- Upload PDF or paste plain text
- Gemini extracts and parses resume into structured JSON (name, skills, experience, projects, education)
- Scores across 5 dimensions: formatting, content, skills, experience, keywords
- Optional job description matching for targeted gap analysis
- Analysis history stored per user

### Analytics Dashboard

- Interview history with scores and trends
- Monthly progress charts (Chart.js)
- Skills performance breakdown from JD data
- Resume analysis history with per-dimension scores

### Goals Tracking

- Create goals across 4 categories: INTERVIEW, LEARNING, PRACTICE, RESUME
- Track progress (0–100%) and completion status
- Target date management

### Authentication

- Email/password with bcrypt hashing
- Google OAuth 2.0 (authorization code flow)
- JWT-based sessions (7-day expiry)
- Password reset via token-based email flow

### Freemium Model

- Free tier: 5 interviews, 6 resume uploads
- Premium tier: 20 interviews, 20 resume uploads
- Upgrade flow with checkout page

### Question Bank

- Browse AI-generated practice questions by category: frontend, backend, devops, mobile
- Questions include difficulty level, estimated answer time, and topic tags

---

## Architecture

```mermaid
graph TB
    subgraph Client["Browser (Next.js App Router)"]
        UI[React UI]
        AuthCtx[Auth Context]
        MediaPipe[MediaPipe FaceMesh]
    end

    subgraph Server["Next.js API Routes (Edge/Node)"]
        AuthAPI[Auth API]
        InterviewAPI[Interview API]
        ResumeAPI[Resume API]
        AnalyticsAPI[Analytics API]
        GoalsAPI[Goals API]
    end

    subgraph Queue["Background Worker"]
        BullMQ[BullMQ Queue]
        Worker[Question Worker]
    end

    subgraph AI["Google Gemini 2.5 Flash"]
        QGen[Question Generation]
        Scoring[Answer Scoring]
        ResumeParse[Resume Parsing]
        ResumeAnalyze[Resume Analysis]
    end

    subgraph Data["Data Layer"]
        Postgres[(Neon PostgreSQL)]
        Redis[(Upstash Redis)]
    end

    UI --> AuthAPI
    UI --> InterviewAPI
    UI --> ResumeAPI
    UI --> AnalyticsAPI
    UI --> GoalsAPI

    InterviewAPI -->|add job| BullMQ
    BullMQ --> Redis
    Redis --> Worker
    Worker --> QGen
    Worker --> Postgres

    InterviewAPI --> Scoring
    ResumeAPI --> ResumeParse
    ResumeAPI --> ResumeAnalyze

    AuthAPI --> Postgres
    InterviewAPI --> Postgres
    ResumeAPI --> Postgres
    AnalyticsAPI --> Postgres
    GoalsAPI --> Postgres

    MediaPipe -->|proctoring events| UI
```

### Data Flow: Interview Session

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Next.js API
    participant Q as BullMQ/Redis
    participant W as Question Worker
    participant AI as Gemini AI
    participant DB as PostgreSQL

    U->>FE: Fill setup form (role, JD, experience)
    FE->>API: POST /api/interview/create
    API->>DB: Create Resume, JD, InterviewSession records
    API->>Q: Enqueue question-generation job
    API-->>FE: Return sessionId

    Q->>W: Dequeue job
    W->>AI: Generate 10 personalized questions
    AI-->>W: JSON questions array
    W->>DB: Save questions to session

    FE->>API: Poll /api/interview/questions
    API-->>FE: Return questions when ready

    loop For each question
        U->>FE: Record/type answer
        FE->>API: POST /api/interview/answer
        API->>DB: Save answer
    end

    U->>FE: Finish interview
    FE->>API: POST /api/interview/finish
    API->>AI: Score each answer (Gemini)
    AI-->>API: Score + feedback per answer
    API->>DB: Update answers + session (COMPLETED)
    API-->>FE: Full results with grades
```

---

## Tech Stack

| Category            | Technology                                                     |
| ------------------- | -------------------------------------------------------------- |
| **Framework**       | Next.js 15 (App Router)                                        |
| **Language**        | TypeScript 5.9, JavaScript                                     |
| **UI**              | React 19, Tailwind CSS 4, Framer Motion, Radix UI, Headless UI |
| **Charts**          | Chart.js, react-chartjs-2                                      |
| **Icons**           | Lucide React, Heroicons                                        |
| **Auth**            | JWT (jsonwebtoken), bcryptjs, Google OAuth 2.0                 |
| **Database**        | PostgreSQL (Neon serverless)                                   |
| **ORM**             | Prisma 6                                                       |
| **Queue**           | BullMQ 5                                                       |
| **Cache/Broker**    | Redis (Upstash, via ioredis)                                   |
| **AI**              | Google Gemini 2.5 Flash (`@google/generative-ai`)              |
| **Computer Vision** | MediaPipe FaceMesh (`@mediapipe/face_mesh`)                    |
| **PDF Processing**  | Gemini Vision API (multimodal PDF ingestion)                   |
| **Speech**          | react-hook-speech-to-text (browser Web Speech API)             |
| **Webcam**          | react-webcam                                                   |
| **PDF Export**      | jsPDF                                                          |
| **Dev Tools**       | ESLint, Nodemon, ts-node, concurrently                         |

---

## Folder Structure

```
prep-ai/
├── prisma/
│   ├── schema.prisma          # Database models and relations
│   └── migrations/            # Versioned SQL migration history
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # All API route handlers
│   │   │   ├── auth/          # login, signup, logout, me, google OAuth, password reset
│   │   │   ├── interview/     # create, answer, finish, score, questions, sessions, terminate
│   │   │   ├── resume/        # upload, analyze, details, delete
│   │   │   ├── analytics/     # Interview + resume analytics aggregation
│   │   │   ├── goals/         # CRUD for user goals
│   │   │   ├── questions/     # AI question bank generation by category
│   │   │   ├── speech-to-text/# Speech transcription endpoint
│   │   │   └── user/          # Usage stats, upgrade to premium
│   │   │
│   │   ├── home/              # Authenticated app shell
│   │   │   ├── dashboard/     # Overview + recent sessions
│   │   │   ├── analytics/     # Charts and performance trends
│   │   │   ├── goals/         # Goal management UI
│   │   │   ├── profile/       # User profile
│   │   │   ├── questions/     # Question bank browser
│   │   │   └── upload-resume/ # Resume upload and details
│   │   │
│   │   ├── interview/
│   │   │   ├── setup/         # Interview configuration form
│   │   │   └── [interviewId]/ # Live interview + results page
│   │   │
│   │   ├── resume-check/      # Standalone resume analyzer
│   │   ├── pricing/           # Pricing page
│   │   ├── checkout/          # Upgrade checkout
│   │   ├── login/             # Auth pages
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   ├── components/
│   │   ├── interview/         # InterviewUI, RecordAnswerSection, PreparingInterview,
│   │   │                      # InterviewMonitoringDisplay, WarningModal, Avatar
│   │   ├── dashboard/         # PreviousInterviewCard, UsageProgress
│   │   ├── resume/            # ResumeUpload, ResumeDisplay
│   │   ├── navigation/        # Sidebar, LeftNav, NavBar
│   │   ├── miscellaneous/     # Pricing, AuthProviderWrapper
│   │   └── ui/                # Shared primitives (Button, Card, Dialog, Input, Progress)
│   │
│   ├── context/
│   │   └── AuthContext.tsx    # Global auth state (JWT + user, localStorage persistence)
│   │
│   ├── hooks/
│   │   ├── useInterviewMonitoring.ts  # MediaPipe proctoring hook
│   │   ├── useGoals.ts                # Goals CRUD hook
│   │   └── useUsageStats.ts           # Usage limits hook
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── auth/helpers.js    # hashPassword, comparePassword, generateToken, validators
│   │   └── queue/
│   │       ├── queue.ts       # BullMQ queue definition
│   │       └── workers/
│   │           └── questionworker.ts  # Background question generation worker
│   │
│   ├── services/
│   │   └── questionGeneration.ts  # Core Gemini question generation service
│   │
│   └── utils/
│       └── interviewCache.ts  # Client-side interview state caching
│
├── dist-worker/               # Compiled worker output (tsc)
├── public/docs/               # Architecture diagrams (ER diagram, system architecture)
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## API Reference

### Authentication

| Method | Endpoint                         | Description                    | Auth Required |
| ------ | -------------------------------- | ------------------------------ | ------------- |
| `POST` | `/api/auth/signup`               | Register with email + password | No            |
| `POST` | `/api/auth/login`                | Login, returns JWT             | No            |
| `POST` | `/api/auth/logout`               | Invalidate session             | Yes           |
| `GET`  | `/api/auth/me`                   | Get current user profile       | Yes           |
| `GET`  | `/api/auth/google`               | Initiate Google OAuth flow     | No            |
| `GET`  | `/api/auth/google/callback`      | OAuth callback, issues JWT     | No            |
| `POST` | `/api/auth/forgot-password`      | Send password reset email      | No            |
| `POST` | `/api/auth/validate-reset-token` | Validate reset token           | No            |
| `POST` | `/api/auth/reset-password`       | Set new password               | No            |

### Interview

| Method | Endpoint                       | Description                                 | Auth Required |
| ------ | ------------------------------ | ------------------------------------------- | ------------- |
| `POST` | `/api/interview/create`        | Create session, enqueue question generation | Yes           |
| `GET`  | `/api/interview/questions`     | Poll for generated questions                | Yes           |
| `POST` | `/api/interview/answer`        | Submit answer for a question                | Yes           |
| `POST` | `/api/interview/finish`        | Finalize session, score all answers via AI  | Yes           |
| `GET`  | `/api/interview/score`         | Get current session progress                | Yes           |
| `GET`  | `/api/interview/sessions`      | List all user sessions                      | Yes           |
| `GET`  | `/api/interview/completed`     | List completed sessions                     | Yes           |
| `GET`  | `/api/interview/[interviewId]` | Get session details                         | Yes           |
| `POST` | `/api/interview/terminate`     | Terminate active session                    | Yes           |
| `POST` | `/api/interview/reattempt`     | Create reattempt session                    | Yes           |

**POST `/api/interview/create` — Request Body:**

```json
{
  "jobRole": "Senior Frontend Engineer",
  "jobDescription": "We are looking for...",
  "experienceYears": 4,
  "existingResumeId": "clx123abc"
}
```

**POST `/api/interview/finish` — Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "clx...",
    "overallScore": 7.4,
    "grade": "Average",
    "completionPercentage": 100,
    "questionResults": [
      {
        "questionText": "...",
        "answer": "...",
        "score": 8.5,
        "feedback": "...",
        "strengths": ["..."],
        "improvements": ["..."]
      }
    ],
    "overallFeedback": "You completed 100% of the interview..."
  }
}
```

### Resume

| Method   | Endpoint                   | Description                                   | Auth Required |
| -------- | -------------------------- | --------------------------------------------- | ------------- |
| `POST`   | `/api/resume/upload`       | Upload PDF, extract + parse with Gemini       | Yes           |
| `GET`    | `/api/resume/upload`       | List user's resumes                           | Yes           |
| `POST`   | `/api/resume/analyze`      | Analyze resume (PDF or text) with optional JD | Yes           |
| `GET`    | `/api/resume/details/[id]` | Get resume details                            | Yes           |
| `DELETE` | `/api/resume/delete/[id]`  | Delete a resume                               | Yes           |

### Other

| Method   | Endpoint                  | Description                           | Auth Required |
| -------- | ------------------------- | ------------------------------------- | ------------- |
| `GET`    | `/api/analytics`          | Full analytics (interviews + resumes) | Yes           |
| `GET`    | `/api/goals`              | List user goals                       | Yes           |
| `POST`   | `/api/goals`              | Create a goal                         | Yes           |
| `PUT`    | `/api/goals/[id]`         | Update goal                           | Yes           |
| `DELETE` | `/api/goals/[id]`         | Delete goal                           | Yes           |
| `POST`   | `/api/questions/generate` | Generate question bank by category    | No            |
| `GET`    | `/api/user/usage`         | Get usage stats vs limits             | Yes           |
| `POST`   | `/api/user/upgradetopro`  | Upgrade user to premium               | Yes           |

---

## Database Schema

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string subscriptionPlan
        int interviewAttempts
        boolean isPremium
        string resetToken
        datetime resetTokenExpiry
        datetime createdAt
        datetime updatedAt
    }

    Resume {
        string id PK
        string userId FK
        string file_name
        string file_path
        json parsedData
        datetime createdAt
    }

    ResumeAnalysis {
        string id PK
        string userId FK
        string fileName
        string analysisType
        float overallScore
        json detailedScores
        json strengths
        json weaknesses
        json suggestions
        string extractedText
        string jobDescription
        datetime analysisDate
    }

    JD {
        string id PK
        string userId FK
        json parsedData
        datetime createdAt
    }

    InterviewSession {
        string id PK
        string userId FK
        string resumeId FK
        string jdId FK
        enum status
        float score
        string feedback
        datetime startedAt
        datetime endedAt
    }

    Question {
        string id PK
        string sessionId FK
        string questionText
        int order
        datetime createdAt
    }

    Answer {
        string id PK
        string sessionId FK
        string questionId FK
        string candidateAnswer
        float score
        string feedback
        json strengths
        json improvements
        datetime submittedAt
    }

    Goal {
        string id PK
        string userId FK
        string title
        string description
        enum category
        datetime targetDate
        boolean completed
        int progress
    }

    User ||--o{ Resume : "uploads"
    User ||--o{ ResumeAnalysis : "has"
    User ||--o{ JD : "creates"
    User ||--o{ InterviewSession : "conducts"
    User ||--o{ Goal : "sets"
    InterviewSession ||--o{ Question : "contains"
    InterviewSession ||--o{ Answer : "records"
    Question ||--o{ Answer : "answered by"
    Resume ||--o{ InterviewSession : "used in"
    JD ||--o{ InterviewSession : "used in"
```

### Key Model Notes

- `parsedData` on `Resume` stores structured JSON: name, skills, experience, projects, education
- `parsedData` on `JD` stores: title, skillsReq, expReq
- `detailedScores` on `ResumeAnalysis` stores per-dimension scores: formatting, content, skills, experience, keywords
- `InterviewSession.status` enum: `ACTIVE | COMPLETED | ABANDONED`
- `Goal.category` enum: `INTERVIEW | LEARNING | PRACTICE | RESUME`

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- Redis instance ([Upstash](https://upstash.com) free tier works)
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com))
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com))

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (Neon PostgreSQL or any PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT
JWT_SECRET="your-secure-random-secret-min-32-chars"
JWT_EXPIRES_IN="7d"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Redis (Upstash or local)
REDIS_URL="rediss://default:password@host:port"

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/prep-ai.git
cd prep-ai

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to inspect data
npm run db:studio
```

### Running Locally

You need two processes running simultaneously: the Next.js dev server and the BullMQ question worker.

**Terminal 1 — Next.js app:**

```bash
npm run dev
```

**Terminal 2 — Question generation worker:**

```bash
npm run worker
```

The app will be available at `http://localhost:3000`.

> The worker must be running for interview question generation to work. Without it, questions will remain pending after session creation.

### Build for Production

```bash
# Build Next.js app
npm run build

# Build the worker
npm run worker:build

# Start the app
npm start

# Start the worker (in a separate process/container)
node dist-worker/lib/queue/workers/questionWorker.js
```

---

## Deployment

### Recommended Stack

| Service                        | Purpose                            |
| ------------------------------ | ---------------------------------- |
| [Vercel](https://vercel.com)   | Next.js app hosting (serverless)   |
| [Neon](https://neon.tech)      | Serverless PostgreSQL              |
| [Upstash](https://upstash.com) | Serverless Redis (BullMQ broker)   |
| VPS / Railway / Render         | Long-running BullMQ worker process |

### Important Notes

- The BullMQ worker is a **long-running Node.js process** and cannot run on Vercel serverless functions. Deploy it separately on a VPS, Railway, or Render.
- Set all environment variables in your hosting provider's dashboard.
- For Google OAuth, add your production domain to the authorized redirect URIs in Google Cloud Console: `https://yourdomain.com/api/auth/google/callback`.
- Neon requires both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct connection for migrations).

---

## AI Pipeline

```mermaid
flowchart TD
    A[User uploads resume PDF] --> B[Gemini Vision: Extract text from PDF]
    B --> C[Gemini: Parse text into structured JSON]
    C --> D[Store parsedData in Resume record]

    E[User creates interview session] --> F[BullMQ: Enqueue question-generation job]
    F --> G[Worker picks up job from Redis]
    G --> H{Resume data available?}
    H -->|Yes| I[Build personalized prompt with resume + JD]
    H -->|No| J[Build generic prompt with JD only]
    I --> K[Gemini 2.5 Flash: Generate 10 questions as JSON]
    J --> K
    K --> L{Parse JSON response}
    L -->|Success| M[Save questions to DB]
    L -->|Failure| N[Use role/experience fallback questions]
    N --> M

    O[User submits answer] --> P[Save answer to DB]

    Q[User finishes interview] --> R[For each question+answer]
    R --> S[Gemini: Score 1-10 + feedback + strengths + improvements]
    S --> T{Rate limit OK?}
    T -->|Yes| U[AI scoring]
    T -->|No| V[Fallback: length-based scoring]
    U --> W[Update Answer record in DB]
    V --> W
    W --> X[Calculate average score + grade]
    X --> Y[Mark session COMPLETED]
    Y --> Z[Return full results to client]
```

---

## Proctoring System

The `useInterviewMonitoring` hook implements a multi-layer integrity system:

| Detection Type             | Mechanism                          | Warning Trigger                            |
| -------------------------- | ---------------------------------- | ------------------------------------------ |
| Tab switch                 | `visibilitychange` + `blur` events | Immediate on hide/blur                     |
| Long tab absence           | Duration tracking                  | Additional warning if away > 2s            |
| Face not detected          | MediaPipe FaceMesh                 | After 5s of no face                        |
| Eyes closed / looking away | Landmark gaze analysis             | After 8–15s                                |
| Multiple faces             | FaceMesh `maxNumFaces: 4`          | Immediate, 10s cooldown                    |
| Continuous look-away       | Duration tracking                  | After configurable threshold (default 60s) |
| Keyboard shortcuts         | `keydown` event blocking           | Immediate warning + toast                  |

After `maxWarnings` (default: 3), the session is automatically terminated.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

<div align="center">

# PrepAI

### AI-Powered Mock Interview & Resume Analysis Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

An AI-powered interview preparation platform that generates personalized interview questions, provides real-time proctoring, and delivers detailed performance analytics — all powered by Google Gemini AI.

</div>

---

## Overview

PrepAI is a full-stack platform that simulates realistic job interviews. Upload your resume and job description, and the system generates 10 personalized interview questions using Google Gemini AI. During the interview, a real-time proctoring system monitors candidates using MediaPipe FaceMesh for face detection, gaze tracking, and tab-switch detection. After completion, Gemini scores each answer with detailed feedback, strengths, improvements, and an overall grade.

The platform includes a resume analyzer that scores resumes across five dimensions with actionable feedback, and can be matched against specific job descriptions.

**Target users:** Software engineers, CS students, and professionals preparing for technical and behavioral interviews.

---

## Features

### AI Interview Engine

- Generates 10 personalized questions per session based on resume and job description
- Questions tailored by role (frontend, backend, fullstack) and experience level (0-2, 3-5, 5+ years)
- Automatic difficulty scaling: fundamentals for juniors, system design for seniors
- Mix of behavioral and technical questions (1:2 ratio)
- Fallback question sets if AI is unavailable

### Real-Time Proctoring

- MediaPipe FaceMesh detects face presence, eye detection, and gaze direction
- Multiple face detection with warnings
- Tab-switch and window-blur detection
- Keyboard shortcut blocking (DevTools, Alt+Tab)
- Configurable warning threshold (default: 3 warnings → auto-terminate)
- Continuous look-away detection with timeout
- 5-second calibration period before monitoring starts

### Answer Evaluation

- Each answer scored 1-10 by Gemini with detailed feedback
- Structured strengths, improvements, and overall feedback per answer
- Rate-limited API calls with graceful fallback scoring
- Overall session scoring and grading

### Resume Analysis

- Upload PDF or paste plain text
- Gemini parses resume into structured JSON
- Scores across 5 dimensions: formatting, content, skills, experience, keywords
- Optional job description matching for gap analysis
- Analysis history per user

### Analytics Dashboard

- Interview history with scores and trends
- Monthly progress charts (Chart.js)
- Skills performance breakdown
- Resume analysis history with per-dimension scores

### Goals Tracking

- Create goals across 4 categories: INTERVIEW, LEARNING, PRACTICE, RESUME
- Progress tracking (0-100%)
- Target date management

### Authentication

- Email/password with bcrypt hashing
- Google OAuth 2.0
- JWT-based sessions (7-day expiry)
- Password reset via token-based email flow

### Freemium Model

- Free tier: 5 interviews, 6 resume uploads
- Premium tier: 20 interviews, 20 resume uploads
- Upgrade flow

### Question Bank

- Browse AI-generated practice questions by category
- Questions include difficulty level and topic tags

---

## Architecture

```mermaid
graph TB
    subgraph Client["Browser (Next.js App Router)"]
        UI[React UI]
        AuthCtx[Auth Context]
        MediaPipe[MediaPipe FaceMesh]
    end

    subgraph Server["Next.js API Routes"]
        AuthAPI[Auth API]
        InterviewAPI[Interview API]
        ResumeAPI[Resume API]
        AnalyticsAPI[Analytics API]
        GoalsAPI[Goals API]
    end

    subgraph AI["Google Gemini 2.5 Flash"]
        QGen[Question Generation]
        Scoring[Answer Scoring]
        ResumeParse[Resume Parsing]
        ResumeAnalyze[Resume Analysis]
    end

    subgraph Data["Data Layer"]
        Postgres[(PostgreSQL)]
    end

    UI --> AuthAPI
    UI --> InterviewAPI
    UI --> ResumeAPI
    UI --> AnalyticsAPI
    UI --> GoalsAPI

    InterviewAPI --> QGen
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

## Tech Stack

| Category            | Technology                                         |
| ------------------- | -------------------------------------------------- |
| **Framework**       | Next.js 15 (App Router)                            |
| **Language**        | TypeScript 5.9                                     |
| **UI**              | React 19, Tailwind CSS 4, Framer Motion, Radix UI  |
| **Charts**          | Chart.js, react-chartjs-2                          |
| **Icons**           | Lucide React, Heroicons                            |
| **Auth**            | JWT, bcryptjs, Google OAuth 2.0                    |
| **Database**        | PostgreSQL                                         |
| **ORM**             | Prisma 6                                           |
| **AI**              | Google Gemini 2.5 Flash                            |
| **Computer Vision** | MediaPipe FaceMesh                                 |
| **PDF Processing**  | Gemini Vision API (multimodal PDF ingestion)       |
| **Speech**          | react-hook-speech-to-text (Browser Web Speech API) |
| **Webcam**          | react-webcam                                       |
| **PDF Export**      | jsPDF                                              |

---

## Folder Structure

```
prep-ai/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── migrations/            # SQL migration history
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── interview/     # Interview session management
│   │   │   ├── resume/        # Resume upload & analysis
│   │   │   ├── analytics/     # Analytics aggregation
│   │   │   ├── goals/         # Goals CRUD
│   │   │   ├── questions/     # Question bank
│   │   │   └── user/          # User management
│   │   │
│   │   ├── home/              # Authenticated app
│   │   │   ├── dashboard/     # Overview & recent sessions
│   │   │   ├── analytics/     # Performance trends
│   │   │   ├── goals/         # Goal management
│   │   │   ├── profile/       # User profile
│   │   │   ├── questions/     # Question browser
│   │   │   └── upload-resume/ # Resume management
│   │   │
│   │   ├── interview/
│   │   │   ├── setup/         # Interview configuration
│   │   │   └── [interviewId]/ # Live interview & results
│   │   │
│   │   └── ... (auth, resume-check, pricing, checkout)
│   │
│   ├── components/
│   │   ├── interview/         # Interview UI components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── resume/            # Resume components
│   │   ├── navigation/        # Nav components
│   │   └── ui/                # Shared UI primitives
│   │
│   ├── context/
│   │   └── AuthContext.tsx    # Global auth state
│   │
│   ├── hooks/
│   │   ├── useInterviewMonitoring.ts  # Proctoring hook
│   │   ├── useGoals.ts                # Goals management
│   │   └── useUsageStats.ts           # Usage tracking
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   └── auth/              # Auth utilities
│   │
│   ├── services/
│   │   └── questionGeneration.ts  # AI question generation
│   │
│   └── utils/
│       └── interviewCache.ts  # Client-side caching
│
├── public/docs/               # Architecture diagrams
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

**Response:**

```json
{
  "success": true,
  "message": "Interview session created successfully",
  "data": {
    "sessionId": "clx...",
    "jdId": "clx...",
    "resumeId": "clx...",
    "jobRole": "Senior Frontend Engineer",
    "experienceYears": 4
  }
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
- PostgreSQL database
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com))
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com))

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname"
DIRECT_URL="postgresql://user:password@host/dbname"

# JWT
JWT_SECRET="your-secure-random-secret-min-32-chars"
JWT_EXPIRES_IN="7d"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

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

# (Optional) Open Prisma Studio
npm run db:studio
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm start
```

---

## Deployment

### Recommended Stack

| Service                      | Purpose             |
| ---------------------------- | ------------------- |
| [Vercel](https://vercel.com) | Next.js app hosting |
| PostgreSQL provider          | Database            |

### Deployment Notes

- Set all environment variables in your hosting provider's dashboard
- For Google OAuth, add your production domain to authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback`
- Ensure `DATABASE_URL` and `DIRECT_URL` are properly configured

---

## AI Pipeline

```mermaid
flowchart TD
    A[User uploads resume PDF] --> B[Gemini Vision: Extract text]
    B --> C[Gemini: Parse to structured JSON]
    C --> D[Store in Resume record]

    E[User creates interview] --> F[API generates questions immediately]
    F --> G{Resume data available?}
    G -->|Yes| H[Build personalized prompt]
    G -->|No| I[Build generic prompt]
    H --> J[Gemini: Generate 10 questions]
    I --> J
    J --> K{Parse JSON?}
    K -->|Success| L[Save questions to DB]
    K -->|Failure| M[Use fallback questions]
    M --> L

    N[User submits answer] --> O[Save to DB]

    P[User finishes interview] --> Q[For each answer]
    Q --> R[Gemini: Score + feedback]
    R --> S[Update Answer record]
    S --> T[Calculate average score]
    T --> U[Mark COMPLETED]
    U --> V[Return results]
```

---

## Proctoring System

The `useInterviewMonitoring` hook implements multi-layer integrity monitoring:

| Detection Type             | Mechanism                   | Warning Trigger                 |
| -------------------------- | --------------------------- | ------------------------------- |
| Tab switch                 | `visibilitychange` + `blur` | Immediate                       |
| Long tab absence           | Duration tracking           | Additional warning if away > 2s |
| Face not detected          | MediaPipe FaceMesh          | After 5s                        |
| Eyes closed / looking away | Landmark gaze analysis      | After 8-15s                     |
| Multiple faces             | FaceMesh face count         | Immediate, 10s cooldown         |
| Continuous look-away       | Duration tracking           | After threshold (default 60s)   |
| Keyboard shortcuts         | `keydown` event blocking    | Immediate                       |

After `maxWarnings` (default: 3), the session is automatically terminated.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

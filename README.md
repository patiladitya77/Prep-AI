# Prep-AI

> AI-Powered Interview Preparation Platform with Real-time Monitoring

Prep-AI is an intelligent interview preparation system that leverages Google Gemini AI to generate context-aware interview questions, evaluate answers, and provide detailed feedback. The platform features real-time proctoring, resume analysis, and comprehensive performance tracking to help candidates excel in their job interviews.

![System Architecture](./public/docs/system_architecture.jpg)

## ✨ Key Features

- **🤖 AI-Powered Question Generation** - Context-aware interview questions tailored to job role, experience level, and resume
- **📄 Smart Resume Analysis** - AI-driven resume parsing, scoring, and improvement suggestions
- **🎙️ Speech-to-Text** - Real-time answer recording with speech recognition
- **👁️ Interview Monitoring** - Face detection, eye tracking, and tab-switch detection using MediaPipe
- **📊 Detailed Feedback** - Comprehensive answer evaluation with strengths and improvement areas
- **🎯 Goal Tracking** - Set and monitor interview preparation goals
- **📈 Analytics Dashboard** - Track progress, scores, and performance trends
- **🔐 Secure Authentication** - JWT-based auth with Google OAuth integration

## 🏗️ System Architecture

The application follows a modern three-tier architecture:

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: Google Gemini 2.0 Flash API + MediaPipe Face Mesh

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sahilkhude117/Prep-AI.git
cd Prep-AI
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory (see [.env.example](#environment-variables)):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/prepai"

# Authentication
JWT_SECRET="your-secret-key-min-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App Configuration
NODE_ENV="development"
```

4. **Set up the database**
```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view database
npm run db:studio
```

5. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database commands
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## 🗂️ Project Structure

```
Prep-AI/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── interview/     # Interview management
│   │   │   ├── resume/        # Resume operations
│   │   │   ├── goals/         # Goals management
│   │   │   └── analytics/     # Analytics endpoints
│   │   ├── home/              # Dashboard pages
│   │   ├── interview/         # Interview pages
│   │   └── login/             # Auth pages
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── interview/         # Interview components
│   │   ├── navigation/        # Navigation components
│   │   └── ui/                # UI components
│   ├── context/               # React Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   └── utils/                 # Helper functions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/
│   └── docs/                  # Documentation assets
└── package.json
```

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT Authentication
JWT_SECRET="your-jwt-secret-key-minimum-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini AI API
GEMINI_API_KEY="your-google-gemini-api-key"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Application Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### How to Get API Keys

- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Google OAuth**: Set up at [Google Cloud Console](https://console.cloud.google.com/)
- **Database**: Set up PostgreSQL locally or use [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Railway](https://railway.app/)

## 🎯 Core Functionality

### Interview Flow

1. **Upload Resume** (Optional) - AI parses and analyzes resume content
2. **Enter Job Details** - Specify job role, description, and experience level
3. **AI Question Generation** - System generates 10 context-aware questions
4. **Conduct Interview** - Answer questions with speech-to-text or manual input
5. **Real-time Monitoring** - Face detection and proctoring during interview
6. **Get Results** - Receive detailed scores and feedback for improvement

### Database Schema

- **User** - Authentication and profile data
- **Resume** - Resume files and parsed data
- **ResumeAnalysis** - AI-generated resume feedback
- **JD (Job Description)** - Job details for interviews
- **InterviewSession** - Interview metadata and status
- **Question** - Generated interview questions
- **Answer** - Candidate responses with AI evaluation
- **Goal** - User-defined preparation goals

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.4.5 (App Router)
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI, Headless UI
- **Animations**: Framer Motion
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma 6.16.2
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **File Upload**: Multer
- **Validation**: Express Validator

### AI/ML
- **AI Model**: Google Gemini 2.0 Flash
- **Face Detection**: MediaPipe Face Mesh
- **Speech-to-Text**: React Hook Speech-to-Text

## 📊 Performance

- **Page Load**: < 2 seconds
- **API Response**: < 500ms average
- **AI Generation**: 4-6 seconds
- **Database Queries**: < 50ms average
- **Face Detection**: 92% accuracy
- **Speech Recognition**: 90% accuracy (clear environment)

## 🔒 Security

- JWT-based authentication with bcrypt password hashing
- Protected API routes with Bearer token validation
- User data isolation through userId relationships
- SQL injection prevention via Prisma ORM
- Secure file upload validation
- HTTPS enforcement in production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Sahil Khude** - [@sahilkhude117](https://github.com/sahilkhude117)

## 🙏 Acknowledgments

- Google Gemini AI for intelligent question generation and evaluation
- MediaPipe for real-time face detection capabilities
- Next.js team for the amazing framework
- Prisma for the excellent database toolkit

---

Made with ❤️ by the Prep-AI Team

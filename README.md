# Prep-AI

Prep-AI is an AI-powered interview preparation web application that helps users practice and analyze interviews tailored to their profile.

Users can upload their resume, specify the job role, job description, and years of experience. Based on these inputs, Prep-AI generates a **personalized interview session** to closely match real-world interview scenarios.

**Live Demo:** https://prep-ai-seven-rho.vercel.app/

---

## Features

- Resume upload for personalized question generation
- Role-based and experience-based interview sessions
- AI-generated interview questions
- Session-wise analytics with a score (scale of 10)
- Overall performance analytics
- Role-wise analytics for deeper insights
- Detailed feedback to improve interview readiness

---

## Tech Stack

- Frontend,Backend: NextJS
- AI Integration: Gemini
- Database: Postgresql
- Deployment: Vercel

---

## ⚙️ How to Run the Project Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/patiladitya77/Prep-AI.git
   ```
2. **Navigate to the project directory**
   ```bash
   cd Prep-AI
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up environment variables**

   ```bash

   # Example
   DATABASE_URL
   JWT_SECRET
   JWT_EXPIRES_IN
   CORS_ORIGIN
   GEMINI_API_KEY
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET


   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
6. **Open in browser**

   ```bash
   http://localhost:3000
   V
   ```

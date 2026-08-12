# 🏆 QuizMaster Enterprise — Full-Stack AI Assessment & Proctoring Platform

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_Tailwind-61DAFB?logo=react)
![NodeJS](https://img.shields.io/badge/Backend-Node.js_%7C_Express-339933?logo=nodedotjs)
![Database](https://img.shields.io/badge/Database-SQLite3_%7C_Persistent_JSON-003B57?logo=sqlite)
![AI](https://img.shields.io/badge/AI-Google_Gemini_1.5_/_2.0_Flash-4285F4?logo=google)
![Deploy](https://img.shields.io/badge/Deployment-Vercel_%2B_Render-000000?logo=vercel)

> **QuizMaster Enterprise** is a state-of-the-art, AI-powered online assessment, examination, and certification platform built with React 18, Node.js, Express, SQLite, and Google Gemini AI. It features real-time webcam proctoring, anti-cheating browser locks, interactive coding environments, AI question generation, and instant 4K verifiable certificates.

---

## 🌐 Live Demos

- 🎓 **Live Web Application (Vercel)**: [https://quizmaster-platform-iota.vercel.app](https://quizmaster-platform-iota.vercel.app)
- ⚙️ **Live Backend API (Render)**: [https://quizmaster-platform.onrender.com/api/health](https://quizmaster-platform.onrender.com/api/health)
- 🐙 **GitHub Repository**: [https://github.com/Svarshan1445/quizmaster-platform](https://github.com/Svarshan1445/quizmaster-platform)

---

## ✨ Key Features & Highlights

### 🪄 1. Google Gemini AI Question Generator
- **Multi-Type Question Generation**: Automatically generates **MCQ**, **True/False**, **Fill in the Blanks**, and **Programming/Coding** exercises.
- **Custom Count Selector**: Generate any custom number of questions (from 1 up to 50 at a time) with 1-click presets (`5`, `10`, `15`, `25`, `50`).
- **Interactive Review & Approval**: Preview, edit options, or remove AI-generated questions before committing to the database.

### 💻 2. Interactive Programming & Coding Suite
- Integrated **Monospace Code Editor (`solution.code`)** with syntax styling.
- Real-time automated evaluation for programming exercises across **Python, Java, JavaScript, C++, SQL**, and algorithms.
- Complete code breakdown in post-exam student review with expected solution comparison.

### 🔒 3. Advanced Anti-Cheating & AI Proctoring
- **Tab Switch Detection**: 3-strike warning overlay with automatic exam submission on the 3rd strike.
- **Browser Event Lock**: Blocks `copy`, `cut`, `paste`, `contextmenu` (right click), and text selection during active exams.
- **Live WebCam PIP Proctoring**: Floating Picture-in-Picture live video feed with camera access permissions and resource cleanup.
- **Dynamic Speed Limit Gauge**: Automatically splits total quiz duration across question count ($\text{Limit} = \frac{\text{Duration} \times 60}{\text{Questions}}$) with speed countdown progress bar.

### 📜 4. 4K Certificate Generator & Instant Verification
- **Dynamic HTML5 Canvas Renderer**: Generates official 4K high-resolution PDF certificates upon scoring $\ge 50\%$.
- **QR Code Verification**: QR code on exported certificate links directly to instant online verification.
- **1-Click Copy Certificate ID**: `CopyCertBadge` component with instant clipboard copy & toast feedback (`✓ Copied!`).
- **Official Benchmark Grading**:
  - `50% - 74%`: `✓ PASSED`
  - `75% - 84%`: `✓ FIRST CLASS`
  - `85% - 100%`: `✓ DISTINCTION PASS`

### 🎨 5. Role-Based Theme Control & UI Design
- **Role Selection Landing Page**: Elegant dual portal choice for Admin and Student entry.
- **Enforced Theme Rules**: Enforces default enterprise `indigo` theme for Admins while allowing custom accent theme selection for Students.
- **Times New Roman Typography**: Clean, academic font hierarchy across app UI and certificates.

### 🛡️ 6. Automatic Data State Backup & Persistence
- Continuous JSON state backup & auto-restore engine (`data_store.json`) ensuring categories, quizzes, questions, options, and attempts **NEVER get deleted across server restarts or redeploys**.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|-------|-------------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Canvas-Confetti, HTML2Canvas |
| **Backend** | Node.js, Express.js, Better-SQLite3, JSON Web Tokens (JWT), BcryptJS |
| **AI Integration** | `@google/generative-ai` (Google Gemini 1.5 & 2.0 Flash) |
| **Database** | SQLite3 with automatic migrations & persistent JSON state backup |
| **Deployment** | Vercel (Frontend SPA), Render (Node.js Web Service) |

---

## 🔑 Default Credentials

### 🛡️ Admin Portal
- **Email**: `admin@quiz.com` (or `admin@quizmaster.com`)
- **Password**: `admin123`

### 🎓 Student Portal
- **Email**: `rahul@student.com`
- **Password**: `Student@123`
- *(Or click **Register** to create a new Student account)*

---

## 📁 Repository Directory Structure

```
Quizmaster-Platform/
├── backend/
│   ├── config/
│   │   └── database.js      # SQLite schema, migrations & auto-backup engine
│   ├── controllers/
│   │   ├── aiController.js  # Google Gemini AI question generation logic
│   │   ├── attemptController.js # Exam grading, anti-cheating & score calculations
│   │   ├── authController.js    # JWT authentication & password hashing
│   │   ├── categoryController.js # Category management
│   │   ├── questionController.js # Question bank CRUD
│   │   └── quizController.js     # Quiz CRUD & publish toggles
│   ├── middleware/
│   │   └── auth.js          # JWT verification & role guards (ADMIN/STUDENT)
│   ├── routes/              # Express API route declarations
│   ├── data_store.json      # Persistent auto-backup JSON state
│   ├── server.js            # Express app server entry point
│   └── package.json
│
├── frontend/
│   ├── public/              # Icons and favicons
│   ├── src/
│   │   ├── components/      # Navbar, CertificateModal, CopyCertBadge
│   │   ├── context/         # AuthContext with JWT & role management
│   │   ├── pages/
│   │   │   ├── admin/       # Admin Dashboard, Quiz, Question, User Management
│   │   │   ├── CertificateVerifier.jsx # QR code instant certificate verifier
│   │   │   ├── Leaderboard.jsx         # Global rankings
│   │   │   ├── Login.jsx / Register.jsx # Authentication screens
│   │   │   ├── QuizDiscovery.jsx        # Quiz catalogue & search
│   │   │   ├── QuizResult.jsx           # Score report & answer key review
│   │   │   ├── QuizRunner.jsx           # Active exam interface with anti-cheat
│   │   │   ├── RoleSelect.jsx           # Portal choice landing page
│   │   │   └── StudentDashboard.jsx     # Student overview
│   │   ├── services/
│   │   │   └── api.js       # Axios client with JWT interceptors
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json          # Vercel deployment configuration
│   └── package.json
│
└── README.md
```

---

## 💻 Local Installation & Setup Guide

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Svarshan1445/quizmaster-platform.git
cd quizmaster-platform
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
node server.js
```
*The backend API server will start on `http://localhost:3001`.*

### 3️⃣ Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The Vite frontend application will start on `http://localhost:3000`.*

---

## 📡 Key API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new student account | ❌ No |
| `POST` | `/api/auth/login` | Login user & receive JWT token | ❌ No |
| `GET`  | `/api/quizzes` | Fetch all published quizzes | 🔒 Yes |
| `POST` | `/api/quizzes` | Create a new quiz | 🛡️ Admin |
| `GET`  | `/api/quizzes/:id/questions` | Fetch question bank for a quiz | 🔒 Yes |
| `POST` | `/api/quizzes/:id/start` | Start an active exam attempt session | 🎓 Student |
| `POST` | `/api/quizzes/:id/submit` | Submit exam answers & grade result | 🎓 Student |
| `POST` | `/api/ai/generate-questions` | Generate questions using Gemini AI | 🛡️ Admin |
| `GET`  | `/api/leaderboard` | Get global student rankings | 🔒 Yes |

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p center>
Developed with ❤️ by <a href="https://github.com/Svarshan1445">Svarshan</a> — QuizMaster Enterprise 2026
</p>

# 🎓 EduNotify — Intelligent Parent Communication & Attendance Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v4.19-000000?style=flat&logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18+-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-v3-003B57?style=flat&logo=sqlite)](https://sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-4169E1?style=flat&logo=postgresql)](https://postgresql.org/)

---

## 📋 Overview

**EduNotify** is an enterprise-grade, multi-tenant **School Management Module** designed to **automatically notify parents** whenever a student is marked absent. The system supports **Voice Calls, SMS, WhatsApp, and Email** through a provider-agnostic architecture with mock providers for development and seamless integration with Twilio, Exotel, or WhatsApp Business API in production.

### Key Capabilities

- 🔐 **JWT Authentication & RBAC** — Role-based access for Super Admin, Principal, Coordinator, Teacher
- 👨‍🎓 **Student Information Management** — Complete CRUD with multi-tenant school isolation
- 📋 **Attendance Board** — Mark, edit, and finalize attendance by class/section/date
- 📱 **Multi-Channel Notifications** — SMS, WhatsApp, Email, Voice Call with template variable substitution
- 🔄 **Notification Queue Engine** — Background processing with exponential backoff retries
- ⏰ **12:00 PM Cron Scheduler** — Automatic daily finalization and notification dispatch
- 🤝 **Parent Acknowledgement Portal** — Public web form for parents to confirm absence
- 📢 **Emergency Broadcast System** — School-wide alerts to all parents instantly
- 📊 **Analytics Dashboard** — Attendance trends, channel dispatch rates, class rankings
- 📝 **Immutable Audit Trail** — Every mutation is logged for security compliance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                      │
│            React 18 + Vite (Glassmorphic UI)             │
├─────────────────────────────────────────────────────────┤
│                  APPLICATION LAYER                       │
│         Express.js REST API + JWT Middleware              │
├─────────────────────────────────────────────────────────┤
│                 BUSINESS LOGIC LAYER                     │
│   Services: Attendance, Student, Template, Broadcast     │
├─────────────────────────────────────────────────────────┤
│                 NOTIFICATION ENGINE                      │
│    Queue Processor + Retry + Provider Factory Pattern    │
├─────────────────────────────────────────────────────────┤
│                   PROVIDER LAYER                         │
│  Mock Providers (Call, SMS, WhatsApp, Email) → Twilio    │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                            │
│     PostgreSQL (Production) / SQLite (Development)       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "AI calling"

# Install backend dependencies
cd backend
npm install

# Seed demo data
npm run seed

# Start the backend server
npm start

# In a separate terminal, install and start frontend
cd ../frontend
npm install
npm run dev
```

### Access Points

| Service        | URL                          |
|----------------|------------------------------|
| Backend API    | http://localhost:5000/api     |
| Frontend UI    | http://localhost:5173         |
| API Health     | http://localhost:5000/        |

---

## 🔑 Demo Credentials

| Role         | Username    | Password       |
|--------------|-------------|----------------|
| Super Admin  | `admin`     | `admin123`     |
| Teacher      | `teacher`   | `teacher123`   |
| Principal    | `principal` | `principal123` |
| Teacher (S2) | `teacher2`  | `teacher123`   |

---

## 📁 Project Structure

```
AI calling/
├── backend/
│   ├── database/
│   │   ├── schema.sql          # PostgreSQL schema (12 tables)
│   │   └── edunotify.db        # SQLite database file
│   ├── src/
│   │   ├── app.js              # Express entry point + bootstrap
│   │   ├── config/db.js        # Polyglot SQL adapter (PG/SQLite)
│   │   ├── controllers/        # 8 route handlers
│   │   ├── services/           # 8 business logic modules
│   │   ├── repositories/       # 9 data access layers
│   │   ├── middleware/auth.js   # JWT + RBAC guards
│   │   ├── providers/          # Communication contracts + mocks
│   │   ├── scheduler/          # 12:00 PM cron job
│   │   ├── routes/api.js       # Central route registry
│   │   └── database/seed.js    # Demo data generator
│   ├── .env                    # Environment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component + routing
│   │   ├── main.jsx            # React DOM mount
│   │   ├── index.css           # Glassmorphic design system
│   │   ├── components/
│   │   │   └── Layout.jsx      # Sidebar + header shell
│   │   ├── pages/              # 11 page components
│   │   └── utils/api.js        # HTTP client with auth
│   ├── index.html              # SEO-optimized HTML
│   ├── vite.config.js          # Vite configuration
│   └── package.json
└── docs/                       # Documentation suite
```

---

## 🛡️ Technology Stack

| Layer              | Technology                                    |
|--------------------|-----------------------------------------------|
| Frontend           | React 18, Vite, Lucide Icons, Vanilla CSS     |
| Backend            | Node.js, Express.js 4.19                      |
| Authentication     | JWT (jsonwebtoken), bcryptjs                  |
| Database           | PostgreSQL 15+ / SQLite 3 (dual-mode)         |
| Scheduling         | node-cron (12:00 PM daily)                    |
| Communication      | Provider-Agnostic (Mock → Twilio/Exotel)      |
| Architecture       | Repository-Service-Controller (RSC) Pattern   |
| Multi-Tenancy      | School-scoped data isolation via school_id     |

---

## 🔮 Future Scope

- **AI Voice Calling Agent** — Natural language parent interaction
- **AI Attendance Pattern Analysis** — Predictive absentee monitoring
- **Student Risk Detection** — ML-based chronic absence alerts
- **Parent Sentiment Analysis** — NLP on acknowledgement remarks
- **Multi-School SaaS** — Tenant-isolated cloud deployment
- **Mobile App** — React Native parent companion
- **Real-time Dashboard** — WebSocket live updates

---

## 📄 License

This project is developed as an academic/enterprise demonstration module.

---

*Built with ❤️ by the EduNotify Development Team*

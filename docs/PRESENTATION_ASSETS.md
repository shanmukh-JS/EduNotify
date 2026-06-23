# EduNotify — Presentation Assets

---

## Slide 1: Project Overview

### 🎓 EduNotify
**Intelligent Parent Communication & Attendance Management System**

An enterprise-grade, multi-tenant school management module that automatically notifies parents via SMS, WhatsApp, Email, and Voice Calls when students are marked absent.

**Key Highlights:**
- Provider-agnostic notification engine (Mock → Twilio/Exotel)
- Real-time analytics dashboard with SVG charts
- Public parent acknowledgement portal
- Emergency broadcast system
- Immutable audit trail for compliance

---

## Slide 2: Problem Statement

### The Challenge

Schools face critical communication gaps:

| Problem                          | Impact                                   |
|----------------------------------|------------------------------------------|
| Manual parent calling            | Teachers spend 30+ min/day on phone      |
| No acknowledgement tracking      | No proof parents received the message    |
| Single-channel communication     | Parents miss important notifications     |
| No audit trail                   | Compliance risk for attendance records   |
| No analytics                     | Administrators can't identify patterns   |
| Emergency alerts take hours      | Manual calling during school closures    |

### The Need

> An automated, multi-channel notification system that instantly alerts parents when students are absent, tracks acknowledgements, and provides analytics — all while maintaining a complete audit trail.

---

## Slide 3: Objectives

### Primary Objectives

1. ✅ **Automate parent notifications** when students are marked absent
2. ✅ **Support multiple communication channels** (SMS, WhatsApp, Email, Voice)
3. ✅ **Track parent acknowledgements** with response time metrics
4. ✅ **Enable emergency broadcasts** to all parents simultaneously
5. ✅ **Provide analytics dashboard** with attendance trends and dispatch rates

### Secondary Objectives

6. ✅ **Multi-tenant architecture** — Support multiple schools in one deployment
7. ✅ **Role-based access control** — 5 distinct user roles
8. ✅ **Configurable templates** — {{variable}} substitution engine
9. ✅ **Queue-based processing** — Exponential backoff retry mechanism
10. ✅ **Provider-agnostic design** — Swap Twilio/Exotel without code changes

---

## Slide 4: System Architecture

```
┌───────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                    │
│   React 18 + Vite + Glassmorphic CSS + SVG Charts     │
│   11 Pages • Error Boundaries • Role-Filtered Sidebar  │
├───────────────────────────────────────────────────────┤
│                  APPLICATION LAYER                     │
│   Express.js 4.19 • CORS • JWT Auth • RBAC Guards     │
│   28 REST Endpoints across 10 Route Groups             │
├───────────────────────────────────────────────────────┤
│                BUSINESS LOGIC LAYER                    │
│   8 Service Modules • Template Variable Engine        │
│   Audit Logging • Cross-Repository Coordination       │
├───────────────────────────────────────────────────────┤
│                 NOTIFICATION ENGINE                    │
│   Queue Processor (5s polling) • Exponential Backoff  │
│   Provider Factory Pattern • Daily 12 PM Cron Job     │
├───────────────────────────────────────────────────────┤
│                   PROVIDER LAYER                       │
│   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐  │
│   │MockCall │ │MockSMS  │ │MockWA    │ │MockEmail│  │
│   └─────────┘ └─────────┘ └──────────┘ └─────────┘  │
│   Future: Twilio • Exotel • WhatsApp Business • SES   │
├───────────────────────────────────────────────────────┤
│                    DATA LAYER                          │
│   PostgreSQL 15 (Production) / SQLite 3 (Development) │
│   12 Tables • 15 Indexes • Polyglot SQL Adapter       │
└───────────────────────────────────────────────────────┘
```

---

## Slide 5: Database Design

### 12 Tables in Multi-Tenant Schema

| Table                    | Purpose                           | Key Relationships          |
|-------------------------|-----------------------------------|-----------------------------|
| `schools`               | Tenant root entity                | 1:N with all tables         |
| `users`                 | Authentication & RBAC             | Belongs to school           |
| `students`              | Student records                   | Belongs to school           |
| `attendance`            | Daily attendance marks            | Student × Date (unique)     |
| `notifications`         | Communication instances           | Links student + attendance  |
| `notification_queue`    | Execution state tracking          | 1:1 with notification       |
| `parent_acknowledgements`| Parent response tracking         | 1:1 with notification       |
| `communication_logs`    | Provider telemetry                | N:1 with notification       |
| `communication_templates`| Message templates with vars     | Scoped to school + channel  |
| `emergency_broadcasts`  | School-wide announcements         | Created by admin/principal  |
| `notification_settings` | Per-school configuration          | 1:1 with school             |
| `audit_logs`            | Immutable security trail          | Logs every data mutation    |

---

## Slide 6: Module Overview

### Core Modules

```
┌─────────────────────────────────────────────────┐
│  1. AUTHENTICATION & AUTHORIZATION               │
│     JWT Sign-in • bcrypt • 5 Role Levels         │
├─────────────────────────────────────────────────┤
│  2. STUDENT INFORMATION MANAGEMENT               │
│     Full CRUD • Search • Class/Section Filters   │
├─────────────────────────────────────────────────┤
│  3. ATTENDANCE MANAGEMENT                        │
│     Mark • Edit • Finalize • History Tracking    │
├─────────────────────────────────────────────────┤
│  4. NOTIFICATION ENGINE                          │
│     Template Resolution • Queue • Retry • Dispatch│
├─────────────────────────────────────────────────┤
│  5. PARENT ACKNOWLEDGEMENT PORTAL                │
│     Public URL • Response Tracking • Metrics     │
├─────────────────────────────────────────────────┤
│  6. EMERGENCY BROADCAST SYSTEM                   │
│     School-Wide Alerts • Multi-Channel Dispatch  │
├─────────────────────────────────────────────────┤
│  7. ANALYTICS DASHBOARD                          │
│     SVG Charts • Trends • Class Rankings         │
├─────────────────────────────────────────────────┤
│  8. AUDIT TRAIL & COMPLIANCE                     │
│     Immutable Logs • Before/After Snapshots      │
└─────────────────────────────────────────────────┘
```

---

## Slide 7: Technology Stack

| Component          | Technology                          | Why Chosen                        |
|-------------------|-------------------------------------|-----------------------------------|
| Frontend          | React 18 + Vite                     | Fast HMR, component architecture  |
| Styling           | Vanilla CSS (Glassmorphic)          | Zero dependencies, full control   |
| Icons             | Lucide React                        | Lightweight, consistent iconset   |
| Charts            | Custom SVG                          | No chart library overhead         |
| Backend           | Express.js 4.19                     | Mature, minimal, well-documented  |
| Authentication    | JWT + bcryptjs                      | Stateless, scalable auth          |
| Database          | PostgreSQL / SQLite                 | Production-ready + dev-friendly   |
| Scheduling        | node-cron                           | Lightweight cron for Node.js      |
| IDs               | uuid v4                             | Universally unique identifiers    |
| Architecture      | RSC Pattern                         | Clean separation of concerns      |

---

## Slide 8: Workflow Diagrams

### Attendance → Notification Flow

```
Teacher Opens Attendance Board
            ↓
Selects Date, Class, Section → Loads Student Roster
            ↓
Marks Each Student: PRESENT / ABSENT / LATE / EXCUSED
            ↓
Clicks "Save Attendance" → Records Persisted
            ↓
Clicks "Finalize Attendance"
            ↓
    ┌───────────────────────────────┐
    │ For each ABSENT student:      │
    │   For each active channel:    │
    │     1. Resolve template       │
    │     2. Substitute {{vars}}    │
    │     3. Create notification    │
    │     4. Enqueue for dispatch   │
    └───────────────────────────────┘
            ↓
Queue Processor (Background, every 5s)
            ↓
    Provider Factory → Mock/Real Provider
            ↓
    Success → Mark DELIVERED → Remove from queue
    Failure → Retry with exponential backoff
              (2min, 4min, 6min → FAILED)
            ↓
Parent Receives SMS/WhatsApp/Email/Call
            ↓
Parent Clicks Acknowledgement Link
            ↓
Public Web Form → Submit Response
            ↓
Dashboard Updates with Acknowledgement Status
```

### Emergency Broadcast Flow

```
Principal Opens Broadcast Center
            ↓
Enters Subject, Message Body, Selects Channels
            ↓
Clicks "Send Broadcast"
            ↓
System Fetches ALL Active Students
            ↓
    For each student × each channel:
        Create notification → Enqueue
            ↓
Queue processes all notifications
            ↓
All parents receive alert simultaneously
```

---

## Slide 9: Results & Achievements

### Quantitative Results

| Metric                          | Value                                |
|---------------------------------|--------------------------------------|
| Total API Endpoints             | 28                                   |
| Total Database Tables           | 12                                   |
| Total Database Indexes          | 15                                   |
| Total Frontend Pages            | 11                                   |
| Total Backend Source Files       | 19                                   |
| Communication Channels          | 4 (SMS, WhatsApp, Email, Voice Call) |
| User Roles Supported            | 5                                    |
| Template Variables              | 6                                    |
| Mock Provider Success Rate      | 80-97% (configurable)               |
| Queue Polling Interval          | 5 seconds                           |
| Retry Mechanism                 | Exponential backoff (3 attempts)     |
| JWT Token Expiry                | 8 hours                             |
| Daily Scheduler Time            | 12:00 PM                            |

### Qualitative Achievements
- ✅ Multi-tenant architecture (SaaS-ready)
- ✅ Provider-agnostic communication engine
- ✅ Zero external chart/UI library dependencies
- ✅ Complete audit trail for regulatory compliance
- ✅ Public parent portal (no login required)
- ✅ Dual-database support (PostgreSQL + SQLite)

---

## Slide 10: Future Scope

### Phase 2: AI Integration

| Feature                           | Technology               | Impact                    |
|-----------------------------------|--------------------------|---------------------------|
| AI Voice Calling Agent            | Google Dialogflow / GPT  | Natural language parent calls|
| Attendance Pattern Analysis       | TensorFlow.js            | Predict chronic absenteeism|
| Student Risk Detection            | ML Classification        | Early intervention alerts  |
| Parent Sentiment Analysis         | NLP on remarks           | Detect urgency in responses|
| Smart Notification Routing        | ML Optimization          | Best channel per parent    |

### Phase 3: Platform Expansion

| Feature                           | Description                          |
|-----------------------------------|--------------------------------------|
| Mobile App (React Native)         | Parent companion app with push notif |
| Real-time Dashboard (WebSockets)  | Live attendance and notification feed|
| Multi-School SaaS Platform        | Cloud-hosted with tenant isolation   |
| WhatsApp Business API Integration | Official Meta API integration        |
| Twilio/Exotel Integration         | Production voice calling             |
| Fee Reminder Module               | Extend notification templates        |
| Transport Tracking                | Bus GPS + parent alerts              |
| Report Card Generation            | Academic performance notifications   |

### Phase 4: Analytics & Intelligence

| Feature                           | Description                          |
|-----------------------------------|--------------------------------------|
| Predictive Absentee Monitoring    | Forecast tomorrow's likely absentees |
| Attendance Heatmaps               | Visual class-level patterns          |
| Parent Engagement Scoring         | Rank parent responsiveness           |
| Monthly PDF Reports               | Auto-generated principal reports     |
| Notification Cost Analytics       | Per-channel cost tracking            |

# EduNotify — System Architecture Documentation

## 1. Architectural Overview

EduNotify follows a **6-Layer Architecture** designed for scalability, maintainability, and future cloud deployment.

```
┌────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                     │
│        React 18 SPA (Vite Build System)             │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────┐   │
│  │ Login    │ │ Dashboard │ │ Attendance Board │   │
│  │ Students │ │ Templates │ │ Broadcast Center │   │
│  │ Settings │ │ Call Logs │ │ Audit Trails     │   │
│  └──────────┘ └───────────┘ └──────────────────┘   │
├────────────────────────────────────────────────────┤
│              APPLICATION LAYER                      │
│      Express.js REST API (Port 5000)                │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │ JWT Auth       │  │ RBAC Middleware             │  │
│  │ Route Registry │  │ Global Error Handler       │  │
│  └───────────────┘  └────────────────────────────┘  │
├────────────────────────────────────────────────────┤
│           BUSINESS LOGIC LAYER                      │
│  ┌───────────────────┐ ┌─────────────────────────┐  │
│  │ AttendanceService │ │ StudentService          │  │
│  │ BroadcastService  │ │ TemplateService         │  │
│  │ SettingsService   │ │ AcknowledgementService  │  │
│  │ AuditService      │ │ QueueProcessor          │  │
│  └───────────────────┘ └─────────────────────────┘  │
├────────────────────────────────────────────────────┤
│            NOTIFICATION ENGINE                      │
│  ┌──────────────┐ ┌─────────┐ ┌─────────────────┐  │
│  │ Queue Worker  │ │ Retries │ │ Provider Factory│  │
│  │ (5s polling)  │ │ (Exp    │ │ (Strategy       │  │
│  │              │ │ Backoff)│ │  Pattern)        │  │
│  └──────────────┘ └─────────┘ └─────────────────┘  │
├────────────────────────────────────────────────────┤
│              PROVIDER LAYER                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ MockCall   │ │ MockSMS    │ │ MockWhatsApp   │  │
│  │ Provider   │ │ Provider   │ │ Provider       │  │
│  │            │ │            │ │ MockEmail      │  │
│  └────────────┘ └────────────┘ └────────────────┘  │
│  Future: TwilioCallProvider, ExotelSMSProvider,     │
│  WhatsAppBusinessProvider, SendGridEmailProvider    │
├────────────────────────────────────────────────────┤
│               DATA LAYER                            │
│  ┌──────────────────────────────────────────────┐   │
│  │ PostgreSQL (Production) / SQLite (Dev/Demo)  │   │
│  │ Polyglot SQL Adapter (db.js)                 │   │
│  │ 12 Tables, 15 Indexes, FK Constraints        │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

## 2. Design Patterns

### 2.1 Repository-Service-Controller (RSC)

Every data operation follows a strict 3-layer flow:

```
HTTP Request → Controller → Service → Repository → Database
                  ↓              ↓           ↓
            Validation    Business Logic   SQL Queries
```

- **Controllers** handle HTTP I/O, request validation, response formatting
- **Services** contain business logic, audit logging, cross-repository coordination
- **Repositories** are pure data access layers with parameterized queries

### 2.2 Provider Factory Pattern

Communication providers implement abstract contracts:

```
CallProvider (abstract)     → MockCallProvider
SMSProvider (abstract)      → MockSMSProvider
WhatsAppProvider (abstract) → MockWhatsAppProvider
EmailProvider (abstract)    → MockEmailProvider
```

The `providerFactory.js` returns singleton provider instances. To integrate Twilio:
1. Create `TwilioCallProvider extends CallProvider`
2. Implement the `placeCall()` method
3. Update `providerFactory.js` to return the new provider

### 2.3 Multi-Tenant Architecture

All database tables include a `school_id` foreign key. Every query is scoped by the authenticated user's school context extracted from the JWT token.

```
JWT Token → { school_id, role, id } → All queries WHERE school_id = $1
```

### 2.4 Queue-Based Async Processing

Notifications follow a 2-table pattern:
- `notifications` — Stores the notification intent and content
- `notification_queue` — Manages execution state, retries, and scheduling

```
Finalize Attendance → Create Notification → Enqueue → Queue Worker Picks Up
                                                         ↓
                                              Provider.send() → Success/Retry/Fail
```

---

## 3. Authentication & Authorization

### JWT Flow
1. User submits credentials → `POST /api/auth/login`
2. Server validates password hash (bcrypt) → Returns signed JWT (8h expiry)
3. All subsequent requests include `Authorization: Bearer <token>`
4. `authenticate` middleware decodes token and attaches `req.user`
5. `requireRoles` middleware checks `req.user.role` against allowed roles

### RBAC Matrix

| Resource           | SUPER_ADMIN | PRINCIPAL | COORDINATOR | TEACHER |
|--------------------|:-----------:|:---------:|:-----------:|:-------:|
| Dashboard          | ✅          | ✅        | ✅          | ✅      |
| Student CRUD       | ✅          | ✅        | ✅          | ❌      |
| Attendance Mark    | ✅          | ✅        | ✅          | ✅      |
| Attendance Finalize| ✅          | ✅        | ✅          | ✅      |
| Templates CRUD     | ✅          | ✅        | ✅          | ❌      |
| Emergency Broadcast| ✅          | ✅        | ❌          | ❌      |
| Audit Logs         | ✅          | ✅        | ❌          | ❌      |
| System Settings    | ✅          | ✅        | ❌          | ❌      |
| Scheduler Trigger  | ✅          | ✅        | ❌          | ❌      |

---

## 4. Notification Engine Workflow

```
Teacher marks attendance → Finalizes class/section for date
                              ↓
    AttendanceService.finalizeAttendance()
                              ↓
    Finds all ABSENT students for that class
                              ↓
    For each absent student × each active channel:
      1. Resolve communication template
      2. Substitute variables ({{student_name}}, {{date}}, {{ack_link}})
      3. Create notification record (with pre-generated UUID)
      4. Enqueue in notification_queue
                              ↓
    QueueProcessor (background, every 5 seconds):
      1. Fetch PENDING queue items (respecting next_retry_at)
      2. Mark as PROCESSING
      3. Dispatch via ProviderFactory → MockProvider
      4. On Success: Mark DELIVERED, remove from queue
      5. On Failure: Check retry count vs max_retries
         - Under limit: Re-enqueue with exponential backoff
         - Over limit: Mark as FAILED permanently
```

### Retry Strategy

| Retry # | Backoff Delay | Total Wait |
|---------|--------------|------------|
| 1       | 2 minutes    | 2 min      |
| 2       | 4 minutes    | 6 min      |
| 3       | 6 minutes    | 12 min     |
| (fail)  | Permanent    | —          |

---

## 5. Database Adapter (Polyglot SQL)

The `db.js` module supports both PostgreSQL and SQLite through:

1. **Query translation**: `$1, $2` → `?1, ?2` (PG → SQLite placeholders)
2. **Schema translation**: Strips `UUID`, `TIMESTAMP WITH TIME ZONE`, `VARCHAR[]`, `JSONB` types for SQLite
3. **Method routing**: SELECT queries → `db.all()`, mutations → `db.run()` (SQLite API)
4. **RETURNING emulation**: SQLite queries with `RETURNING` are routed to `db.all()`

Toggle via `.env`:
```
DB_DIALECT=sqlite    # Development (default)
DB_DIALECT=postgres  # Production
```

---

## 6. Frontend Architecture

### Component Hierarchy

```
App.jsx
├── ErrorBoundary (class component)
├── [/acknowledge/:id] → Acknowledge.jsx (public, no auth)
├── [no auth] → Login.jsx
└── [authenticated] → Layout.jsx
    ├── Sidebar (role-filtered menu)
    ├── Header (user info + logout)
    └── Page Content (state-based routing)
        ├── Dashboard.jsx (SVG charts, analytics)
        ├── Students.jsx (CRUD table + modal)
        ├── Attendance.jsx (roster grid + finalize)
        ├── Absentees.jsx (today's absent list)
        ├── CallLogs.jsx (provider telemetry)
        ├── Broadcast.jsx (emergency dispatch)
        ├── Templates.jsx (CRUD + preview)
        ├── AuditLogs.jsx (security trail)
        └── Settings.jsx (school config)
```

### State Management
- **No external state library** — React `useState` + `useEffect` hooks
- **Token persistence** — `localStorage` for JWT and user object
- **Page routing** — State-based (`currentPage`) instead of react-router

### Design System
- Custom CSS variables in `index.css`
- Glassmorphic panels with `backdrop-filter: blur()`
- SVG-based charts (no chart library dependency)
- Lucide React icons throughout

---

## 7. API Request Flow

```
Browser → fetch(API_URL, { Authorization: Bearer <jwt> })
           ↓
Express CORS → JSON Parser → Route Matcher
           ↓
authenticate() middleware → JWT verify → req.user
           ↓
requireRoles() middleware → Check role in allowed list
           ↓
Controller → Input validation → Service call
           ↓
Service → Business logic → Repository call(s)
           ↓
Repository → Parameterized SQL → db.js → PG Pool / SQLite
           ↓
Response ← JSON ← Controller ← Service ← Repository
```

---

## 8. Security Measures

| Category          | Implementation                                      |
|-------------------|-----------------------------------------------------|
| Authentication    | JWT with 8-hour expiry, bcrypt password hashing      |
| Authorization     | Role-based middleware guards on every protected route |
| Input Validation  | Server-side validation in controllers and services   |
| SQL Injection     | Parameterized queries ($1, $2) everywhere            |
| CORS              | Enabled for frontend origin                          |
| Audit Trail       | Immutable log of every data mutation with timestamps |
| Error Handling    | Global error handler, no stack traces in production  |
| Multi-Tenancy     | school_id scoping prevents cross-tenant data access  |

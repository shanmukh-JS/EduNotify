# EduNotify — Database Schema Documentation

## Overview

The EduNotify database consists of **12 tables** with **15 indexes** and **full foreign key constraints**. The schema is written in PostgreSQL syntax and automatically translated to SQLite for local development.

---

## Entity Relationship Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  SCHOOLS │────<│  USERS   │     │  STUDENTS    │
│          │────<│          │     │              │
│  id (PK) │     │ id (PK)  │     │  id (PK)     │
│  name    │     │ school_id│────<│  school_id   │
│  code    │     │ username │     │  admission_# │
│  address │     │ password │     │  first_name  │
└──────────┘     │ role     │     │  parent_name │
                 └──────────┘     │  parent_phone│
                                  └──────────────┘
                                        │
                 ┌──────────────────────┤
                 ↓                      ↓
          ┌──────────────┐     ┌────────────────────┐
          │  ATTENDANCE  │────>│  NOTIFICATIONS     │
          │              │     │                    │
          │  id (PK)     │     │  id (PK)           │
          │  student_id  │     │  student_id        │
          │  date        │     │  attendance_id     │
          │  status      │     │  channel           │
          │  finalized   │     │  status            │
          └──────────────┘     │  message_body      │
                               └────────────────────┘
                                   │           │
                                   ↓           ↓
                       ┌────────────────┐ ┌──────────────────────┐
                       │ NOTIF_QUEUE    │ │ PARENT_ACKNOWLEDGEMENTS│
                       │                │ │                      │
                       │ id (PK)        │ │ id (PK)              │
                       │ notification_id│ │ notification_id (UQ) │
                       │ retry_count    │ │ status               │
                       │ next_retry_at  │ │ response_time_seconds│
                       └────────────────┘ └──────────────────────┘
```

---

## Table Definitions

### 1. `schools` — Multi-Tenant Root Entity

| Column     | Type           | Constraints              | Description                  |
|-----------|----------------|--------------------------|------------------------------|
| id        | UUID (TEXT)     | PRIMARY KEY              | Unique school identifier     |
| name      | VARCHAR(255)   | NOT NULL                 | School display name          |
| code      | VARCHAR(50)    | NOT NULL, UNIQUE         | Short code (e.g., SDHS)      |
| address   | TEXT           |                          | Physical address             |
| created_at| TIMESTAMPTZ    | DEFAULT CURRENT_TIMESTAMP| Record creation time         |

**Index:** `idx_schools_code` on `(code)`

---

### 2. `users` — Authentication & Authorization

| Column       | Type           | Constraints                          | Description                |
|-------------|----------------|--------------------------------------|----------------------------|
| id          | UUID (TEXT)     | PRIMARY KEY                          | Unique user identifier     |
| school_id   | UUID           | NOT NULL, FK → schools(id) CASCADE   | Tenant scoping             |
| username    | VARCHAR(100)   | NOT NULL, UNIQUE                     | Login username             |
| password_hash| VARCHAR(255)  | NOT NULL                             | bcrypt hashed password     |
| full_name   | VARCHAR(255)   | NOT NULL                             | Display name               |
| role        | VARCHAR(50)    | NOT NULL, CHECK IN (...)             | SUPER_ADMIN, PRINCIPAL, COORDINATOR, TEACHER, OFFICER |
| is_active   | BOOLEAN        | DEFAULT TRUE                         | Account status             |
| created_at  | TIMESTAMPTZ    | DEFAULT CURRENT_TIMESTAMP            | Record creation time       |

**Indexes:** `idx_users_username`, `idx_users_school`

---

### 3. `students` — Student Information Management

| Column            | Type          | Constraints                        | Description                |
|------------------|---------------|-------------------------------------|---------------------------|
| id               | UUID (TEXT)    | PRIMARY KEY                         | Unique student identifier  |
| school_id        | UUID          | NOT NULL, FK → schools(id) CASCADE  | Tenant scoping             |
| admission_number | VARCHAR(100)  | NOT NULL                            | Admission/registration ID  |
| first_name       | VARCHAR(150)  | NOT NULL                            | Student first name         |
| last_name        | VARCHAR(150)  | NOT NULL                            | Student last name          |
| grade_class      | VARCHAR(50)   | NOT NULL                            | e.g., "Grade 10"          |
| section          | VARCHAR(50)   | NOT NULL                            | e.g., "Section A"         |
| roll_number      | INTEGER       | NOT NULL                            | Roll number in class       |
| parent_name      | VARCHAR(255)  | NOT NULL                            | Parent/guardian name       |
| parent_phone     | VARCHAR(50)   | NOT NULL                            | Primary contact number     |
| parent_alt_phone | VARCHAR(50)   |                                     | Alternate contact          |
| parent_email     | VARCHAR(255)  | NOT NULL                            | Parent email address       |
| preferred_language| VARCHAR(50)  | DEFAULT 'en'                        | Communication language     |
| is_active        | BOOLEAN       | DEFAULT TRUE                        | Enrollment status          |
| created_at       | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP           | Record creation time       |

**Constraints:** `uq_admission_school` UNIQUE(school_id, admission_number)  
**Indexes:** `idx_students_school`, `idx_students_class_section`, `idx_students_roll`

---

### 4. `attendance` — Daily Attendance Records

| Column       | Type          | Constraints                        | Description                 |
|-------------|---------------|------------------------------------|-----------------------------|
| id          | UUID (TEXT)    | PRIMARY KEY                        | Unique record identifier    |
| school_id   | UUID          | NOT NULL, FK → schools(id) CASCADE | Tenant scoping              |
| student_id  | UUID          | NOT NULL, FK → students(id) CASCADE| Associated student          |
| date        | DATE (TEXT)   | NOT NULL                           | Attendance date (YYYY-MM-DD)|
| status      | VARCHAR(50)   | NOT NULL, CHECK IN (PRESENT, ABSENT, LATE, EXCUSED) | Status value |
| remarks     | TEXT          |                                    | Optional notes              |
| marked_by   | UUID          | NOT NULL, FK → users(id)           | Who marked attendance       |
| finalized   | BOOLEAN       | DEFAULT FALSE                      | Finalization flag           |
| finalized_at| TIMESTAMPTZ   |                                    | When finalized              |
| created_at  | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP          | Record creation time        |

**Constraints:** `uq_student_date` UNIQUE(student_id, date)  
**Indexes:** `idx_attendance_date`, `idx_attendance_student`, `idx_attendance_class_date`

---

### 5. `emergency_broadcasts` — School-Wide Announcements

| Column       | Type           | Constraints                        | Description                |
|-------------|----------------|-------------------------------------|---------------------------|
| id          | UUID (TEXT)     | PRIMARY KEY                         | Unique broadcast ID        |
| school_id   | UUID           | NOT NULL, FK → schools(id) CASCADE  | Tenant scoping             |
| sender_id   | UUID           | NOT NULL, FK → users(id)            | Who initiated broadcast    |
| subject     | VARCHAR(255)   | NOT NULL                            | Broadcast subject          |
| message_body| TEXT           | NOT NULL                            | Message content            |
| channels    | VARCHAR(50)[]  | NOT NULL                            | Target channels array      |
| status      | VARCHAR(50)    | CHECK IN (PENDING, PROCESSING, SENT, FAILED) | Dispatch state  |
| created_at  | TIMESTAMPTZ    | DEFAULT CURRENT_TIMESTAMP           | Creation time              |

---

### 6. `communication_templates` — Message Templates

| Column     | Type          | Constraints                        | Description                  |
|-----------|---------------|-------------------------------------|------------------------------|
| id        | UUID (TEXT)    | PRIMARY KEY                         | Template identifier          |
| school_id | UUID          | NOT NULL, FK → schools(id) CASCADE  | Tenant scoping               |
| name      | VARCHAR(150)  | NOT NULL                            | Template name (e.g., ABSENT_NOTIFICATION) |
| channel   | VARCHAR(50)   | NOT NULL, CHECK IN (CALL, SMS, WHATSAPP, EMAIL) | Target channel |
| subject   | VARCHAR(255)  |                                     | Email subject (optional)     |
| body      | TEXT          | NOT NULL                            | Template body with {{vars}}  |

**Constraints:** `uq_school_template_name` UNIQUE(school_id, name, channel)

### Template Variables

| Variable          | Description                     |
|------------------|---------------------------------|
| `{{parent_name}}`| Parent/guardian name            |
| `{{student_name}}`| Full student name              |
| `{{class}}`      | Grade and section               |
| `{{date}}`       | Attendance date                 |
| `{{roll_number}}`| Student roll number             |
| `{{ack_link}}`   | Parent acknowledgement URL      |

---

### 7. `notifications` — Communication Instances

| Column        | Type          | Constraints                         | Description             |
|--------------|---------------|--------------------------------------|-------------------------|
| id           | UUID (TEXT)    | PRIMARY KEY                          | Notification identifier |
| school_id    | UUID          | NOT NULL, FK → schools(id) CASCADE   | Tenant scoping          |
| student_id   | UUID          | NOT NULL, FK → students(id) CASCADE  | Target student          |
| attendance_id| UUID          | FK → attendance(id) SET NULL         | Linked attendance       |
| broadcast_id | UUID          | FK → emergency_broadcasts(id) SET NULL | Linked broadcast      |
| parent_name  | VARCHAR(255)  | NOT NULL                             | Recipient name          |
| parent_contact| VARCHAR(255) | NOT NULL                             | Phone/email             |
| channel      | VARCHAR(50)   | NOT NULL, CHECK IN (...)             | Delivery channel        |
| message_body | TEXT          | NOT NULL                             | Rendered message        |
| status       | VARCHAR(50)   | NOT NULL, CHECK IN (PENDING, PROCESSING, SENT, DELIVERED, FAILED, CANCELLED) | Current state |
| created_at   | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP            | Creation time           |
| processed_at | TIMESTAMPTZ   |                                      | When processed          |

---

### 8. `notification_queue` — Execution Queue

| Column          | Type          | Constraints                             | Description          |
|----------------|---------------|------------------------------------------|----------------------|
| id             | UUID (TEXT)    | PRIMARY KEY                              | Queue item ID        |
| notification_id| UUID          | NOT NULL, FK → notifications(id) CASCADE | Associated notif     |
| status         | VARCHAR(50)   | NOT NULL, CHECK IN (...)                 | Queue item state     |
| retry_count    | INTEGER       | DEFAULT 0                                | Current retry #      |
| next_retry_at  | TIMESTAMPTZ   |                                          | Scheduled retry time |
| error_message  | TEXT          |                                          | Last error message   |
| created_at     | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP                | Enqueue time         |

---

### 9. `parent_acknowledgements` — Response Tracking

| Column               | Type          | Constraints                             | Description           |
|---------------------|---------------|------------------------------------------|-----------------------|
| id                  | UUID (TEXT)    | PRIMARY KEY                              | Acknowledgement ID    |
| notification_id     | UUID          | NOT NULL, FK → notifications(id), UNIQUE | 1:1 with notification |
| status              | VARCHAR(50)   | CHECK IN (ACKNOWLEDGED, NEEDS_FOLLOW_UP) | Parent response       |
| acknowledged_at     | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP                | Response timestamp    |
| response_time_seconds| INTEGER      |                                          | Time to respond       |
| remarks             | TEXT          |                                          | Parent comments       |

---

### 10. `communication_logs` — Provider Telemetry

| Column          | Type          | Constraints                           | Description           |
|----------------|---------------|----------------------------------------|-----------------------|
| id             | UUID (TEXT)    | PRIMARY KEY                            | Log entry ID          |
| notification_id| UUID          | NOT NULL, FK → notifications(id)       | Associated notif      |
| provider_name  | VARCHAR(100)  | NOT NULL                               | e.g., MockCallProvider|
| status         | VARCHAR(100)  | NOT NULL                               | COMPLETED, BUSY, etc. |
| duration_seconds| INTEGER      |                                        | Call duration          |
| error_code     | VARCHAR(50)   |                                        | ERR_LINE_BUSY, etc.  |
| remarks        | TEXT          |                                        | Provider notes        |
| timestamp      | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP              | Log timestamp         |

---

### 11. `notification_settings` — Per-School Configuration

| Column               | Type           | Constraints                            | Description            |
|---------------------|----------------|----------------------------------------|------------------------|
| id                  | UUID (TEXT)     | PRIMARY KEY                            | Settings ID            |
| school_id           | UUID           | NOT NULL, FK → schools(id), UNIQUE     | One per school         |
| notification_time   | TIME (TEXT)    | DEFAULT '12:00:00'                     | Daily trigger time     |
| max_retries         | INTEGER        | DEFAULT 3                              | Max retry attempts     |
| active_channels     | VARCHAR(50)[]  | DEFAULT ['SMS', 'EMAIL']               | Enabled channels       |
| default_templates   | JSONB (TEXT)   | DEFAULT '{}'                           | Template mappings      |
| language_preferences| JSONB (TEXT)   | DEFAULT '{}'                           | Language config        |

---

### 12. `audit_logs` — Immutable Security Trail

| Column     | Type          | Constraints                         | Description              |
|-----------|---------------|--------------------------------------|--------------------------|
| id        | UUID (TEXT)    | PRIMARY KEY                          | Log entry ID             |
| school_id | UUID          | FK → schools(id) SET NULL            | Tenant scoping           |
| user_id   | UUID          | FK → users(id) SET NULL              | Actor user               |
| action    | VARCHAR(255)  | NOT NULL                             | Action type (e.g., MARK_ATTENDANCE) |
| table_name| VARCHAR(100)  | NOT NULL                             | Affected table           |
| record_id | VARCHAR(100)  | NOT NULL                             | Affected record ID       |
| old_values| JSONB (TEXT)  |                                      | Previous state snapshot  |
| new_values| JSONB (TEXT)  |                                      | New state snapshot       |
| timestamp | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP            | Mutation timestamp       |

**Index:** `idx_audit_school_time` on `(school_id, timestamp)`

---

## Seed Data Summary

| Table                  | Records | Description                                     |
|-----------------------|---------|--------------------------------------------------|
| schools               | 2       | Springdale High, Greenwood International         |
| users                 | 4       | admin, teacher, principal, teacher2              |
| students              | 10      | 10 students across Grade 9-10, Sections A-B     |
| notification_settings | 2       | Default settings per school                      |
| communication_templates| 9      | SMS, WhatsApp, Email, Call templates             |
| attendance            | ~50     | 5 days of historical records                     |
| notifications         | ~30     | Historical notification logs                     |
| communication_logs    | ~5      | Mock call telemetry records                      |
| parent_acknowledgements| ~10   | Historical parent response logs                  |

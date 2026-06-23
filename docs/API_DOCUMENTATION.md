# EduNotify — API Documentation

**Base URL:** `http://localhost:5000/api`  
**Authentication:** Bearer Token (JWT)  
**Content-Type:** `application/json`

---

## 1. Authentication

### POST `/auth/login`

Login with credentials and receive a JWT token.

**Access:** Public

| Field    | Type   | Required | Description       |
|----------|--------|----------|-------------------|
| username | string | ✅       | User login name   |
| password | string | ✅       | User password     |

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "school_id": "uuid",
    "username": "admin",
    "role": "SUPER_ADMIN",
    "full_name": "System Administrator",
    "school_name": "Springdale High School",
    "school_code": "SDHS"
  }
}
```

### GET `/auth/me`

Get current authenticated user profile.

**Access:** Authenticated

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "school_id": "uuid",
    "username": "admin",
    "full_name": "System Administrator",
    "role": "SUPER_ADMIN",
    "is_active": true,
    "school_name": "Springdale High School"
  }
}
```

---

## 2. Dashboard & Analytics

### GET `/dashboard/stats`

Aggregate all dashboard telemetry data.

**Access:** Authenticated (All roles)

**Response (200):**
```json
{
  "attendanceSummary": {
    "totalStudents": 10,
    "presentToday": 8,
    "absentToday": 2,
    "lateToday": 0,
    "excusedToday": 0,
    "markedTodayTotal": 10,
    "attendancePercentage": 80
  },
  "notificationSummary": {
    "total": 45,
    "pending": 2,
    "success": 40,
    "failed": 3,
    "channels": { "CALL": 8, "SMS": 15, "WHATSAPP": 12, "EMAIL": 10 }
  },
  "acknowledgementSummary": {
    "acknowledged": 12,
    "needsFollowUp": 3,
    "avgResponseTimeSeconds": 1800
  },
  "todaysAbsentees": [...],
  "historicalTrends": [...],
  "topAbsentClasses": [...]
}
```

---

## 3. Student Management

### GET `/students`

List all students with optional filters.

**Access:** Authenticated

| Query Param | Type   | Description                |
|------------|--------|----------------------------|
| gradeClass | string | Filter by grade class      |
| section    | string | Filter by section          |
| search     | string | Search by name/admission # |
| limit      | number | Default: 100               |
| offset     | number | Default: 0                 |

### GET `/students/:id`

Get a single student by ID.

### POST `/students`

Create a new student record.

**Access:** SUPER_ADMIN, PRINCIPAL, COORDINATOR

| Field            | Type    | Required | Description            |
|-----------------|---------|----------|------------------------|
| admission_number| string  | ✅       | Unique admission #     |
| first_name      | string  | ✅       | Student first name     |
| last_name       | string  | ✅       | Student last name      |
| grade_class     | string  | ✅       | e.g., "Grade 10"      |
| section         | string  | ✅       | e.g., "Section A"     |
| roll_number     | number  | ✅       | Roll number            |
| parent_name     | string  | ✅       | Parent/guardian name   |
| parent_phone    | string  | ✅       | Primary phone number   |
| parent_email    | string  | ✅       | Parent email address   |
| parent_alt_phone| string  |          | Alternate phone        |
| preferred_language| string|          | Default: "en"          |
| is_active       | boolean |          | Default: true          |

### PUT `/students/:id`

Update a student record. Same fields as POST.

### DELETE `/students/:id`

Delete a student record.

---

## 4. Attendance Management

### GET `/attendance/roster`

Get attendance grid for a class/section/date.

**Access:** Authenticated

| Query Param | Type   | Required | Description        |
|------------|--------|----------|--------------------|
| date       | string | ✅       | YYYY-MM-DD format  |
| gradeClass | string | ✅       | e.g., "Grade 10"  |
| section    | string | ✅       | e.g., "Section A" |

### POST `/attendance/mark`

Mark attendance for multiple students.

**Access:** SUPER_ADMIN, PRINCIPAL, COORDINATOR, TEACHER

```json
{
  "records": [
    {
      "studentId": "uuid",
      "date": "2026-06-23",
      "status": "PRESENT",
      "remarks": ""
    },
    {
      "studentId": "uuid",
      "date": "2026-06-23",
      "status": "ABSENT",
      "remarks": "Unexcused"
    }
  ]
}
```

### POST `/attendance/finalize`

Finalize attendance and trigger notification queue for absentees.

**Access:** SUPER_ADMIN, PRINCIPAL, COORDINATOR, TEACHER

```json
{
  "date": "2026-06-23",
  "gradeClass": "Grade 10",
  "section": "Section A"
}
```

**Response (200):**
```json
{
  "message": "Attendance finalized successfully. Notifications have been queued.",
  "count": 4
}
```

### GET `/attendance/student/:studentId`

Get a student's full attendance history.

---

## 5. Communication Templates

### GET `/templates`

List all templates for the school.

### GET `/templates/:id`

Get a single template.

### POST `/templates`

Create a new template.

**Access:** SUPER_ADMIN, PRINCIPAL, COORDINATOR

| Field   | Type   | Required | Description                    |
|---------|--------|----------|--------------------------------|
| name    | string | ✅       | Template identifier            |
| channel | string | ✅       | CALL, SMS, WHATSAPP, or EMAIL  |
| subject | string |          | Email subject line             |
| body    | string | ✅       | Template body with {{vars}}    |

### PUT `/templates/:id`

Update an existing template.

### DELETE `/templates/:id`

Delete a template.

---

## 6. System Settings

### GET `/settings`

Get school notification settings. Returns defaults if not configured.

### PUT `/settings`

Update school notification settings.

**Access:** SUPER_ADMIN, PRINCIPAL

| Field               | Type     | Description                        |
|--------------------|----------|------------------------------------|
| notification_time  | string   | Daily trigger time (HH:MM:SS)     |
| max_retries        | number   | Max notification retry attempts    |
| active_channels    | string[] | e.g., ["SMS", "EMAIL", "WHATSAPP"]|
| default_templates  | object   | Template mapping overrides         |
| language_preferences| object  | Language configuration             |

---

## 7. Emergency Broadcasts

### POST `/broadcasts`

Send emergency broadcast to all parents.

**Access:** SUPER_ADMIN, PRINCIPAL

```json
{
  "subject": "School Closure Notice",
  "messageBody": "Dear {{parent_name}}, school will remain closed tomorrow.",
  "channels": ["SMS", "WHATSAPP"]
}
```

### GET `/broadcasts`

List all past broadcasts.

---

## 8. Parent Acknowledgement

### GET `/public/acknowledgements/:notificationId`

Get notification details for parent form. **No authentication required.**

### POST `/public/acknowledgements/:notificationId`

Submit parent response. **No authentication required.**

```json
{
  "status": "ACKNOWLEDGED",
  "remarks": "Child has fever. Will send medical certificate."
}
```

### GET `/acknowledgements/stats`

Get acknowledgement rate statistics for dashboard.

**Access:** Authenticated

---

## 9. System Logs

### GET `/logs/call-logs`

Get communication/call provider telemetry logs.

### GET `/logs/audit-logs`

Get security audit trail logs.

**Access:** SUPER_ADMIN, PRINCIPAL

### GET `/logs/absentees-telemetry`

Get today's absentee dispatch status with notification and acknowledgement data.

| Query Param | Type   | Description                 |
|------------|--------|-----------------------------|
| date       | string | YYYY-MM-DD (default: today) |

---

## 10. Scheduler

### POST `/scheduler/trigger`

Manually trigger the daily 12:00 PM attendance processing scheduler.

**Access:** SUPER_ADMIN, PRINCIPAL

**Response (200):**
```json
{
  "message": "Daily attendance processing scheduler run completed successfully."
}
```

---

## Error Response Format

All errors return consistent JSON:

```json
{
  "error": "Human-readable error description"
}
```

| Status Code | Meaning                               |
|-------------|---------------------------------------|
| 400         | Bad Request (validation error)        |
| 401         | Unauthorized (missing/invalid token)  |
| 403         | Forbidden (insufficient role)         |
| 404         | Resource not found                    |
| 500         | Internal server error                 |

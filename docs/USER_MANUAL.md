# EduNotify — User Manual

## 1. Getting Started

### 1.1 Accessing the System

Open your web browser and navigate to: **http://localhost:5173**

You will see the EduNotify login screen with a glassmorphic design.

### 1.2 Logging In

1. Enter your **Username** and **Password**
2. Click **Sign In**
3. Demo credentials are shown at the bottom of the login form:
   - Admin: `admin` / `admin123`
   - Teacher: `teacher` / `teacher123`
   - Principal: `principal` / `principal123`

### 1.3 Understanding Roles

| Role         | Description                                          |
|--------------|------------------------------------------------------|
| Super Admin  | Full system access including settings and audit logs |
| Principal    | Full access including broadcasts and audit trails    |
| Coordinator  | Student management, attendance, and templates        |
| Teacher      | Attendance marking and call log viewing              |

---

## 2. Dashboard

After logging in, you'll see the **Analytics Dashboard** containing:

### 2.1 Stat Cards (Top Row)
- **Registered Students** — Total active students
- **Daily Attendance Rate** — Today's attendance percentage
- **Today's Absentees** — Number of absent students today
- **Success Dispatch Rate** — Notification delivery success %

### 2.2 Channel Dispatch Breakdown
Shows the distribution of notifications across SMS, Email, WhatsApp, and Call channels with progress bars.

### 2.3 Parent Response Rates
Displays acknowledgement counts and average response times.

### 2.4 Top Absent Classes
Ranks classes by total absences this month.

### 2.5 Attendance Trend Chart
SVG line chart showing 7-day attendance rate history (70%-100% scale).

### 2.6 Today's Absentee Table
Detailed table showing each absent student with their notification dispatch status and parent acknowledgement state.

### 2.7 Manual Scheduler Trigger
Click **"Run Daily 12:00 PM Scheduler"** to manually trigger the automated notification pipeline for testing.

---

## 3. Student Registry

### 3.1 Viewing Students
Navigate to **Student Registry** in the sidebar. Students are displayed in a sortable table with:
- Roll number, name, class, section
- Parent contact information
- Enrollment status

### 3.2 Adding a Student
1. Click **+ Add Student** button
2. Fill in the required fields:
   - Admission Number (unique per school)
   - First Name, Last Name
   - Grade Class (e.g., "Grade 10")
   - Section (e.g., "Section A")
   - Roll Number
   - Parent Name, Phone, Email
3. Click **Save Student**

### 3.3 Editing a Student
1. Click the **Edit** (pencil) icon on any student row
2. Modify the fields
3. Click **Update Student**

### 3.4 Deleting a Student
1. Click the **Delete** (trash) icon on any student row
2. Confirm the deletion

### 3.5 Searching & Filtering
- Use the **Search** input to find students by name or admission number
- Use the **Class** and **Section** dropdowns to filter

---

## 4. Attendance Board

### 4.1 Loading the Roster
1. Navigate to **Attendance Board**
2. Select **Date**, **Grade Class**, and **Section** from the dropdowns
3. Click **Load Roster**
4. A grid of all students in that class appears

### 4.2 Marking Attendance
For each student, select one of:
- ✅ **Present** (green)
- ❌ **Absent** (red)
- ⏰ **Late** (yellow)
- 📝 **Excused** (blue)

Click **Save Attendance** to persist your selections.

### 4.3 Finalizing Attendance
After marking all students:
1. Click **Finalize Attendance**
2. This action:
   - Locks the attendance records
   - Finds all ABSENT students
   - Generates notification messages for each active channel
   - Enqueues notifications for background processing
3. You'll see a success message with the count of finalized records

> **Note:** Once finalized, the background queue processor will begin dispatching notifications within 5 seconds.

---

## 5. Today's Absentees

Navigate to **Today's Absentees** to see a comprehensive list of all students marked absent today, including:
- Student details (name, class, section, roll number)
- Parent contact information
- Notification channel and delivery status
- Parent acknowledgement status

---

## 6. Call Telemetry

Navigate to **Call Telemetry** to view voice call logs from the communication provider, including:
- Call duration (in seconds)
- Provider used (MockCallProvider)
- Call status (COMPLETED, BUSY, NO_ANSWER)
- Error codes and remarks

---

## 7. Broadcast Center

### 7.1 Sending an Emergency Broadcast
1. Navigate to **Broadcast Center**
2. Enter a **Subject** (e.g., "School Closure Notice")
3. Enter the **Message Body** (supports {{parent_name}}, {{student_name}} variables)
4. Select **Channels** (SMS, WhatsApp, Email, Call)
5. Click **Send Broadcast**
6. The system creates notifications for ALL students and enqueues them

### 7.2 Viewing Past Broadcasts
Below the send form, a history table shows all previous broadcasts with:
- Subject, sender name, channel list
- Dispatch status and timestamp

---

## 8. Message Templates

### 8.1 Viewing Templates
Navigate to **Message Templates** to see all configured templates with their:
- Template name (e.g., ABSENT_NOTIFICATION)
- Target channel
- Preview of the template body

### 8.2 Creating Templates
1. Click **+ New Template**
2. Enter Template Name
3. Select Channel (SMS, WhatsApp, Email, Call)
4. Enter Subject (for email templates)
5. Enter Body with placeholder variables:
   - `{{parent_name}}` — Parent's name
   - `{{student_name}}` — Full student name
   - `{{class}}` — Grade and section
   - `{{date}}` — Absence date
   - `{{roll_number}}` — Student roll number
   - `{{ack_link}}` — Acknowledgement URL
6. Click **Save Template**

---

## 9. Audit Trails

Navigate to **Audit Trails** (Admin/Principal only) to view the security audit log:
- **Action Type** — MARK_ATTENDANCE, CREATE_STUDENT, FINALIZE_ATTENDANCE, etc.
- **User** — Who performed the action
- **Table** — Which database table was affected
- **Timestamp** — When the action occurred
- **Old/New Values** — JSON snapshot of before/after state

---

## 10. System Settings

Navigate to **System Settings** (Admin/Principal only) to configure:
- **Notification Time** — When the daily scheduler runs (default: 12:00 PM)
- **Max Retries** — How many times to retry failed notifications
- **Active Channels** — Which channels are enabled (SMS, Email, WhatsApp, Call)

---

## 11. Parent Acknowledgement Portal

### How Parents Use It
1. Parent receives an SMS/WhatsApp/Email with an acknowledgement link
2. Clicking the link opens a public web page (no login required)
3. The page shows student name, class, and absence date
4. Parent selects:
   - **Confirm Absence (Acknowledged)** — "Yes, I know my child is absent"
   - **Request Follow-up (Urgent Callback)** — "I need the school to contact me"
5. Parent optionally adds remarks
6. Clicks **Submit Verification Response**
7. A confirmation screen appears

---

## 12. Automated Scheduler

The system includes a **12:00 PM daily cron job** that:
1. Scans all schools for unfinalized attendance records
2. Auto-finalizes them using the school's admin account
3. Generates notifications for absent students
4. Triggers the queue processor to dispatch immediately

The scheduler also runs when manually triggered from the Dashboard.

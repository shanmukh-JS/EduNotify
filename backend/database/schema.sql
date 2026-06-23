-- EduNotify Database Schema (PostgreSQL)
-- Multi-Tenant Architecture for Parent Communication and Attendance Intelligence

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schools (Multi-Tenant Identifier)
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for school code lookup
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);

-- 2. Users (Authentication and RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'OFFICER')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user management
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);

-- 3. Students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    admission_number VARCHAR(100) NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    grade_class VARCHAR(50) NOT NULL, -- e.g., 'Grade 10'
    section VARCHAR(50) NOT NULL,     -- e.g., 'Section A'
    roll_number INTEGER NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    parent_alt_phone VARCHAR(50),
    parent_email VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(50) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_admission_school UNIQUE (school_id, admission_number)
);

-- Indexes for student retrieval
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(school_id, grade_class, section);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(school_id, grade_class, section, roll_number);

-- 4. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    remarks TEXT,
    marked_by UUID NOT NULL REFERENCES users(id),
    finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_date UNIQUE (student_id, date)
);

-- Indexes for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(school_id, date, status);

-- 5. Emergency Broadcasts
CREATE TABLE IF NOT EXISTS emergency_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    message_body TEXT NOT NULL,
    channels VARCHAR(50)[] NOT NULL, -- e.g., ARRAY['SMS', 'WHATSAPP']
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_school ON emergency_broadcasts(school_id);

-- 6. Communication Templates
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- e.g., 'ABSENT_NOTIFICATION', 'LATE_NOTIFICATION'
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('CALL', 'SMS', 'WHATSAPP', 'EMAIL')),
    subject VARCHAR(255), -- Used for Email templates
    body TEXT NOT NULL,   -- Contains placeholders like {{student_name}}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_school_template_name UNIQUE (school_id, name, channel)
);

CREATE INDEX IF NOT EXISTS idx_templates_school ON communication_templates(school_id);

-- 7. Notifications (General Communication Instances)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
    broadcast_id UUID REFERENCES emergency_broadcasts(id) ON DELETE SET NULL,
    parent_name VARCHAR(255) NOT NULL,
    parent_contact VARCHAR(255) NOT NULL, -- email, phone number, etc.
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('CALL', 'SMS', 'WHATSAPP', 'EMAIL')),
    message_body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notification processing
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(school_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- 8. Notification Queue (Execution State Layer)
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queue_status_retry ON notification_queue(status, next_retry_at);

-- 9. Parent Acknowledgements (Two-Way Communication Tracking)
CREATE TABLE IF NOT EXISTS parent_acknowledgements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('ACKNOWLEDGED', 'NEEDS_FOLLOW_UP')),
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_time_seconds INTEGER, -- Difference between notification sent time and acknowledgement time
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_acknowledgements_notification ON parent_acknowledgements(notification_id);

-- 10. Communication Logs (Provider Call Telemetry)
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    provider_name VARCHAR(100) NOT NULL, -- e.g., 'Twilio', 'MockCallProvider'
    status VARCHAR(100) NOT NULL,        -- e.g., 'COMPLETED', 'BUSY', 'NO_ANSWER'
    duration_seconds INTEGER,
    error_code VARCHAR(50),
    remarks TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_notification ON communication_logs(notification_id);

-- 11. Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
    notification_time TIME NOT NULL DEFAULT '12:00:00',
    max_retries INTEGER NOT NULL DEFAULT 3,
    active_channels VARCHAR(50)[] NOT NULL DEFAULT ARRAY['SMS', 'EMAIL']::VARCHAR(50)[],
    default_templates JSONB NOT NULL DEFAULT '{}'::JSONB,
    language_preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs (Immutable Security Log)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_school_time ON audit_logs(school_id, timestamp);

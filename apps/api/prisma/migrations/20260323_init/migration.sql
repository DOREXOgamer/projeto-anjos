-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "Role" AS ENUM ('DIRECTOR', 'TEACHER');
CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');
CREATE TYPE "EventType" AS ENUM ('CLASS', 'EVENT', 'HOLIDAY', 'MEETING');

-- Users
CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'TEACHER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Students
CREATE TABLE "Student" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "cpf" TEXT,
  "birthDate" DATE,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- Classes
CREATE TABLE "Class" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "course" TEXT NOT NULL,
  "schedule" TEXT,
  "room" TEXT,
  "capacity" INTEGER,
  "status" "ClassStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- Enrollments
CREATE TABLE "Enrollment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "classId" UUID NOT NULL,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Enrollment_studentId_classId_key" ON "Enrollment"("studentId", "classId");

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Attendance
CREATE TABLE "Attendance" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "classId" UUID,
  "date" DATE NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attendance_studentId_classId_date_key" ON "Attendance"("studentId", "classId", "date");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lesson plans
CREATE TABLE "LessonPlan" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "classId" UUID NOT NULL,
  "date" DATE NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LessonPlan_date_idx" ON "LessonPlan"("date");

ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Events
CREATE TABLE "Event" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" DATE NOT NULL,
  "type" "EventType" NOT NULL,
  "classId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Event_date_idx" ON "Event"("date");

ALTER TABLE "Event" ADD CONSTRAINT "Event_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Announcements
CREATE TABLE "Announcement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

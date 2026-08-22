-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'MENTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('CLASS_9', 'CLASS_10', 'CLASS_11', 'CLASS_12', 'UNDERGRADUATE', 'POSTGRADUATE', 'OTHER');

-- CreateEnum
CREATE TYPE "StreamCode" AS ENUM ('SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL');

-- CreateEnum
CREATE TYPE "DegreeType" AS ENUM ('DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('GOVERNMENT', 'GOVERNMENT_AIDED', 'AUTONOMOUS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "QuizCategory" AS ENUM ('INTEREST', 'APTITUDE', 'PERSONALITY');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "RoadmapStage" AS ENUM ('CURRENT', 'NEXT_EXAM', 'STREAM_CHOICE', 'DEGREE', 'HIGHER_STUDY', 'CAREER');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('ADMISSION', 'ENTRANCE_EXAM', 'BOARD_EXAM', 'SCHOLARSHIP', 'COUNSELLING', 'RESULT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEADLINE_REMINDER', 'APPLICATION_UPDATE', 'RECOMMENDATION', 'SESSION_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MentorSessionStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BookmarkEntity" AS ENUM ('COLLEGE', 'SCHOLARSHIP', 'COURSE', 'CAREER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "educationLevel" "EducationLevel",
    "currentStream" "StreamCode",
    "boardName" TEXT,
    "schoolName" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "code" "StreamCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconKey" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT NOT NULL,
    "degreeType" "DegreeType" NOT NULL,
    "durationYears" DOUBLE PRECISION NOT NULL,
    "eligibility" TEXT NOT NULL,
    "averageFeeMin" INTEGER,
    "averageFeeMax" INTEGER,
    "streamId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "educationRequired" TEXT NOT NULL,
    "averageSalaryMin" INTEGER,
    "averageSalaryMax" INTEGER,
    "growthOutlook" TEXT,
    "sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCareer" (
    "courseId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL DEFAULT 50,
    "note" TEXT,

    CONSTRAINT "CourseCareer_pkey" PRIMARY KEY ("courseId","careerId")
);

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CollegeType" NOT NULL DEFAULT 'GOVERNMENT',
    "affiliation" TEXT,
    "addressLine" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "establishedYear" INTEGER,
    "naacGrade" TEXT,
    "hostelAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeCourse" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "seats" INTEGER,
    "annualFee" INTEGER,
    "cutoffPercentage" DOUBLE PRECISION,
    "medium" TEXT,

    CONSTRAINT "CollegeCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "benefitAmount" INTEGER,
    "benefitDescription" TEXT,
    "applicationStartDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,
    "state" TEXT,
    "eligibleStreams" "StreamCode"[] DEFAULT ARRAY[]::"StreamCode"[],
    "eligibleLevels" "EducationLevel"[] DEFAULT ARRAY[]::"EducationLevel"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScholarshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "category" "QuizCategory" NOT NULL,
    "text" TEXT NOT NULL,
    "helpText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "streamWeights" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "scores" JSONB NOT NULL DEFAULT '{}',
    "recommendedStream" "StreamCode",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "stream" "StreamCode",
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapStep" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "stage" "RoadmapStage" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "targetDate" TIMESTAMP(3),
    "resourceUrl" TEXT,

    CONSTRAINT "RoadmapStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "url" TEXT,
    "state" TEXT,
    "isNational" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "BookmarkEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "category" TEXT,
    "message" TEXT NOT NULL,
    "pageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactQuery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "QueryStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSession" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" "MentorSessionStatus" NOT NULL DEFAULT 'REQUESTED',
    "topic" TEXT,
    "meetingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_state_district_idx" ON "Profile"("state", "district");

-- CreateIndex
CREATE INDEX "Profile_educationLevel_idx" ON "Profile"("educationLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_code_key" ON "Stream"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_streamId_idx" ON "Course"("streamId");

-- CreateIndex
CREATE INDEX "Course_degreeType_idx" ON "Course"("degreeType");

-- CreateIndex
CREATE UNIQUE INDEX "Career_slug_key" ON "Career"("slug");

-- CreateIndex
CREATE INDEX "CourseCareer_careerId_idx" ON "CourseCareer"("careerId");

-- CreateIndex
CREATE UNIQUE INDEX "College_slug_key" ON "College"("slug");

-- CreateIndex
CREATE INDEX "College_state_district_idx" ON "College"("state", "district");

-- CreateIndex
CREATE INDEX "College_type_idx" ON "College"("type");

-- CreateIndex
CREATE INDEX "College_name_idx" ON "College"("name");

-- CreateIndex
CREATE INDEX "CollegeCourse_courseId_idx" ON "CollegeCourse"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeCourse_collegeId_courseId_key" ON "CollegeCourse"("collegeId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_slug_key" ON "Scholarship"("slug");

-- CreateIndex
CREATE INDEX "Scholarship_deadline_idx" ON "Scholarship"("deadline");

-- CreateIndex
CREATE INDEX "Scholarship_state_idx" ON "Scholarship"("state");

-- CreateIndex
CREATE INDEX "Scholarship_isActive_idx" ON "Scholarship"("isActive");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_scholarshipId_idx" ON "ScholarshipApplication"("scholarshipId");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_status_idx" ON "ScholarshipApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipApplication_userId_scholarshipId_key" ON "ScholarshipApplication"("userId", "scholarshipId");

-- CreateIndex
CREATE INDEX "QuizQuestion_category_displayOrder_idx" ON "QuizQuestion"("category", "displayOrder");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_status_idx" ON "QuizAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "QuizAnswer_questionId_idx" ON "QuizAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnswer_attemptId_questionId_key" ON "QuizAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "Roadmap_userId_isCurrent_idx" ON "Roadmap"("userId", "isCurrent");

-- CreateIndex
CREATE INDEX "RoadmapStep_roadmapId_displayOrder_idx" ON "RoadmapStep"("roadmapId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_slug_key" ON "TimelineEvent"("slug");

-- CreateIndex
CREATE INDEX "TimelineEvent_startDate_idx" ON "TimelineEvent"("startDate");

-- CreateIndex
CREATE INDEX "TimelineEvent_type_idx" ON "TimelineEvent"("type");

-- CreateIndex
CREATE INDEX "TimelineEvent_state_idx" ON "TimelineEvent"("state");

-- CreateIndex
CREATE INDEX "TimelineSubscription_remindAt_notifiedAt_idx" ON "TimelineSubscription"("remindAt", "notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineSubscription_userId_eventId_key" ON "TimelineSubscription"("userId", "eventId");

-- CreateIndex
CREATE INDEX "Bookmark_userId_entityType_idx" ON "Bookmark"("userId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_entityType_entityId_key" ON "Bookmark"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "ContactQuery_status_createdAt_idx" ON "ContactQuery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Faq_category_displayOrder_idx" ON "Faq"("category", "displayOrder");

-- CreateIndex
CREATE INDEX "MentorSession_mentorId_scheduledAt_idx" ON "MentorSession"("mentorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "MentorSession_studentId_scheduledAt_idx" ON "MentorSession"("studentId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCareer" ADD CONSTRAINT "CourseCareer_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCareer" ADD CONSTRAINT "CourseCareer_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeCourse" ADD CONSTRAINT "CollegeCourse_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeCourse" ADD CONSTRAINT "CollegeCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuizOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineSubscription" ADD CONSTRAINT "TimelineSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineSubscription" ADD CONSTRAINT "TimelineSubscription_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TimelineEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


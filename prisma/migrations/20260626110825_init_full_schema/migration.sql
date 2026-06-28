/*
  Warnings:

  - You are about to drop the `Application` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Application";

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL DEFAULT concat('USAME-', to_char(CURRENT_DATE, 'YYYYMMDD'), '-', floor(random() * 9000 + 1000)::text),
    "email" TEXT,
    "mobile" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'applicant',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "draft_data" JSONB DEFAULT '{}',
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "institution_name" TEXT,
    "established_year" TEXT,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementCommittee" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "member_name" TEXT NOT NULL,
    "father_name" TEXT,
    "dob" TEXT,
    "designation" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "qualification" TEXT,
    "experience" TEXT,

    CONSTRAINT "ManagementCommittee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRoster" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "address" TEXT,
    "profession" TEXT,

    CONSTRAINT "StaffRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDemographics" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "class_level" TEXT NOT NULL,
    "minority_boys" INTEGER NOT NULL DEFAULT 0,
    "minority_girls" INTEGER NOT NULL DEFAULT 0,
    "minority_total" INTEGER NOT NULL DEFAULT 0,
    "others_boys" INTEGER NOT NULL DEFAULT 0,
    "others_girls" INTEGER NOT NULL DEFAULT 0,
    "others_total" INTEGER NOT NULL DEFAULT 0,
    "grand_total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudentDemographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_registration_id_key" ON "Users"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_mobile_key" ON "Users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Applications_user_id_key" ON "Applications"("user_id");

-- CreateIndex
CREATE INDEX "Applications_status_created_at_idx" ON "Applications"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Documents_s3_key_key" ON "Documents"("s3_key");

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementCommittee" ADD CONSTRAINT "ManagementCommittee_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRoster" ADD CONSTRAINT "StaffRoster_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDemographics" ADD CONSTRAINT "StudentDemographics_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

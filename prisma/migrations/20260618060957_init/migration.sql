-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "institutionName" TEXT,
    "draftData" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_registrationId_key" ON "Application"("registrationId");

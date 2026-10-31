-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";
SET search_path = app, public;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE', 'CLIENT');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('FULL_SERVICE', 'PARTIAL_DAY_OF');

-- CreateEnum
CREATE TYPE "EnquiryStage" AS ENUM ('NEW', 'CONTACTED', 'CONSULTATION_SCHEDULED', 'PROPOSAL_SENT', 'LOST');

-- CreateEnum
CREATE TYPE "WeddingState" AS ENUM ('ENQUIRY', 'PROPOSAL', 'AGREEMENT', 'BOOKING_CONFIRMED', 'PLANNING', 'EXECUTION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsultationState" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wedding" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "weddingDate" DATE,
    "packageType" "PackageType" NOT NULL,
    "state" "WeddingState" NOT NULL DEFAULT 'ENQUIRY',
    "guestCount" INTEGER,
    "preferredTheme" TEXT,
    "budgetMax" DECIMAL(16,2),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingClient" (
    "weddingId" UUID NOT NULL,
    "clientId" UUID NOT NULL,

    CONSTRAINT "WeddingClient_pkey" PRIMARY KEY ("weddingId","clientId")
);

-- CreateTable
CREATE TABLE "WeddingAssignment" (
    "weddingId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "WeddingAssignment_pkey" PRIMARY KEY ("weddingId","userId")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "stage" "EnquiryStage" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "state" "ConsultationState" NOT NULL DEFAULT 'REQUESTED',
    "preferredAt" TIMESTAMPTZ(3) NOT NULL,
    "message" TEXT,
    "startAt" TIMESTAMPTZ(3),
    "endAt" TIMESTAMPTZ(3),
    "plannerId" UUID,
    "internalNotes" TEXT,
    "requestedBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "weddingId" UUID,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "actorId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("actorId","key")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Wedding_state_createdAt_idx" ON "Wedding"("state", "createdAt");

-- CreateIndex
CREATE INDEX "WeddingClient_clientId_idx" ON "WeddingClient"("clientId");

-- CreateIndex
CREATE INDEX "WeddingAssignment_userId_idx" ON "WeddingAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_weddingId_key" ON "Enquiry"("weddingId");

-- CreateIndex
CREATE INDEX "Enquiry_stage_createdAt_idx" ON "Enquiry"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "Consultation_weddingId_createdAt_idx" ON "Consultation"("weddingId", "createdAt");

-- CreateIndex
CREATE INDEX "Consultation_plannerId_startAt_idx" ON "Consultation"("plannerId", "startAt");

-- CreateIndex
CREATE INDEX "AuditLog_weddingId_createdAt_idx" ON "AuditLog"("weddingId", "createdAt");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingClient" ADD CONSTRAINT "WeddingClient_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingClient" ADD CONSTRAINT "WeddingClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingAssignment" ADD CONSTRAINT "WeddingAssignment_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingAssignment" ADD CONSTRAINT "WeddingAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

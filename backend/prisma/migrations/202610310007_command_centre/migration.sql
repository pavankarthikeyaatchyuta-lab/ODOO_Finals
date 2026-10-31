SET search_path = app, public;

-- CreateEnum
CREATE TYPE "TimelineStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ScheduleChangeStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AcknowledgementStatus" AS ENUM ('SENT', 'ACKNOWLEDGED', 'PROBLEM');

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "independentScheduleApproval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scheduleVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- AlterTable
ALTER TABLE "WeddingVendor" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'QUOTATION',
ALTER COLUMN "quotationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "functionId" UUID,
    "title" TEXT NOT NULL,
    "plannedStart" TIMESTAMPTZ(3) NOT NULL,
    "plannedEnd" TIMESTAMPTZ(3) NOT NULL,
    "actualStart" TIMESTAMPTZ(3),
    "actualEnd" TIMESTAMPTZ(3),
    "ownerId" UUID,
    "status" "TimelineStatus" NOT NULL DEFAULT 'PLANNED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVendor" (
    "eventId" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,

    CONSTRAINT "EventVendor_pkey" PRIMARY KEY ("eventId","vendorId")
);

-- CreateTable
CREATE TABLE "EventDependency" (
    "eventId" UUID NOT NULL,
    "dependsOnId" UUID NOT NULL,
    "weddingId" UUID NOT NULL,

    CONSTRAINT "EventDependency_pkey" PRIMARY KEY ("eventId","dependsOnId")
);

-- CreateTable
CREATE TABLE "VendorArrival" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "functionId" UUID,
    "expectedAt" TIMESTAMPTZ(3) NOT NULL,
    "actualAt" TIMESTAMPTZ(3),
    "confirmedBy" UUID,
    "confirmedAt" TIMESTAMPTZ(3),
    "coordinatorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorArrival_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "ownerId" UUID,
    "deadline" TIMESTAMPTZ(3),
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleChange" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "baseScheduleVersion" INTEGER NOT NULL,
    "previousStart" TIMESTAMPTZ(3) NOT NULL,
    "previousEnd" TIMESTAMPTZ(3) NOT NULL,
    "proposedStart" TIMESTAMPTZ(3) NOT NULL,
    "proposedEnd" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "impacts" JSONB NOT NULL,
    "requestedBy" UUID NOT NULL,
    "status" "ScheduleChangeStatus" NOT NULL DEFAULT 'PROPOSED',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMPTZ(3),
    "decidedBy" UUID,
    "decidedAt" TIMESTAMPTZ(3),
    "decisionNote" TEXT,
    "publishedAt" TIMESTAMPTZ(3),
    "publishedVersion" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleNotification" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "changeId" UUID NOT NULL,
    "vendorId" UUID,
    "userId" UUID,
    "instructionVersion" INTEGER NOT NULL,
    "instructions" JSONB NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'AVAILABLE_IN_APP',
    "status" "AcknowledgementStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMPTZ(3),
    "problemDescription" TEXT,
    "tokenHash" TEXT,
    "tokenExpiresAt" TIMESTAMPTZ(3),

    CONSTRAINT "ScheduleNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimelineEvent_weddingId_plannedStart_idx" ON "TimelineEvent"("weddingId", "plannedStart");

-- CreateIndex
CREATE INDEX "TimelineEvent_ownerId_idx" ON "TimelineEvent"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_id_weddingId_key" ON "TimelineEvent"("id", "weddingId");

-- CreateIndex
CREATE INDEX "EventVendor_weddingId_vendorId_idx" ON "EventVendor"("weddingId", "vendorId");

-- CreateIndex
CREATE INDEX "EventDependency_dependsOnId_weddingId_idx" ON "EventDependency"("dependsOnId", "weddingId");

-- CreateIndex
CREATE INDEX "VendorArrival_coordinatorId_idx" ON "VendorArrival"("coordinatorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorArrival_weddingId_vendorId_expectedAt_key" ON "VendorArrival"("weddingId", "vendorId", "expectedAt");

-- CreateIndex
CREATE INDEX "Incident_weddingId_status_idx" ON "Incident"("weddingId", "status");

-- CreateIndex
CREATE INDEX "Incident_ownerId_idx" ON "Incident"("ownerId");

-- CreateIndex
CREATE INDEX "ScheduleChange_weddingId_createdAt_idx" ON "ScheduleChange"("weddingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleChange_id_weddingId_key" ON "ScheduleChange"("id", "weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleNotification_tokenHash_key" ON "ScheduleNotification"("tokenHash");

-- CreateIndex
CREATE INDEX "ScheduleNotification_weddingId_status_idx" ON "ScheduleNotification"("weddingId", "status");

-- CreateIndex
CREATE INDEX "ScheduleNotification_changeId_weddingId_idx" ON "ScheduleNotification"("changeId", "weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleNotification_changeId_vendorId_key" ON "ScheduleNotification"("changeId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleNotification_changeId_userId_key" ON "ScheduleNotification"("changeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingVendor_weddingId_vendorId_key" ON "WeddingVendor"("weddingId", "vendorId");

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_functionId_weddingId_fkey" FOREIGN KEY ("functionId", "weddingId") REFERENCES "WeddingFunction"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVendor" ADD CONSTRAINT "EventVendor_eventId_weddingId_fkey" FOREIGN KEY ("eventId", "weddingId") REFERENCES "TimelineEvent"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVendor" ADD CONSTRAINT "EventVendor_weddingId_vendorId_fkey" FOREIGN KEY ("weddingId", "vendorId") REFERENCES "WeddingVendor"("weddingId", "vendorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDependency" ADD CONSTRAINT "EventDependency_eventId_weddingId_fkey" FOREIGN KEY ("eventId", "weddingId") REFERENCES "TimelineEvent"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDependency" ADD CONSTRAINT "EventDependency_dependsOnId_weddingId_fkey" FOREIGN KEY ("dependsOnId", "weddingId") REFERENCES "TimelineEvent"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorArrival" ADD CONSTRAINT "VendorArrival_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorArrival" ADD CONSTRAINT "VendorArrival_weddingId_vendorId_fkey" FOREIGN KEY ("weddingId", "vendorId") REFERENCES "WeddingVendor"("weddingId", "vendorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorArrival" ADD CONSTRAINT "VendorArrival_functionId_weddingId_fkey" FOREIGN KEY ("functionId", "weddingId") REFERENCES "WeddingFunction"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorArrival" ADD CONSTRAINT "VendorArrival_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleChange" ADD CONSTRAINT "ScheduleChange_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleChange" ADD CONSTRAINT "ScheduleChange_eventId_weddingId_fkey" FOREIGN KEY ("eventId", "weddingId") REFERENCES "TimelineEvent"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleNotification" ADD CONSTRAINT "ScheduleNotification_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleNotification" ADD CONSTRAINT "ScheduleNotification_changeId_weddingId_fkey" FOREIGN KEY ("changeId", "weddingId") REFERENCES "ScheduleChange"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleNotification" ADD CONSTRAINT "ScheduleNotification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleNotification" ADD CONSTRAINT "ScheduleNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE app."Wedding" ADD CONSTRAINT command_timezone_version CHECK (timezone = 'Asia/Kolkata' AND "scheduleVersion" >= 1);
ALTER TABLE app."WeddingVendor" ADD CONSTRAINT association_source CHECK (
  (source = 'QUOTATION' AND "quotationId" IS NOT NULL) OR (source = 'CLIENT_PROVIDED' AND "quotationId" IS NULL)
);
ALTER TABLE app."TimelineEvent" ADD CONSTRAINT timeline_times CHECK (
  "plannedEnd" > "plannedStart" AND version >= 1
  AND ("actualEnd" IS NULL OR ("actualStart" IS NOT NULL AND "actualEnd" >= "actualStart"))
  AND (status <> 'IN_PROGRESS' OR ("actualStart" IS NOT NULL AND "actualEnd" IS NULL))
  AND (status <> 'DONE' OR ("actualStart" IS NOT NULL AND "actualEnd" IS NOT NULL))
);
ALTER TABLE app."EventDependency" ADD CONSTRAINT no_self_dependency CHECK ("eventId" <> "dependsOnId");
ALTER TABLE app."VendorArrival" ADD CONSTRAINT arrival_confirmation_evidence CHECK (
  ("actualAt" IS NULL AND "confirmedBy" IS NULL AND "confirmedAt" IS NULL)
  OR ("actualAt" IS NOT NULL AND "confirmedBy" IS NOT NULL AND "confirmedAt" IS NOT NULL)
);
ALTER TABLE app."Incident" ADD CONSTRAINT incident_resolution_evidence CHECK (
  version >= 1 AND ((status = 'RESOLVED' AND resolution IS NOT NULL AND length(resolution) >= 5 AND "resolvedAt" IS NOT NULL)
  OR (status <> 'RESOLVED' AND "resolvedAt" IS NULL))
);
ALTER TABLE app."ScheduleChange" ADD CONSTRAINT schedule_decision_evidence CHECK (
  "baseScheduleVersion" >= 1 AND "previousEnd" > "previousStart" AND "proposedEnd" > "proposedStart"
  AND (status NOT IN ('APPROVED','PUBLISHED') OR ("approvedBy" IS NOT NULL AND "approvedAt" IS NOT NULL))
  AND (status = 'PROPOSED' OR ("decidedBy" IS NOT NULL AND "decidedAt" IS NOT NULL))
  AND (status <> 'PUBLISHED' OR ("publishedAt" IS NOT NULL AND "publishedVersion" IS NOT NULL))
);
ALTER TABLE app."ScheduleNotification" ADD CONSTRAINT individual_instruction CHECK (
  (("vendorId" IS NOT NULL)::integer + ("userId" IS NOT NULL)::integer) = 1
  AND "instructionVersion" >= 1 AND "deliveryStatus" = 'AVAILABLE_IN_APP'
  AND ((status = 'SENT' AND "acknowledgedAt" IS NULL AND "problemDescription" IS NULL)
    OR (status = 'ACKNOWLEDGED' AND "acknowledgedAt" IS NOT NULL AND "problemDescription" IS NULL)
    OR (status = 'PROBLEM' AND "acknowledgedAt" IS NOT NULL AND "problemDescription" IS NOT NULL AND length("problemDescription") >= 5))
  AND (("tokenHash" IS NULL AND "tokenExpiresAt" IS NULL) OR ("vendorId" IS NOT NULL AND "tokenHash" IS NOT NULL AND "tokenHash" ~ '^[0-9a-f]{64}$' AND "tokenExpiresAt" IS NOT NULL))
);
DO $$ DECLARE name text; browser_role text; BEGIN
  FOREACH name IN ARRAY ARRAY['TimelineEvent','EventVendor','EventDependency','VendorArrival','Incident','ScheduleChange','ScheduleNotification'] LOOP
    EXECUTE format('REVOKE ALL ON app.%I FROM PUBLIC', name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON app.%I TO rk_backend', name);
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', name);
    EXECUTE format('CREATE POLICY backend_only ON app.%I TO rk_backend USING (true) WITH CHECK (true)', name);
    FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated') LOOP
      EXECUTE format('REVOKE ALL ON app.%I FROM %I', name, browser_role);
    END LOOP;
  END LOOP;
END $$;
GRANT DELETE ON app."EventVendor", app."EventDependency" TO rk_backend;

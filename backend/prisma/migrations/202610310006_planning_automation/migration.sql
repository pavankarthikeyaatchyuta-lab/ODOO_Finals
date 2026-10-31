SET search_path = app, public;
-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('CLAIMED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TO_PLAN', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "bookingDepositRequired" DECIMAL(16,2),
ADD COLUMN     "proposalConfirmedAt" TIMESTAMPTZ(3),
ADD COLUMN     "proposalConfirmedBy" UUID,
ADD COLUMN     "proposalStatus" "ProposalStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "BookingPayment" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "BookingPaymentStatus" NOT NULL DEFAULT 'CLAIMED',
    "evidenceDocumentId" UUID,
    "claimedBy" UUID NOT NULL,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskGeneration" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "packageType" "PackageType" NOT NULL,
    "dateBasis" DATE NOT NULL,
    "taskCount" INTEGER NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingTask" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "templateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ownerId" UUID,
    "deadline" TIMESTAMPTZ(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TO_PLAN',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "functionId" UUID,
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WeddingTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingPayment_reference_key" ON "BookingPayment"("reference");

-- CreateIndex
CREATE INDEX "BookingPayment_weddingId_status_idx" ON "BookingPayment"("weddingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskGeneration_weddingId_key" ON "TaskGeneration"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskGeneration_id_weddingId_key" ON "TaskGeneration"("id", "weddingId");

-- CreateIndex
CREATE INDEX "WeddingTask_weddingId_status_deadline_idx" ON "WeddingTask"("weddingId", "status", "deadline");

-- CreateIndex
CREATE INDEX "WeddingTask_ownerId_idx" ON "WeddingTask"("ownerId");

-- CreateIndex
CREATE INDEX "WeddingTask_functionId_weddingId_idx" ON "WeddingTask"("functionId", "weddingId");

-- CreateIndex
CREATE INDEX "WeddingTask_generationId_weddingId_idx" ON "WeddingTask"("generationId", "weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingTask_weddingId_templateKey_key" ON "WeddingTask"("weddingId", "templateKey");

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskGeneration" ADD CONSTRAINT "TaskGeneration_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingTask" ADD CONSTRAINT "WeddingTask_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingTask" ADD CONSTRAINT "WeddingTask_generationId_weddingId_fkey" FOREIGN KEY ("generationId", "weddingId") REFERENCES "TaskGeneration"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingTask" ADD CONSTRAINT "WeddingTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingTask" ADD CONSTRAINT "WeddingTask_functionId_weddingId_fkey" FOREIGN KEY ("functionId", "weddingId") REFERENCES "WeddingFunction"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE app."Wedding" ADD CONSTRAINT proposal_confirmation_evidence CHECK (
  ("proposalStatus" = 'DRAFT' AND "proposalConfirmedAt" IS NULL AND "proposalConfirmedBy" IS NULL AND "bookingDepositRequired" IS NULL)
  OR ("proposalStatus" = 'CONFIRMED' AND "proposalConfirmedAt" IS NOT NULL AND "proposalConfirmedBy" IS NOT NULL AND "bookingDepositRequired" IS NOT NULL AND "bookingDepositRequired" > 0)
);

ALTER TABLE app."BookingPayment" ADD CONSTRAINT payment_review_evidence CHECK (
  amount > 0 AND reference = upper(trim(reference)) AND length(reference) >= 3
  AND currency IN ('INR','USD','EUR','GBP','AED')
  AND ((status = 'CLAIMED' AND "reviewedBy" IS NULL AND "reviewedAt" IS NULL AND "reviewNote" IS NULL)
    OR (status IN ('VERIFIED','REJECTED') AND "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND length("reviewNote") >= 10))
);

ALTER TABLE app."TaskGeneration" ADD CONSTRAINT minimum_template_tasks CHECK ("taskCount" >= 25);

ALTER TABLE app."WeddingTask" ADD CONSTRAINT task_completion_time CHECK ((status = 'DONE') = ("completedAt" IS NOT NULL));

DO $$ DECLARE name text; browser_role text; BEGIN
 FOREACH name IN ARRAY ARRAY['BookingPayment','TaskGeneration','WeddingTask'] LOOP
  EXECUTE format('REVOKE ALL ON app.%I FROM PUBLIC',name);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON app.%I TO rk_backend',name);
  EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('CREATE POLICY backend_only ON app.%I TO rk_backend USING (true) WITH CHECK (true)',name);
  FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated') LOOP
   EXECUTE format('REVOKE ALL ON app.%I FROM %I',name,browser_role);
  END LOOP;
 END LOOP;
END $$;
REVOKE UPDATE ON app."TaskGeneration" FROM rk_backend;

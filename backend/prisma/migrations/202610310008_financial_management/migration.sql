SET search_path = app, public;
-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('CLIENT_RECEIPT', 'VENDOR_DISBURSEMENT');

-- CreateEnum
CREATE TYPE "PaymentMilestone" AS ENUM ('BOOKING', 'ADVANCE', 'FINAL');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentKind" ADD VALUE 'EXPENSE_EVIDENCE';
ALTER TYPE "DocumentKind" ADD VALUE 'VENDOR_BILL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingPaymentStatus" ADD VALUE 'INITIATED';
ALTER TYPE "BookingPaymentStatus" ADD VALUE 'FAILED';
ALTER TYPE "BookingPaymentStatus" ADD VALUE 'REVERSED';

-- AlterTable
ALTER TABLE "WeddingVendor" ADD COLUMN     "contractApprovedAt" TIMESTAMPTZ(3),
ADD COLUMN     "contractApprovedBy" UUID,
ADD COLUMN     "contractNote" TEXT,
ADD COLUMN     "manualContractAmount" DECIMAL(16,2);

-- AlterTable
ALTER TABLE "BookingPayment" ADD COLUMN     "direction" "PaymentDirection" NOT NULL DEFAULT 'CLIENT_RECEIPT',
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "milestone" "PaymentMilestone" NOT NULL DEFAULT 'BOOKING',
ADD COLUMN     "reversalNote" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMPTZ(3),
ADD COLUMN     "reversedBy" UUID,
ADD COLUMN     "verificationMethod" TEXT,
ADD COLUMN     "weddingVendorId" UUID;

-- CreateTable
CREATE TABLE "FinanceSettings" (
    "weddingId" UUID NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "estimatedRevenue" DECIMAL(16,2) NOT NULL,
    "contractedRevenue" DECIMAL(16,2) NOT NULL,
    "estimatedVendorCost" DECIMAL(16,2) NOT NULL,
    "estimatedLabourCost" DECIMAL(16,2) NOT NULL,
    "estimatedOtherDirectCost" DECIMAL(16,2) NOT NULL,
    "recognitionPolicy" TEXT NOT NULL,
    "approvedBy" UUID NOT NULL,
    "approvedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceSettings_pkey" PRIMARY KEY ("weddingId")
);

-- CreateTable
CREATE TABLE "AdditionalExpense" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "weddingVendorId" UUID,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitRate" DECIMAL(16,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "netAmount" DECIMAL(16,2) NOT NULL,
    "taxAmount" DECIMAL(16,2) NOT NULL,
    "total" DECIMAL(16,2) NOT NULL,
    "clientCharge" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "supportingDocumentId" UUID,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" UUID NOT NULL,
    "clientApprovedBy" UUID,
    "clientApprovedAt" TIMESTAMPTZ(3),
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdditionalExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBill" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "weddingVendorId" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "documentId" UUID,
    "submittedBy" UUID NOT NULL,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMPTZ(3),
    "verificationNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueRecognition" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "recognizedAt" TIMESTAMPTZ(3) NOT NULL,
    "policy" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "postedBy" UUID NOT NULL,
    "reversedBy" UUID,
    "reversedAt" TIMESTAMPTZ(3),
    "reversalNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMilestone" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "milestone" "PaymentMilestone" NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "approvedBy" UUID NOT NULL,
    "approvedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourRate" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hourlyRate" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "effectiveFrom" TIMESTAMPTZ(3) NOT NULL,
    "approvedBy" UUID NOT NULL,
    "approvedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourEntry" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rateId" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "workedAt" TIMESTAMPTZ(3) NOT NULL,
    "hours" DECIMAL(8,3) NOT NULL,
    "hourlyRate" DECIMAL(16,2) NOT NULL,
    "cost" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "submittedBy" UUID NOT NULL,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdditionalExpense_weddingVendorId_weddingId_idx" ON "AdditionalExpense"("weddingVendorId", "weddingId");

-- CreateIndex
CREATE INDEX "AdditionalExpense_weddingId_status_idx" ON "AdditionalExpense"("weddingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdditionalExpense_weddingId_reference_key" ON "AdditionalExpense"("weddingId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBill_weddingVendorId_key" ON "VendorBill"("weddingVendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBill_reference_key" ON "VendorBill"("reference");

-- CreateIndex
CREATE INDEX "VendorBill_weddingId_dueAt_idx" ON "VendorBill"("weddingId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBill_weddingVendorId_weddingId_key" ON "VendorBill"("weddingVendorId", "weddingId");

-- CreateIndex
CREATE INDEX "RevenueRecognition_weddingId_recognizedAt_idx" ON "RevenueRecognition"("weddingId", "recognizedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueRecognition_weddingId_reference_key" ON "RevenueRecognition"("weddingId", "reference");

-- CreateIndex
CREATE INDEX "ClientMilestone_weddingId_dueAt_idx" ON "ClientMilestone"("weddingId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMilestone_weddingId_milestone_key" ON "ClientMilestone"("weddingId", "milestone");

-- CreateIndex
CREATE UNIQUE INDEX "LabourRate_userId_currency_effectiveFrom_key" ON "LabourRate"("userId", "currency", "effectiveFrom");

-- CreateIndex
CREATE INDEX "LabourEntry_rateId_idx" ON "LabourEntry"("rateId");

-- CreateIndex
CREATE INDEX "LabourEntry_userId_workedAt_idx" ON "LabourEntry"("userId", "workedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabourEntry_weddingId_reference_key" ON "LabourEntry"("weddingId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingVendor_id_weddingId_key" ON "WeddingVendor"("id", "weddingId");

-- CreateIndex
CREATE INDEX "BookingPayment_weddingVendorId_weddingId_idx" ON "BookingPayment"("weddingVendorId", "weddingId");

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_weddingVendorId_weddingId_fkey" FOREIGN KEY ("weddingVendorId", "weddingId") REFERENCES "WeddingVendor"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSettings" ADD CONSTRAINT "FinanceSettings_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalExpense" ADD CONSTRAINT "AdditionalExpense_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalExpense" ADD CONSTRAINT "AdditionalExpense_weddingVendorId_weddingId_fkey" FOREIGN KEY ("weddingVendorId", "weddingId") REFERENCES "WeddingVendor"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalExpense" ADD CONSTRAINT "AdditionalExpense_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_weddingVendorId_weddingId_fkey" FOREIGN KEY ("weddingVendorId", "weddingId") REFERENCES "WeddingVendor"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueRecognition" ADD CONSTRAINT "RevenueRecognition_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMilestone" ADD CONSTRAINT "ClientMilestone_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourRate" ADD CONSTRAINT "LabourRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourEntry" ADD CONSTRAINT "LabourEntry_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourEntry" ADD CONSTRAINT "LabourEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourEntry" ADD CONSTRAINT "LabourEntry_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "LabourRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Financial invariants enforced in the database as well as the API.
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_vendor_shape" CHECK (("direction" = 'VENDOR_DISBURSEMENT') = ("weddingVendorId" IS NOT NULL) AND NOT ("direction" = 'VENDOR_DISBURSEMENT' AND "milestone" = 'BOOKING'));
ALTER TABLE "AdditionalExpense" ADD CONSTRAINT "AdditionalExpense_amounts" CHECK ("quantity" > 0 AND "unitRate" >= 0 AND "taxRate" BETWEEN 0 AND 100 AND "netAmount" >= 0 AND "taxAmount" >= 0 AND "total" = "netAmount" + "taxAmount" AND "clientCharge" >= 0);
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_amount" CHECK ("amount" > 0);
ALTER TABLE "RevenueRecognition" ADD CONSTRAINT "RevenueRecognition_amount" CHECK ("amount" > 0);
ALTER TABLE "ClientMilestone" ADD CONSTRAINT "ClientMilestone_amount" CHECK ("amount" > 0);
ALTER TABLE "LabourRate" ADD CONSTRAINT "LabourRate_amount" CHECK ("hourlyRate" > 0);
ALTER TABLE "LabourEntry" ADD CONSTRAINT "LabourEntry_amounts" CHECK ("hours" > 0 AND "hours" <= 24 AND "cost" >= 0);
ALTER TABLE "FinanceSettings" ADD CONSTRAINT "FinanceSettings_amounts" CHECK ("estimatedRevenue" >= 0 AND "contractedRevenue" > 0 AND "estimatedVendorCost" >= 0 AND "estimatedLabourCost" >= 0 AND "estimatedOtherDirectCost" >= 0);
DO $$ DECLARE name text; browser_role text; BEGIN
  FOREACH name IN ARRAY ARRAY['FinanceSettings','AdditionalExpense','VendorBill','RevenueRecognition','ClientMilestone','LabourRate','LabourEntry'] LOOP
    EXECUTE format('REVOKE ALL ON app.%I FROM PUBLIC', name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON app.%I TO rk_backend', name);
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', name);
    EXECUTE format('CREATE POLICY backend_only ON app.%I TO rk_backend USING (true) WITH CHECK (true)', name);
    FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated') LOOP
      EXECUTE format('REVOKE ALL ON app.%I FROM %I', name, browser_role);
    END LOOP;
  END LOOP;
END $$;
-- Extend the Phase 3 review-evidence rule to the new lifecycle states (text compare: new enum values are unusable in this transaction).
ALTER TABLE app."BookingPayment" DROP CONSTRAINT payment_review_evidence;
ALTER TABLE app."BookingPayment" ADD CONSTRAINT payment_review_evidence CHECK (
  amount > 0 AND reference = upper(trim(reference)) AND length(reference) >= 3
  AND currency IN ('INR','USD','EUR','GBP','AED')
  AND ((status::text IN ('INITIATED','CLAIMED') AND "reviewedBy" IS NULL AND "reviewedAt" IS NULL AND "reviewNote" IS NULL AND "reversedAt" IS NULL)
    OR (status::text IN ('VERIFIED','REJECTED','FAILED') AND "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND length("reviewNote") >= 10 AND "reversedAt" IS NULL)
    OR (status::text = 'REVERSED' AND "reviewedBy" IS NOT NULL AND "reversedBy" IS NOT NULL AND "reversedAt" IS NOT NULL AND length("reversalNote") >= 10))
);

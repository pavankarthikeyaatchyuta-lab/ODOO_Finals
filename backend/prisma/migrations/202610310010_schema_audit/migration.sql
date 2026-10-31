BEGIN;
SET search_path = app, public;

-- Replace the review rule without changing rows: incomplete reversal evidence must not pass via SQL NULL semantics.
ALTER TABLE "BookingPayment" DROP CONSTRAINT payment_review_evidence;
ALTER TABLE "BookingPayment" ADD CONSTRAINT payment_review_evidence CHECK (
  amount > 0 AND reference = upper(trim(reference)) AND length(reference) >= 3
  AND currency IN ('INR','USD','EUR','GBP','AED')
  AND ((status::text IN ('INITIATED','CLAIMED') AND "reviewedBy" IS NULL AND "reviewedAt" IS NULL AND "reviewNote" IS NULL AND "verificationMethod" IS NULL AND "reversedAt" IS NULL AND "reversedBy" IS NULL AND "reversalNote" IS NULL)
    OR (status::text IN ('VERIFIED','REJECTED','FAILED') AND "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND length("reviewNote") >= 10 AND "reversedAt" IS NULL AND "reversedBy" IS NULL AND "reversalNote" IS NULL)
    OR (status::text = 'REVERSED' AND "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND length("reviewNote") >= 10
      AND "reversedBy" IS NOT NULL AND "reversedAt" IS NOT NULL AND "reversalNote" IS NOT NULL AND length("reversalNote") >= 10))
);
-- DropForeignKey
ALTER TABLE "Agreement" DROP CONSTRAINT "Agreement_documentId_fkey";

-- DropForeignKey
ALTER TABLE "Agreement" DROP CONSTRAINT "Agreement_signedDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "BookingPayment" DROP CONSTRAINT "BookingPayment_evidenceDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "AdditionalExpense" DROP CONSTRAINT "AdditionalExpense_supportingDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "VendorBill" DROP CONSTRAINT "VendorBill_documentId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Document_id_weddingId_key" ON "Document"("id", "weddingId");

-- CreateIndex
CREATE INDEX "Agreement_documentId_weddingId_idx" ON "Agreement"("documentId", "weddingId");

-- CreateIndex
CREATE INDEX "Agreement_signedDocumentId_weddingId_idx" ON "Agreement"("signedDocumentId", "weddingId");

-- CreateIndex
CREATE INDEX "QuotationRound_categoryCode_idx" ON "QuotationRound"("categoryCode");

-- CreateIndex
CREATE INDEX "QuotationRequest_vendorId_idx" ON "QuotationRequest"("vendorId");

-- CreateIndex
CREATE INDEX "WeddingVendor_categoryCode_idx" ON "WeddingVendor"("categoryCode");

-- CreateIndex
CREATE INDEX "TimelineEvent_functionId_weddingId_idx" ON "TimelineEvent"("functionId", "weddingId");

-- CreateIndex
CREATE INDEX "VendorArrival_functionId_weddingId_idx" ON "VendorArrival"("functionId", "weddingId");

-- CreateIndex
CREATE INDEX "ScheduleChange_eventId_weddingId_idx" ON "ScheduleChange"("eventId", "weddingId");

-- CreateIndex
CREATE INDEX "ScheduleNotification_vendorId_idx" ON "ScheduleNotification"("vendorId");

-- CreateIndex
CREATE INDEX "ScheduleNotification_userId_idx" ON "ScheduleNotification"("userId");

-- CreateIndex
CREATE INDEX "BookingPayment_evidenceDocumentId_weddingId_idx" ON "BookingPayment"("evidenceDocumentId", "weddingId");

-- CreateIndex
CREATE INDEX "AdditionalExpense_supportingDocumentId_weddingId_idx" ON "AdditionalExpense"("supportingDocumentId", "weddingId");

-- CreateIndex
CREATE INDEX "VendorBill_documentId_weddingId_idx" ON "VendorBill"("documentId", "weddingId");

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_documentId_weddingId_fkey" FOREIGN KEY ("documentId", "weddingId") REFERENCES "Document"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_signedDocumentId_weddingId_fkey" FOREIGN KEY ("signedDocumentId", "weddingId") REFERENCES "Document"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_evidenceDocumentId_weddingId_fkey" FOREIGN KEY ("evidenceDocumentId", "weddingId") REFERENCES "Document"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalExpense" ADD CONSTRAINT "AdditionalExpense_supportingDocumentId_weddingId_fkey" FOREIGN KEY ("supportingDocumentId", "weddingId") REFERENCES "Document"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_documentId_weddingId_fkey" FOREIGN KEY ("documentId", "weddingId") REFERENCES "Document"("id", "weddingId") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;

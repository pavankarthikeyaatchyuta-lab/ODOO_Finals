SET search_path = app, public;

-- These records have no update workflow; revisions require a new reviewed rate/policy phase.
REVOKE UPDATE ON "FinanceSettings", "LabourRate" FROM rk_backend;

ALTER TABLE "AdditionalExpense" ADD CONSTRAINT expense_calculation_and_approval CHECK (
  "netAmount" = round(quantity * "unitRate", 2)
  AND "taxAmount" = round("netAmount" * "taxRate" / 100, 2)
  AND currency IN ('INR','USD','EUR','GBP','AED')
  AND ((status = 'PENDING' AND "reviewedBy" IS NULL AND "reviewedAt" IS NULL AND "reviewNote" IS NULL)
    OR (status <> 'PENDING' AND "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND length("reviewNote") >= 10))
  AND (status <> 'APPROVED' OR "clientCharge" = 0 OR ("clientApprovedBy" IS NOT NULL AND "clientApprovedAt" IS NOT NULL))
);

ALTER TABLE "LabourEntry" ADD CONSTRAINT labour_calculation_and_approval CHECK (
  "cost" = round(hours * "hourlyRate", 2) AND "hourlyRate" > 0
  AND currency IN ('INR','USD','EUR','GBP','AED')
  AND ((status = 'PENDING' AND "reviewedBy" IS NULL AND "reviewedAt" IS NULL AND "reviewNote" IS NULL)
    OR (status <> 'PENDING' AND "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND length("reviewNote") >= 10))
);

ALTER TABLE "WeddingVendor" ADD CONSTRAINT manual_vendor_contract_evidence CHECK (
  ("manualContractAmount" IS NULL AND "contractApprovedBy" IS NULL AND "contractApprovedAt" IS NULL AND "contractNote" IS NULL)
  OR ("quotationId" IS NULL AND "manualContractAmount" IS NOT NULL AND "manualContractAmount" >= 0
    AND "contractApprovedBy" IS NOT NULL AND "contractApprovedAt" IS NOT NULL AND "contractNote" IS NOT NULL AND length("contractNote") >= 10)
);

ALTER TABLE "VendorBill" ADD CONSTRAINT bill_verification_evidence CHECK (
  currency IN ('INR','USD','EUR','GBP','AED')
  AND (("verifiedAt" IS NULL AND "verifiedBy" IS NULL AND "verificationNote" IS NULL)
    OR ("verifiedAt" IS NOT NULL AND "verifiedBy" IS NOT NULL AND "verificationNote" IS NOT NULL AND length("verificationNote") >= 10))
);

ALTER TABLE "RevenueRecognition" ADD CONSTRAINT revenue_reversal_evidence CHECK (
  ("reversedAt" IS NULL AND "reversedBy" IS NULL AND "reversalNote" IS NULL)
  OR ("reversedAt" IS NOT NULL AND "reversedBy" IS NOT NULL AND "reversalNote" IS NOT NULL AND length("reversalNote") >= 10)
);

ALTER TABLE "FinanceSettings" ADD CONSTRAINT finance_policy_valid CHECK (
  currency IN ('INR','USD','EUR','GBP','AED') AND length("recognitionPolicy") >= 10
);
ALTER TABLE "LabourRate" ADD CONSTRAINT labour_currency_valid CHECK (currency IN ('INR','USD','EUR','GBP','AED'));

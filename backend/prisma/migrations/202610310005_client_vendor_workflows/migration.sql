SET search_path = app, public;
-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'CONTACTED', 'FOLLOW_UP_DUE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNATURE_SUBMITTED', 'SIGNED');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('AGREEMENT', 'SIGNED_AGREEMENT', 'FLOOR_PLAN', 'PAYMENT_EVIDENCE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "QuotationRoundStatus" AS ENUM ('OPEN', 'SELECTED');

-- CreateEnum
CREATE TYPE "QuotationRequestStatus" AS ENUM ('REQUESTED', 'SUBMITTED', 'SELECTED', 'CLOSED');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "requirements" TEXT;

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "coupleDetails" TEXT,
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "requirements" TEXT;

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "assignedToId" UUID,
ADD COLUMN     "followUpAt" TIMESTAMPTZ(3),
ADD COLUMN     "followUpStatus" "FollowUpStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT,
    "uploadedBy" UUID NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "documentId" UUID,
    "signedDocumentId" UUID,
    "sentAt" TIMESTAMPTZ(3),
    "claimedSignedAt" TIMESTAMPTZ(3),
    "signedAt" TIMESTAMPTZ(3),
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCategory" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "VendorCategory_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceDetails" TEXT NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRound" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "QuotationRoundStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRequest" (
    "id" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "status" "QuotationRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "closedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "pricePerPlate" DECIMAL(16,2) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "additionalHourRate" DECIMAL(16,2) NOT NULL,
    "additionalHours" DECIMAL(8,2) NOT NULL,
    "menuDetails" TEXT NOT NULL,
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "total" DECIMAL(16,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(16,2) NOT NULL,
    "total" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingVendor" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "quotationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeddingVendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_storagePath_key" ON "Document"("storagePath");

-- CreateIndex
CREATE INDEX "Document_weddingId_kind_idx" ON "Document"("weddingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_weddingId_key" ON "Agreement"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCategory_name_key" ON "VendorCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE INDEX "Vendor_categoryCode_name_idx" ON "Vendor"("categoryCode", "name");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationRound_weddingId_categoryCode_key" ON "QuotationRound"("weddingId", "categoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationRequest_roundId_vendorId_key" ON "QuotationRequest"("roundId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_requestId_key" ON "Quotation"("requestId");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingVendor_quotationId_key" ON "WeddingVendor"("quotationId");

-- CreateIndex
CREATE INDEX "WeddingVendor_vendorId_idx" ON "WeddingVendor"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingVendor_weddingId_categoryCode_key" ON "WeddingVendor"("weddingId", "categoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingFunction_id_weddingId_key" ON "WeddingFunction"("id", "weddingId");

-- CreateIndex
CREATE INDEX "Enquiry_assignedToId_idx" ON "Enquiry"("assignedToId");

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_signedDocumentId_fkey" FOREIGN KEY ("signedDocumentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "VendorCategory"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRound" ADD CONSTRAINT "QuotationRound_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRound" ADD CONSTRAINT "QuotationRound_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "VendorCategory"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRequest" ADD CONSTRAINT "QuotationRequest_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuotationRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRequest" ADD CONSTRAINT "QuotationRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuotationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendor" ADD CONSTRAINT "WeddingVendor_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendor" ADD CONSTRAINT "WeddingVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendor" ADD CONSTRAINT "WeddingVendor_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "VendorCategory"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendor" ADD CONSTRAINT "WeddingVendor_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reference data is part of the migration, not a production demo seed.
INSERT INTO app."VendorCategory" (code, name) VALUES
('CATERING', 'Catering'), ('DECOR', 'Decor'), ('PHOTOGRAPHY', 'Photography'),
('VIDEOGRAPHY', 'Videography'), ('DJ_SOUND', 'DJ and sound'), ('LIGHTING', 'Lighting'),
('MAKEUP', 'Makeup'), ('MEHENDI', 'Mehendi artists'), ('VENUE', 'Venue'),
('TRANSPORT', 'Transport'), ('HOSPITALITY', 'Hospitality'), ('ENTERTAINMENT', 'Entertainment'),
('FLORAL', 'Floral arrangements'), ('INVITATIONS', 'Invitations'), ('GIFTS', 'Gifts'),
('SECURITY', 'Security'), ('RENTALS', 'Equipment rentals'), ('OTHER', 'Other services');
CREATE UNIQUE INDEX one_selected_request_per_round ON app."QuotationRequest" ("roundId") WHERE status = 'SELECTED';

ALTER TABLE app."Wedding" ADD CONSTRAINT wedding_currency CHECK (currency IN ('INR','USD','EUR','GBP','AED'));

ALTER TABLE app."Document" ADD CONSTRAINT document_valid_upload CHECK (
  size BETWEEN 1 AND 10485760 AND "contentType" IN ('application/pdf','image/jpeg','image/png')
  AND ((status = 'PENDING' AND sha256 IS NULL AND "verifiedAt" IS NULL)
    OR (status = 'VERIFIED' AND sha256 IS NOT NULL AND sha256 ~ '^[0-9a-f]{64}$' AND "verifiedAt" IS NOT NULL))
);

ALTER TABLE app."Agreement" ADD CONSTRAINT agreement_signature_evidence CHECK (
  (status <> 'SIGNED' OR ("signedDocumentId" IS NOT NULL AND "signedAt" IS NOT NULL AND "verifiedBy" IS NOT NULL AND "verifiedAt" IS NOT NULL AND "reviewNote" IS NOT NULL AND length("reviewNote") >= 10))
  AND (status <> 'SIGNATURE_SUBMITTED' OR ("signedDocumentId" IS NOT NULL AND "claimedSignedAt" IS NOT NULL))
  AND (status = 'DRAFT' OR ("documentId" IS NOT NULL AND "sentAt" IS NOT NULL))
);

ALTER TABLE app."Vendor" ADD CONSTRAINT vendor_normalized_email CHECK (email = lower(email));

ALTER TABLE app."Quotation" ADD CONSTRAINT quotation_valid_values CHECK (
  "pricePerPlate" >= 0 AND "guestCount" >= 0 AND "additionalHourRate" >= 0 AND "additionalHours" >= 0 AND total > 0
);

ALTER TABLE app."QuotationItem" ADD CONSTRAINT quotation_item_total CHECK (quantity > 0 AND "unitPrice" >= 0 AND total = round(quantity * "unitPrice", 2));

DO $$ DECLARE name text; browser_role text; BEGIN
 FOREACH name IN ARRAY ARRAY['Document','Agreement','VendorCategory','Vendor','QuotationRound','QuotationRequest','Quotation','QuotationItem','WeddingVendor'] LOOP
  EXECUTE format('REVOKE ALL ON app.%I FROM PUBLIC',name);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE ON app.%I TO rk_backend',name);
  EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('CREATE POLICY backend_only ON app.%I TO rk_backend USING (true) WITH CHECK (true)',name);
  FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated') LOOP
   EXECUTE format('REVOKE ALL ON app.%I FROM %I',name,browser_role);
  END LOOP;
 END LOOP;
END $$;
GRANT DELETE ON app."QuotationItem" TO rk_backend;
REVOKE INSERT, UPDATE ON app."VendorCategory" FROM rk_backend;

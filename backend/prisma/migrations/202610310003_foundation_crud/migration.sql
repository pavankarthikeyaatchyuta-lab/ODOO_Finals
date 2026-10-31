SET search_path = app, public;

-- CreateEnum
CREATE TYPE "WeddingFunctionType" AS ENUM ('MEHENDI', 'SANGEET', 'RECEPTION');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "archivedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "archivedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "WeddingFunction" (
    "id" UUID NOT NULL,
    "weddingId" UUID NOT NULL,
    "type" "WeddingFunctionType" NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3),
    "endAt" TIMESTAMPTZ(3),
    "venue" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WeddingFunction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeddingFunction_weddingId_name_key" ON "WeddingFunction"("weddingId", "name");

-- AddForeignKey
ALTER TABLE "WeddingFunction" ADD CONSTRAINT "WeddingFunction_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE app."WeddingFunction" ADD CONSTRAINT function_valid_times CHECK (
  ("startAt" IS NULL AND "endAt" IS NULL) OR ("startAt" IS NOT NULL AND "endAt" IS NOT NULL AND "endAt" > "startAt")
);
REVOKE ALL ON app."WeddingFunction" FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON app."WeddingFunction" TO rk_backend;
ALTER TABLE app."WeddingFunction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_only ON app."WeddingFunction" TO rk_backend USING (true) WITH CHECK (true);
DO $$ DECLARE browser_role text; BEGIN
  FOR browser_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
    EXECUTE format('REVOKE ALL ON app."WeddingFunction" FROM %I', browser_role);
  END LOOP;
END $$;

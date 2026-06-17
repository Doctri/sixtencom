DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatus') THEN
    CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VatRate') THEN
    CREATE TYPE "VatRate" AS ENUM ('EXEMPT', 'VAT_0', 'VAT_5', 'VAT_19');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sku" TEXT,
  "barcode" TEXT,
  "category" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'UND',
  "vatRate" "VatRate" NOT NULL DEFAULT 'VAT_19',
  "priceCents" INTEGER NOT NULL,
  "costCents" INTEGER NOT NULL DEFAULT 0,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "minStock" INTEGER NOT NULL DEFAULT 0,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_businessId_sku_key" ON "products"("businessId", "sku");
CREATE UNIQUE INDEX IF NOT EXISTS "products_businessId_barcode_key" ON "products"("businessId", "barcode");
CREATE INDEX IF NOT EXISTS "products_businessId_idx" ON "products"("businessId");
CREATE INDEX IF NOT EXISTS "products_businessId_status_idx" ON "products"("businessId", "status");

ALTER TABLE "products"
DROP CONSTRAINT IF EXISTS "products_businessId_fkey";

ALTER TABLE "products"
ADD CONSTRAINT "products_businessId_fkey"
FOREIGN KEY ("businessId")
REFERENCES "businesses"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

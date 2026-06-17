CREATE TYPE IF NOT EXISTS "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE IF NOT EXISTS "VatRate" AS ENUM ('EXEMPT', 'VAT_0', 'VAT_5', 'VAT_19');

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

ALTER TABLE IF EXISTS "products"
  ADD CONSTRAINT IF NOT EXISTS "products_businessId_fkey"
  FOREIGN KEY ("businessId")
  REFERENCES "businesses"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

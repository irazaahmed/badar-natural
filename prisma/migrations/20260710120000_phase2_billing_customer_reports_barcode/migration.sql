-- AlterEnum
ALTER TYPE "CustomerEntryType" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "creditLimit" DECIMAL(65,30),
ADD COLUMN     "discountPercent" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "defaultPackWeightGrams" INTEGER;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "costPerKgAtSale" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "CustomerItemRate" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "ratePerKg" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerItemRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "thankYouMessage" TEXT NOT NULL DEFAULT 'Shukriya! Aap ke bharosay ka shukriya — Badar Natural Foods',
    "sharePrefillText" TEXT NOT NULL DEFAULT 'Assalam-o-Alaikum, aap ka invoice attached hai. Shukriya — Badar Natural Foods',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerItemRate_customerId_idx" ON "CustomerItemRate"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerItemRate_customerId_itemId_key" ON "CustomerItemRate"("customerId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_barcode_key" ON "Item"("barcode");

-- AddForeignKey
ALTER TABLE "CustomerItemRate" ADD CONSTRAINT "CustomerItemRate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerItemRate" ADD CONSTRAINT "CustomerItemRate_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;


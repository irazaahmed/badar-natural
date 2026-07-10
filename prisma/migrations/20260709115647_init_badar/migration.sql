-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('GRAM', 'ML');

-- CreateEnum
CREATE TYPE "SupplierEntryType" AS ENUM ('PURCHASE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('WHOLESALE', 'RETAIL_REGULAR');

-- CreateEnum
CREATE TYPE "CustomerEntryType" AS ENUM ('SALE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CREDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "SaleChannel" AS ENUM ('RETAIL', 'WHOLESALE');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "baseUnit" "BaseUnit" NOT NULL DEFAULT 'GRAM',
    "currentStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "retailPricePerKg" DECIMAL(65,30) NOT NULL,
    "wholesalePricePerKg" DECIMAL(65,30) NOT NULL,
    "lastPurchasePricePerKg" DECIMAL(65,30),
    "bagWeightKg" DECIMAL(65,30),
    "lowStockThreshold" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "totalPayable" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierLedgerEntry" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "paymentId" TEXT,
    "type" "SupplierEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "type" "CustomerType" NOT NULL DEFAULT 'WHOLESALE',
    "totalReceivable" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerLedgerEntry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "saleId" TEXT,
    "paymentId" TEXT,
    "type" "CustomerEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'CASH',
    "creditDays" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityKg" DECIMAL(65,30) NOT NULL,
    "ratePerKg" DECIMAL(65,30) NOT NULL,
    "lineTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "channel" "SaleChannel" NOT NULL,
    "customerId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'CASH',
    "creditDays" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityGrams" DECIMAL(65,30) NOT NULL,
    "quantityLabel" TEXT NOT NULL,
    "ratePerKg" DECIMAL(65,30) NOT NULL,
    "lineTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "supplierId" TEXT,
    "customerId" TEXT,
    "purchaseId" TEXT,
    "saleId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE INDEX "SupplierLedgerEntry_supplierId_createdAt_idx" ON "SupplierLedgerEntry"("supplierId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "CustomerLedgerEntry_customerId_createdAt_idx" ON "CustomerLedgerEntry"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_invoiceNumber_key" ON "Purchase"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNumber_key" ON "Sale"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Sale_channel_createdAt_idx" ON "Sale"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Payment_direction_createdAt_idx" ON "Payment"("direction", "createdAt");

-- AddForeignKey
ALTER TABLE "SupplierLedgerEntry" ADD CONSTRAINT "SupplierLedgerEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLedgerEntry" ADD CONSTRAINT "CustomerLedgerEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

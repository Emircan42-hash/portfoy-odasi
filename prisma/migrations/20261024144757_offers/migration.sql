-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "agentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_roomId_idx" ON "Offer"("roomId");

-- CreateIndex
CREATE INDEX "Offer_propertyId_idx" ON "Offer"("propertyId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

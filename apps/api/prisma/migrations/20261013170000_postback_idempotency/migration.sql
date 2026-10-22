-- Existing historical rows keep NULL; do not reset or deduplicate old data.
ALTER TABLE "Conversion" ADD COLUMN "externalId" TEXT;
CREATE UNIQUE INDEX "Conversion_externalId_key" ON "Conversion"("externalId");

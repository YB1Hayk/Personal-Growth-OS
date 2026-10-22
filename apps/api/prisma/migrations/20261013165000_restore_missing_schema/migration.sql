-- Restore changes that existed only in dev.db; preserve legacy Lead.contact as handle.
-- AlterTable
ALTER TABLE "Project" ADD COLUMN "brandVoice" TEXT;
ALTER TABLE "Project" ADD COLUMN "dna" TEXT;
ALTER TABLE "Project" ADD COLUMN "planGenerationDay" INTEGER;
ALTER TABLE "Project" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Project" ADD COLUMN "tgBotToken" TEXT;
ALTER TABLE "Project" ADD COLUMN "tgChatId" TEXT;

-- CreateTable
CREATE TABLE "MarketInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketInsight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Integration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" DATETIME,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentPost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutreachTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OutreachTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutreachLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutreachLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OutreachTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reactions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentMetrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ContentPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ContentMetrics" ("clicks", "collectedAt", "id", "platform", "postId", "reactions", "views") SELECT "clicks", "collectedAt", "id", "platform", "postId", "reactions", "views" FROM "ContentMetrics";
DROP TABLE "ContentMetrics";
ALTER TABLE "new_ContentMetrics" RENAME TO "ContentMetrics";
CREATE UNIQUE INDEX "ContentMetrics_postId_key" ON "ContentMetrics"("postId");
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "lastContact" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Lead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("createdAt", "id", "name", "projectId", "source", "status", "handle") SELECT "createdAt", "id", "name", "projectId", "source", "status", "contact" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE TABLE "new_LeadContentTouch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "result" TEXT,
    "touchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadContentTouch_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadContentTouch_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ContentPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LeadContentTouch" ("id", "leadId", "postId", "result", "touchedAt") SELECT "id", "leadId", "postId", "result", "touchedAt" FROM "LeadContentTouch";
DROP TABLE "LeadContentTouch";
ALTER TABLE "new_LeadContentTouch" RENAME TO "LeadContentTouch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


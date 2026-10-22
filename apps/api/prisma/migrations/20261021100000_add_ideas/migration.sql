CREATE TABLE "Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "expectedImpact" TEXT,
    "effort" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'INBOX',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Idea_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Idea_projectId_status_createdAt_idx" ON "Idea"("projectId", "status", "createdAt");
ALTER TABLE "Project" ADD COLUMN "currentFocus" TEXT;

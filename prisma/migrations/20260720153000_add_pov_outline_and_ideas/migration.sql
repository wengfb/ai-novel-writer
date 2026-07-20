-- Project: 叙事人称
ALTER TABLE "Project" ADD COLUMN "pov" TEXT NOT NULL DEFAULT 'third_person';

-- Outline: 戏剧结构与因果链
ALTER TABLE "Outline" ADD COLUMN "act" INTEGER;
ALTER TABLE "Outline" ADD COLUMN "causalFrom" TEXT;
ALTER TABLE "Outline" ADD COLUMN "causalTo" TEXT;

-- 创意中心（直接按当前 schema 建表；旧库从未有过 Idea 表）
CREATE TABLE IF NOT EXISTS "Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "worldBuilding" TEXT NOT NULL,
    "protagonist" TEXT NOT NULL,
    "coreConflict" TEXT NOT NULL,
    "mainGoal" TEXT NOT NULL,
    "highConcept" TEXT NOT NULL,
    "sublimation" TEXT NOT NULL,
    "openingHook" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "convertedToProjectId" TEXT,
    "rating" INTEGER,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Idea_status_idx" ON "Idea"("status");
CREATE INDEX IF NOT EXISTS "Idea_genre_idx" ON "Idea"("genre");
CREATE INDEX IF NOT EXISTS "Idea_rating_idx" ON "Idea"("rating");
CREATE INDEX IF NOT EXISTS "Idea_createdAt_idx" ON "Idea"("createdAt");
CREATE INDEX IF NOT EXISTS "Idea_aiGenerated_idx" ON "Idea"("aiGenerated");

CREATE TABLE IF NOT EXISTS "IdeaComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ideaId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdeaComment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "IdeaComment_ideaId_idx" ON "IdeaComment"("ideaId");

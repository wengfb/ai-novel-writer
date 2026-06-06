-- Simplify rating: drop IdeaRating table, replace avgRating+ratingCount with a single rating Int field

-- 1. Add new rating column
ALTER TABLE "Idea" ADD COLUMN "rating" INTEGER;

-- 2. Migrate existing data: round avgRating to nearest integer
UPDATE "Idea" SET "rating" = CAST(ROUND("avgRating") AS INTEGER) WHERE "avgRating" > 0;

-- 3. Drop unused columns
CREATE TABLE "new_Idea" (
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

INSERT INTO "new_Idea" ("id", "title", "genre", "worldBuilding", "protagonist", "coreConflict", "mainGoal", "highConcept", "sublimation", "openingHook", "source", "status", "convertedToProjectId", "rating", "commentCount", "aiGenerated", "createdAt", "updatedAt")
SELECT "id", "title", "genre", "worldBuilding", "protagonist", "coreConflict", "mainGoal", "highConcept", "sublimation", "openingHook", "source", "status", "convertedToProjectId", "rating", "commentCount", "aiGenerated", "createdAt", "updatedAt" FROM "Idea";

DROP TABLE "Idea";
ALTER TABLE "new_Idea" RENAME TO "Idea";

-- 4. Create indexes
CREATE INDEX "Idea_status_idx" ON "Idea"("status");
CREATE INDEX "Idea_genre_idx" ON "Idea"("genre");
CREATE INDEX "Idea_rating_idx" ON "Idea"("rating");
CREATE INDEX "Idea_createdAt_idx" ON "Idea"("createdAt");
CREATE INDEX "Idea_aiGenerated_idx" ON "Idea"("aiGenerated");

-- 5. Drop IdeaRating table
DROP TABLE IF EXISTS "IdeaRating";

-- 6. Drop old indexes (if they still exist by the old names)
DROP INDEX IF EXISTS "Idea_avgRating_idx";

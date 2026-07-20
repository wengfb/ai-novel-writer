-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT NOT NULL,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "coverImage" TEXT,
    "totalWords" INTEGER NOT NULL DEFAULT 0,
    "chapterCount" INTEGER NOT NULL DEFAULT 0,
    "outlineMode" TEXT NOT NULL DEFAULT 'full',
    "planningRange" INTEGER DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Outline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetWords" INTEGER,
    "planningMode" TEXT NOT NULL DEFAULT 'full',
    "planningRange" INTEGER,
    "isFlexible" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER NOT NULL DEFAULT 5,
    "emotionalGoal" TEXT,
    "plotFunction" TEXT NOT NULL DEFAULT '推进',
    "tensionLevel" INTEGER NOT NULL DEFAULT 5,
    "parentId" TEXT,
    "chapterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Outline_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Outline" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Outline_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "notes" TEXT,
    "isKeyChapter" BOOLEAN NOT NULL DEFAULT false,
    "plotType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "characters" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scene_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "role" TEXT NOT NULL DEFAULT 'supporting',
    "appearance" TEXT,
    "personality" TEXT,
    "backstory" TEXT,
    "motivation" TEXT,
    "dialogueStyle" TEXT,
    "relationships" TEXT,
    "characterArc" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attributes" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "scope" TEXT NOT NULL DEFAULT 'local',
    "category" TEXT NOT NULL DEFAULT 'detail',
    "isEvolvable" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "constraints" TEXT,
    "exceptions" TEXT,
    "evolutionSpace" TEXT,
    "relatedTo" TEXT,
    "references" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorldElement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldElement_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WorldElement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "output" TEXT NOT NULL,
    "tokensUsed" TEXT,
    "cost" REAL,
    "duration" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Generation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Foreshadowing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "plantedInChapterId" TEXT,
    "plantedContent" TEXT,
    "plantedAt" DATETIME,
    "expectedChapterNumber" INTEGER,
    "resolvedInChapterId" TEXT,
    "resolvedContent" TEXT,
    "resolvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "relatedCharacters" TEXT,
    "relatedElements" TEXT,
    "tags" TEXT,
    "reminderChapterNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Foreshadowing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Foreshadowing_plantedInChapterId_fkey" FOREIGN KEY ("plantedInChapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Foreshadowing_resolvedInChapterId_fkey" FOREIGN KEY ("resolvedInChapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "chapterId" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "age" INTEGER,
    "appearance" TEXT,
    "personality" TEXT,
    "powerLevel" TEXT,
    "skills" TEXT,
    "items" TEXT,
    "status" TEXT,
    "relationships" TEXT,
    "mentalState" TEXT,
    "motivation" TEXT,
    "majorEvents" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterSnapshot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterSnapshot_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldElementSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elementId" TEXT NOT NULL,
    "chapterId" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "attributes" TEXT,
    "constraints" TEXT,
    "changeReason" TEXT,
    "changeType" TEXT,
    "affectedCharacters" TEXT,
    "affectedPlots" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorldElementSnapshot_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "WorldElement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldElementSnapshot_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_genre_idx" ON "Project"("genre");

-- CreateIndex
CREATE UNIQUE INDEX "Outline_chapterId_key" ON "Outline"("chapterId");

-- CreateIndex
CREATE INDEX "Outline_projectId_idx" ON "Outline"("projectId");

-- CreateIndex
CREATE INDEX "Outline_parentId_idx" ON "Outline"("parentId");

-- CreateIndex
CREATE INDEX "Chapter_projectId_idx" ON "Chapter"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_projectId_chapterNumber_key" ON "Chapter"("projectId", "chapterNumber");

-- CreateIndex
CREATE INDEX "Scene_chapterId_idx" ON "Scene"("chapterId");

-- CreateIndex
CREATE INDEX "Character_projectId_idx" ON "Character"("projectId");

-- CreateIndex
CREATE INDEX "WorldElement_projectId_idx" ON "WorldElement"("projectId");

-- CreateIndex
CREATE INDEX "WorldElement_type_idx" ON "WorldElement"("type");

-- CreateIndex
CREATE INDEX "WorldElement_importance_idx" ON "WorldElement"("importance");

-- CreateIndex
CREATE INDEX "WorldElement_scope_idx" ON "WorldElement"("scope");

-- CreateIndex
CREATE INDEX "WorldElement_category_idx" ON "WorldElement"("category");

-- CreateIndex
CREATE INDEX "WorldElement_parentId_idx" ON "WorldElement"("parentId");

-- CreateIndex
CREATE INDEX "Generation_projectId_idx" ON "Generation"("projectId");

-- CreateIndex
CREATE INDEX "Generation_type_idx" ON "Generation"("type");

-- CreateIndex
CREATE INDEX "Generation_createdAt_idx" ON "Generation"("createdAt");

-- CreateIndex
CREATE INDEX "Foreshadowing_projectId_idx" ON "Foreshadowing"("projectId");

-- CreateIndex
CREATE INDEX "Foreshadowing_status_idx" ON "Foreshadowing"("status");

-- CreateIndex
CREATE INDEX "Foreshadowing_plantedInChapterId_idx" ON "Foreshadowing"("plantedInChapterId");

-- CreateIndex
CREATE INDEX "Foreshadowing_resolvedInChapterId_idx" ON "Foreshadowing"("resolvedInChapterId");

-- CreateIndex
CREATE INDEX "CharacterSnapshot_characterId_idx" ON "CharacterSnapshot"("characterId");

-- CreateIndex
CREATE INDEX "CharacterSnapshot_chapterId_idx" ON "CharacterSnapshot"("chapterId");

-- CreateIndex
CREATE INDEX "CharacterSnapshot_chapterNumber_idx" ON "CharacterSnapshot"("chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSnapshot_characterId_chapterNumber_key" ON "CharacterSnapshot"("characterId", "chapterNumber");

-- CreateIndex
CREATE INDEX "WorldElementSnapshot_elementId_idx" ON "WorldElementSnapshot"("elementId");

-- CreateIndex
CREATE INDEX "WorldElementSnapshot_chapterId_idx" ON "WorldElementSnapshot"("chapterId");

-- CreateIndex
CREATE INDEX "WorldElementSnapshot_chapterNumber_idx" ON "WorldElementSnapshot"("chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorldElementSnapshot_elementId_chapterNumber_key" ON "WorldElementSnapshot"("elementId", "chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");

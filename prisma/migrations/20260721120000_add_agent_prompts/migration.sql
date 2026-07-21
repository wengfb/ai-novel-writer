-- CreateTable
CREATE TABLE "AgentPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AgentPrompt_agentId_idx" ON "AgentPrompt"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPrompt_agentId_slotKey_key" ON "AgentPrompt"("agentId", "slotKey");

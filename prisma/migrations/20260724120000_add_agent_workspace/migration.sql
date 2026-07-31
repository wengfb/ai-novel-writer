-- CreateTable
CREATE TABLE "AgentConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "agentId" TEXT NOT NULL,
    "systemSlot" TEXT,
    "title" TEXT NOT NULL,
    "contextSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedAt" DATETIME,
    CONSTRAINT "AgentConversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentConversationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "clientMessageId" TEXT,
    "role" TEXT NOT NULL,
    "parts" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sourceConversationId" TEXT,
    "sourceAgentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requestSummary" TEXT NOT NULL,
    "confirmedFacts" TEXT NOT NULL DEFAULT '[]',
    "openQuestions" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChangeSet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeSetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changeSetId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceTitle" TEXT NOT NULL,
    "impactKind" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "proposedAction" TEXT NOT NULL DEFAULT 'review',
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChangeSetItem_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "ChangeSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentHandoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changeSetId" TEXT NOT NULL,
    "fromAgentId" TEXT NOT NULL,
    "toAgentId" TEXT NOT NULL,
    "targetConversationId" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentHandoff_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "ChangeSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentHandoff_targetConversationId_fkey" FOREIGN KEY ("targetConversationId") REFERENCES "AgentConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgentConversation_projectId_scopeType_scopeId_agentId_updatedAt_idx" ON "AgentConversation"("projectId", "scopeType", "scopeId", "agentId", "updatedAt");

-- CreateIndex
CREATE INDEX "AgentConversationMessage_conversationId_createdAt_idx" ON "AgentConversationMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentConversationMessage_conversationId_clientMessageId_key" ON "AgentConversationMessage"("conversationId", "clientMessageId");

-- CreateIndex
CREATE INDEX "ChangeSet_projectId_status_updatedAt_idx" ON "ChangeSet"("projectId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ChangeSetItem_changeSetId_status_idx" ON "ChangeSetItem"("changeSetId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentHandoff_targetConversationId_key" ON "AgentHandoff"("targetConversationId");

-- CreateIndex
CREATE INDEX "AgentHandoff_changeSetId_status_idx" ON "AgentHandoff"("changeSetId", "status");


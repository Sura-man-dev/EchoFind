ALTER TABLE "Notification" ADD COLUMN "href" TEXT;

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "starterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_reportType_reportId_starterId_key"
ON "Conversation"("reportType", "reportId", "starterId");

CREATE INDEX "Conversation_starterId_updatedAt_idx"
ON "Conversation"("starterId", "updatedAt");

CREATE INDEX "Conversation_recipientId_updatedAt_idx"
ON "Conversation"("recipientId", "updatedAt");

CREATE INDEX "ConversationMessage_conversationId_createdAt_idx"
ON "ConversationMessage"("conversationId", "createdAt");

CREATE INDEX "ConversationMessage_conversationId_senderId_readAt_idx"
ON "ConversationMessage"("conversationId", "senderId", "readAt");

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_starterId_fkey"
FOREIGN KEY ("starterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationMessage"
ADD CONSTRAINT "ConversationMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationMessage"
ADD CONSTRAINT "ConversationMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

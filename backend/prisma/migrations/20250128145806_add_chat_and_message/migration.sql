-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "chats_rentalId_key" ON "public"."chats"("rentalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chats_renterId_idx" ON "public"."chats"("renterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chats_ownerId_idx" ON "public"."chats"("ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chats_rentalId_idx" ON "public"."chats"("rentalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_chatId_createdAt_idx" ON "public"."messages"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "public"."messages"("senderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_isRead_idx" ON "public"."messages"("isRead");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_rentalId_fkey'
    ) THEN
        ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "public"."rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_renterId_fkey'
    ) THEN
        ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chats_ownerId_fkey'
    ) THEN
        ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_chatId_fkey'
    ) THEN
        ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_senderId_fkey'
    ) THEN
        ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;


import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDatabaseFailure } from "@/lib/database-errors";

const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message before sending.").max(2000, "Messages must be 2,000 characters or fewer."),
});

async function getParticipantConversation(id, userId) {
  return prisma.conversation.findFirst({
    where: {
      id,
      OR: [{ starterId: userId }, { recipientId: userId }],
    },
    include: {
      starter: { select: { id: true, name: true, image: true } },
      recipient: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function GET(_request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getParticipantConversation(id, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    await Promise.all([
      prisma.conversationMessage.updateMany({
        where: {
          conversationId: id,
          senderId: { not: session.user.id },
          readAt: null,
        },
        data: { readAt: new Date() },
      }),
      prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          href: `/messages/${id}`,
          readAt: null,
        },
        data: { readAt: new Date() },
      }),
    ]);

    const newestMessages = await prisma.conversationMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, senderId: true, body: true, createdAt: true, readAt: true },
    });

    return NextResponse.json({
      conversation,
      messages: newestMessages.reverse(),
      viewerId: session.user.id,
    });
  } catch (error) {
    console.error("Failed to load conversation messages", error);
    const failure = getDatabaseFailure(error, "Unable to load this conversation.");
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getParticipantConversation(id, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }

    const result = messageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || "Enter a valid message." }, { status: 400 });
    }

    const recipientId = conversation.starterId === session.user.id
      ? conversation.recipientId
      : conversation.starterId;
    const sender = conversation.starterId === session.user.id
      ? conversation.starter
      : conversation.recipient;

    const message = await prisma.$transaction(async (transaction) => {
      const createdMessage = await transaction.conversationMessage.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          body: result.data.body,
        },
        select: { id: true, senderId: true, body: true, createdAt: true, readAt: true },
      });

      await Promise.all([
        transaction.conversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        }),
        transaction.notification.create({
          data: {
            userId: recipientId,
            type: "message",
            title: `New message about ${conversation.itemName}`,
            message: `${sender.name || "A community member"} sent you a message.`,
            href: `/messages/${id}`,
          },
        }),
      ]);

      return createdMessage;
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Failed to send conversation message", error);
    const failure = getDatabaseFailure(error, "Unable to send your message.");
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}

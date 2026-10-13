import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createConversationSchema = z.object({
  reportType: z.enum(["lost", "found"]),
  reportId: z.string().trim().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ starterId: session.user.id }, { recipientId: session.user.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        starter: { select: { id: true, name: true, image: true } },
        recipient: { select: { id: true, name: true, image: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const unreadCounts = conversations.length
      ? await prisma.conversationMessage.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: { in: conversations.map((conversation) => conversation.id) },
            senderId: { not: session.user.id },
            readAt: null,
          },
          _count: { _all: true },
        })
      : [];
    const unreadByConversation = new Map(
      unreadCounts.map(({ conversationId, _count }) => [conversationId, _count._all])
    );

    return NextResponse.json({
      conversations: conversations.map((conversation) => ({
        ...conversation,
        unreadCount: unreadByConversation.get(conversation.id) || 0,
      })),
      viewerId: session.user.id,
    });
  } catch (error) {
    console.error("Failed to load conversations", error);
    return NextResponse.json({ error: "Unable to load your conversations." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid conversation request." }, { status: 400 });
    }

    const result = createConversationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Choose a valid item report." }, { status: 400 });
    }

    const { reportType, reportId } = result.data;
    const reportModel = reportType === "lost" ? prisma.lostReport : prisma.foundReport;
    const report = await reportModel.findUnique({
      where: { id: reportId },
      select: { id: true, userId: true, itemName: true, status: true },
    });

    if (!report || ["pending", "rejected"].includes(report.status) || !report.userId) {
      return NextResponse.json({ error: "This report is not available for messaging." }, { status: 404 });
    }
    if (report.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot start a conversation with yourself." }, { status: 400 });
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        reportType_reportId_starterId: {
          reportType,
          reportId,
          starterId: session.user.id,
        },
      },
      update: {},
      create: {
        reportType,
        reportId,
        itemName: report.itemName,
        starterId: session.user.id,
        recipientId: report.userId,
      },
      select: { id: true },
    });

    return NextResponse.json({ conversation }, { status: 200 });
  } catch (error) {
    console.error("Failed to start conversation", error);
    return NextResponse.json({ error: "Unable to start a conversation." }, { status: 500 });
  }
}

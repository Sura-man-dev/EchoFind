import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ notifications: [], unreadCount: 0 });

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, readAt: null },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Failed to load notifications", error);
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid notification update." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid notification update." }, { status: 400 });
    }

    const where = body.markAll === true
      ? { userId: session.user.id, readAt: null }
      : typeof body.notificationId === "string"
        ? { id: body.notificationId, userId: session.user.id, readAt: null }
        : null;

    if (!where) {
      return NextResponse.json({ error: "Select a notification to update." }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error) {
    console.error("Failed to mark notifications read", error);
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }
}
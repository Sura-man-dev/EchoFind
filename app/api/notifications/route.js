import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ notifications: [], unreadCount: 0 });

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.readAt).length,
    });
  } catch (error) {
    console.error("Failed to load notifications", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications read", error);
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }
}
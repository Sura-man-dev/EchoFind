import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: { select: { lostReports: true, foundReports: true } },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to load users", error);
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const { userId, role } = await request.json();
    if (!userId || !["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "A valid user and role are required." }, { status: 400 });
    }

    if (userId === session.user.id && role !== "admin") {
      return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
    }

    const user = await prisma.user.update({ where: { id: userId }, data: { role } });
    return NextResponse.json({ id: user.id, role: user.role });
  } catch (error) {
    console.error("Failed to update user role", error);
    return NextResponse.json({ error: "Unable to update this user." }, { status: 500 });
  }
}

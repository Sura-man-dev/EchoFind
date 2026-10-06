import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [lostCount, foundCount] = await Promise.all([
      prisma.lostReport.count(),
      prisma.foundReport.count(),
    ]);

    return NextResponse.json({
      lostCount,
      foundCount,
      messageCount: 0,
    });
  } catch (error) {
    console.error("Failed to load dashboard stats", error);

    return NextResponse.json({
      lostCount: 0,
      foundCount: 0,
      messageCount: 0,
    });
  }
}

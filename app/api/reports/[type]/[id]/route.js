import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request, { params }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { type, id } = await params;
    const model = type === "lost" ? prisma.lostReport : type === "found" ? prisma.foundReport : null;

    if (!model) return NextResponse.json({ error: "Invalid report type." }, { status: 400 });

    const report = await model.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

    return NextResponse.json({ ...report, reportType: type });
  } catch (error) {
    console.error("Failed to load report details", error);
    return NextResponse.json({ error: "Unable to load report details." }, { status: 500 });
  }
}
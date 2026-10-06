import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMatchSuggestions } from "@/lib/matching";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const [lostReports, foundReports] = await Promise.all([
      prisma.lostReport.findMany({ where: { status: "open" }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.foundReport.findMany({ where: { status: "open" }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    return NextResponse.json(getMatchSuggestions(lostReports, foundReports).slice(0, 30));
  } catch (error) {
    console.error("Failed to generate match suggestions", error);
    return NextResponse.json({ error: "Unable to generate match suggestions." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const { lostReportId, foundReportId, score, reasons = [] } = await request.json();
    if (!lostReportId || !foundReportId || !Number.isFinite(score)) {
      return NextResponse.json({ error: "A valid match is required." }, { status: 400 });
    }

    const lostReport = await prisma.lostReport.findUnique({ where: { id: lostReportId } });
    const foundReport = await prisma.foundReport.findUnique({ where: { id: foundReportId } });
    if (!lostReport || !foundReport) return NextResponse.json({ error: "Reports could not be found." }, { status: 404 });

    const match = await prisma.itemMatch.upsert({
      where: { lostReportId_foundReportId: { lostReportId, foundReportId } },
      update: { score: Math.round(score), reasons, status: "confirmed", confirmedAt: new Date() },
      create: { lostReportId, foundReportId, score: Math.round(score), reasons, status: "confirmed", confirmedAt: new Date() },
    });

    await prisma.$transaction([
      prisma.lostReport.update({ where: { id: lostReportId }, data: { status: "matched" } }),
      prisma.foundReport.update({ where: { id: foundReportId }, data: { status: "matched" } }),
      ...(lostReport.userId ? [prisma.notification.create({
        data: {
          userId: lostReport.userId,
          type: "match",
          title: "Your lost item may have been found",
          message: `A possible match was confirmed for ${lostReport.itemName}. Check your reports for the next steps.`,
        },
      })] : []),
    ]);

    return NextResponse.json({ match, notified: Boolean(lostReport.userId) });
  } catch (error) {
    console.error("Failed to confirm item match", error);
    return NextResponse.json({ error: "Unable to confirm this match." }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { analyzeFoundReport, GeminiAnalysisError } from "@/lib/gemini";

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const [lostReportCount, foundReports, lostReports] = await Promise.all([
      prisma.lostReport.count({ where: { status: "open" } }),
      prisma.foundReport.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          itemName: true,
          category: true,
          description: true,
          foundLocation: true,
          foundDate: true,
          imageUrls: true,
        },
      }),
      prisma.lostReport.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          itemName: true,
          category: true,
          description: true,
          lostLocation: true,
          lostDate: true,
          imageUrls: true,
        },
      }),
    ]);

    return NextResponse.json({ foundReports, lostReports, lostReportCount });
  } catch (error) {
    console.error("Failed to load reports for AI analysis", error);
    return NextResponse.json({ error: "Unable to load reports for AI analysis." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = await request.json();
    if (body.action === "analyze") {
      if (typeof body.foundReportId !== "string" || !body.foundReportId) {
        return NextResponse.json({ error: "Choose a found report to analyze." }, { status: 400 });
      }

      const foundReport = await prisma.foundReport.findFirst({
        where: { id: body.foundReportId, status: "open" },
      });
      if (!foundReport) {
        return NextResponse.json({ error: "The open found report could not be found." }, { status: 404 });
      }

      const lostReports = await prisma.lostReport.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      if (!lostReports.length) {
        return NextResponse.json({ matches: [], imageWarnings: [], imagesAnalyzed: 0 });
      }

      const analysis = await analyzeFoundReport(foundReport, lostReports);
      return NextResponse.json(analysis);
    }

    const isManualConfirmation = body.action === "manualConfirm";
    const { lostReportId, foundReportId } = body;
    const score = isManualConfirmation ? 100 : body.score;
    const reasons = isManualConfirmation
      ? ["Manually reviewed and confirmed by an administrator."]
      : body.reasons;

    if (
      typeof lostReportId !== "string" ||
      typeof foundReportId !== "string" ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > 100 ||
      (!isManualConfirmation &&
        (!Array.isArray(reasons) ||
          reasons.length === 0 ||
          reasons.some((reason) => typeof reason !== "string")))
    ) {
      return NextResponse.json({ error: "A valid match is required." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (transaction) => {
      const [lostReport, foundReport] = await Promise.all([
        transaction.lostReport.findFirst({
          where: { id: lostReportId, status: "open" },
        }),
        transaction.foundReport.findFirst({
          where: { id: foundReportId, status: "open" },
        }),
      ]);
      if (!lostReport || !foundReport) {
        return null;
      }

      const match = await transaction.itemMatch.upsert({
        where: { lostReportId_foundReportId: { lostReportId, foundReportId } },
        update: { score, reasons, status: "confirmed", confirmedAt: new Date() },
        create: { lostReportId, foundReportId, score, reasons, status: "confirmed", confirmedAt: new Date() },
      });

      const recipientIds = [...new Set([lostReport.userId, foundReport.userId].filter(Boolean))];
      await Promise.all([
        transaction.lostReport.update({ where: { id: lostReportId }, data: { status: "matched" } }),
        transaction.foundReport.update({ where: { id: foundReportId }, data: { status: "matched" } }),
        ...(recipientIds.length
          ? [
              transaction.notification.createMany({
                data: recipientIds.map((userId) => ({
                  userId,
                  type: "match",
                  title: "A possible item match was confirmed",
                  message: `A match was confirmed between "${lostReport.itemName}" and "${foundReport.itemName}". Check your reports for next steps.`,
                })),
              }),
            ]
          : []),
      ]);

      return { match, notified: recipientIds.length > 0 };
    });

    if (!result) {
      return NextResponse.json(
        { error: "One or both reports are no longer open. Refresh the report list and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GeminiAnalysisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to process match request", error);
    return NextResponse.json({ error: "Unable to process this match request." }, { status: 500 });
  }
}
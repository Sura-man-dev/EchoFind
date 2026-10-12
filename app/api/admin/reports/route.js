import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const reportStatus = z.enum(["pending", "open", "claimed", "matched", "rejected"]);
const reportIdentity = z.object({
  reportType: z.enum(["lost", "found"]),
  reportId: z.string().trim().min(1),
});

function getReportModel(client, reportType) {
  return reportType === "lost" ? client.lostReport : client.foundReport;
}

function withReportDetails(reportType, report) {
  return {
    ...report,
    reportType,
    location: reportType === "lost" ? report.lostLocation : report.foundLocation,
    date: reportType === "lost" ? report.lostDate : report.foundDate,
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const [lostReports, foundReports] = await Promise.all([
      prisma.lostReport.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.foundReport.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json([
      ...lostReports.map((report) => withReportDetails("lost", report)),
      ...foundReports.map((report) => withReportDetails("found", report)),
    ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)));
  } catch (error) {
    console.error("Failed to load reports for administration", error);
    return NextResponse.json({ error: "Unable to load reports." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await readJson(request);
    const result = reportIdentity.extend({ status: reportStatus }).safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "A valid report and status are required." }, { status: 400 });
    }

    const { reportType, reportId, status } = result.data;
    const report = await prisma.$transaction(async (transaction) => {
      const model = getReportModel(transaction, reportType);
      const current = await model.findUnique({ where: { id: reportId } });
      if (!current) return null;

      const updated = await model.update({ where: { id: reportId }, data: { status } });
      if (current.userId && current.status === "pending" && ["open", "rejected"].includes(status)) {
        const decision = status === "open" ? "approved" : "rejected";
        await transaction.notification.create({
          data: {
            userId: current.userId,
            type: `${reportType}-${decision}`,
            title: `Your ${reportType} report was ${decision}`,
            message: status === "open"
              ? `Your report for "${current.itemName}" has been approved and is now visible to the community.`
              : `Your report for "${current.itemName}" was not approved. Please review the details and submit an updated report if needed.`,
          },
        });
      }

      return updated;
    });

    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    return NextResponse.json({ reportType, reportId, status: report.status });
  } catch (error) {
    console.error("Failed to update report moderation", error);
    return NextResponse.json({ error: "Unable to update this report." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await readJson(request);
    const result = reportIdentity.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "A valid report is required." }, { status: 400 });
    }

    const { reportType, reportId } = result.data;
    const deleted = await prisma.$transaction(async (transaction) => {
      const model = getReportModel(transaction, reportType);
      const report = await model.findUnique({ where: { id: reportId } });
      if (!report) return false;

      if (reportType === "lost") {
        await transaction.itemMatch.deleteMany({ where: { lostReportId: reportId } });
      } else {
        await transaction.itemMatch.deleteMany({ where: { foundReportId: reportId } });
      }
      await model.delete({ where: { id: reportId } });

      if (report.userId) {
        await transaction.notification.create({
          data: {
            userId: report.userId,
            type: `${reportType}-removed`,
            title: `Your ${reportType} report was removed`,
            message: `Your report for "${report.itemName}" was removed by an administrator.`,
          },
        });
      }

      return true;
    });

    if (!deleted) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove report", error);
    return NextResponse.json({ error: "Unable to remove this report." }, { status: 500 });
  }
}

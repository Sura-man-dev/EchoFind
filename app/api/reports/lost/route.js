import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";

const lostReportSchema = z.object({
  itemName: z.string().trim().min(2, "Item name is required."),
  category: z.string().trim().min(1, "Category is required."),
  imageUrls: z.array(z.string()).max(5).optional().default([]),
  brand: z.string().trim().optional().or(z.literal("")),
  color: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().min(8, "Please add a short description."),
  lostLocation: z.string().trim().min(2, "Location is required."),
  lostDate: z.string().min(1, "Date is required."),
  lostTime: z.string().min(1, "Time is required."),
  locationDetails: z.string().trim().min(3, "Additional location details are required."),
  contactName: z.string().trim().min(2, "Full name is required."),
  contactEmail: z.string().trim().email("Enter a valid email address."),
  contactPhone: z.string().trim().min(7, "Enter a valid phone number."),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const reports = await prisma.lostReport.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to load lost reports", error);
    return NextResponse.json({ error: "Unable to load lost reports." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = await request.json();
    const result = lostReportSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid lost report details." },
        { status: 400 }
      );
    }

    const payload = result.data;

    const report = await prisma.$transaction(async (transaction) => {
      const createdReport = await transaction.lostReport.create({
        data: {
          ...payload,
          lostDate: new Date(payload.lostDate),
          userId: session.user.id,
        },
      });

      await notifyAdmins(transaction, {
        type: "lost",
        title: "New lost item reported",
        message: `A new lost item report was submitted: ${createdReport.itemName}.`,
        excludeUserId: session.user.id,
      });

      return createdReport;
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create lost report", error);
    return NextResponse.json({ error: "Unable to save lost report." }, { status: 500 });
  }
}

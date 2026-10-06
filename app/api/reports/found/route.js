import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const foundReportSchema = z.object({
  itemName: z.string().trim().min(2, "Item name is required."),
  category: z.string().trim().min(1, "Category is required."),
  imageUrls: z.array(z.string()).max(5).optional().default([]),
  brand: z.string().trim().optional().or(z.literal("")),
  color: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().min(8, "Please add a short description."),
  foundLocation: z.string().trim().min(2, "Location is required."),
  foundDate: z.string().min(1, "Date is required."),
  foundTime: z.string().optional().or(z.literal("")),
  locationDetails: z.string().trim().optional().or(z.literal("")),
  contactName: z.string().trim().optional().or(z.literal("")),
  contactEmail: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  contactPhone: z.string().trim().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const reports = await prisma.foundReport.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to load found reports", error);
    return NextResponse.json({ error: "Unable to load found reports." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    const body = await request.json();
    const result = foundReportSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid found report details." },
        { status: 400 }
      );
    }

    const payload = result.data;

    const report = await prisma.foundReport.create({
      data: {
        ...payload,
        foundDate: new Date(payload.foundDate),
        userId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create found report", error);
    return NextResponse.json({ error: "Unable to save found report." }, { status: 500 });
  }
}

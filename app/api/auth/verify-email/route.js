import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

function loginRedirect(request, result) {
  const url = new URL("/login", request.url);
  url.searchParams.set("emailVerification", result);
  return NextResponse.redirect(url);
}

export async function GET(request) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return loginRedirect(request, "invalid");
  }

  try {
    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!verificationRecord || verificationRecord.expiresAt <= new Date()) {
      return loginRedirect(request, "invalid");
    }

    const isVerified = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findFirst({
        where: {
          id: verificationRecord.userId,
          email: verificationRecord.email,
        },
        select: { id: true },
      });

      if (!user) {
        return false;
      }

      await transaction.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
      await transaction.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      return true;
    });

    return loginRedirect(request, isVerified ? "success" : "invalid");
  } catch (error) {
    console.error("Email verification failed", error);
    return loginRedirect(request, "error");
  }
}

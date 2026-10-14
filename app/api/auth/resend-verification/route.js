import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/mailer";
import { createRawToken, hashToken } from "@/lib/tokens";

const resendVerificationSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
});

const genericResponse = {
  message: "If an unverified account exists for that email, a verification link has been sent.",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const parsedBody = resendVerificationSchema.safeParse(body);

    if (!parsedBody.success) {
      const issue = parsedBody.error.issues[0];

      return NextResponse.json(
        { error: issue?.message || "Enter a valid email address." },
        { status: 400 }
      );
    }

    const email = parsedBody.data.email;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json(genericResponse);
    }

    const rawToken = createRawToken();
    const tokenHash = hashToken(rawToken);

    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
      prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          email,
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      }),
    ]);

    await sendEmailVerificationEmail({ email, token: rawToken });

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Resending email verification failed", error);

    return NextResponse.json(
      { error: "Unable to send a verification email right now." },
      { status: 500 }
    );
  }
}

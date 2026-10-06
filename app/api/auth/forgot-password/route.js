import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { createRawToken, hashToken } from "@/lib/tokens";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsedBody = forgotPasswordSchema.safeParse(body);

    if (!parsedBody.success) {
      const issue = parsedBody.error.issues[0];

      return NextResponse.json(
        { error: issue?.message || "Enter a valid email address." },
        { status: 400 }
      );
    }

    const email = parsedBody.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const rawToken = createRawToken();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          email,
          tokenHash: hashToken(rawToken),
          expiresAt,
        },
      });

      await sendPasswordResetEmail({
        email,
        token: rawToken,
      });
    }

    return NextResponse.json({
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password failed", error);

    return NextResponse.json(
      { error: "Unable to start password reset right now." },
      { status: 500 }
    );
  }
}

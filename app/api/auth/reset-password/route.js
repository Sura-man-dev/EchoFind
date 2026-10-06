import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { hashToken } from "@/lib/tokens";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/[a-z]/, "Password must include a lowercase letter.")
      .regex(/[0-9]/, "Password must include a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function POST(request) {
  try {
    const body = await request.json();
    const parsedBody = resetPasswordSchema.safeParse(body);

    if (!parsedBody.success) {
      const issue = parsedBody.error.issues[0];

      return NextResponse.json(
        { error: issue?.message || "Invalid reset details." },
        { status: 400 }
      );
    }

    const { token, password } = parsedBody.data;

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash: hashToken(token),
      },
      include: {
        user: true,
      },
    });

    if (!resetRecord || resetRecord.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetRecord.userId },
    });

    return NextResponse.json({
      message: "Your password has been updated. You can log in now.",
    });
  } catch (error) {
    console.error("Reset password failed", error);

    return NextResponse.json(
      { error: "Unable to reset password right now." },
      { status: 500 }
    );
  }
}

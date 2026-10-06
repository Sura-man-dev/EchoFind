import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters."),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/[a-z]/, "Password must include a lowercase letter.")
      .regex(/[0-9]/, "Password must include a number."),
    confirmPassword: z.string(),
    acceptedTerms: z.boolean(),
  })
  .refine((data) => data.acceptedTerms, {
    path: ["acceptedTerms"],
    message: "You must agree to the Terms of Service and Privacy Policy.",
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function POST(request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];

      return NextResponse.json(
        { error: issue?.message || "Invalid signup details." },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: process.env.ADMIN_EMAIL?.toLowerCase() === email ? "admin" : "user",
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup failed", error);

    return NextResponse.json(
      { error: "Unable to create your account right now." },
      { status: 500 }
    );
  }
}

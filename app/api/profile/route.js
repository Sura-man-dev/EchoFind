import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/passwords";

const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Your name must be at least 2 characters.").max(60).optional(),
    image: z.string().url().nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/[a-z]/, "Password must include a lowercase letter.")
      .regex(/[0-9]/, "Password must include a number.")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.image !== undefined || data.newPassword !== undefined, {
    message: "Update a profile detail before saving.",
  });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, passwordHash: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        hasPassword: Boolean(user.passwordHash),
      },
    });
  } catch (error) {
    console.error("Failed to load profile", error);
    return NextResponse.json({ error: "Unable to load your profile." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = await request.json();
    const result = profileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || "Invalid profile details." }, { status: 400 });
    }

    const { name, image, currentPassword, newPassword } = result.data;
    if (image !== undefined && image !== null && !isOwnProfileImage(image, session.user.id)) {
      return NextResponse.json({ error: "Choose a profile photo uploaded to your account." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 404 });
    }

    if (newPassword && user.passwordHash) {
      if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
        return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
      }
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (image !== undefined) data.image = image;
    if (newPassword) data.passwordHash = await hashPassword(newPassword);

    const select = { id: true, name: true, email: true, image: true, passwordHash: true };
    const updatedUser = newPassword
      ? await prisma.$transaction(async (transaction) => {
          const updated = await transaction.user.update({
            where: { id: session.user.id },
            data,
            select,
          });
          await transaction.passwordResetToken.deleteMany({ where: { userId: session.user.id } });
          return updated;
        })
      : await prisma.user.update({
          where: { id: session.user.id },
          data,
          select,
        });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        hasPassword: Boolean(updatedUser.passwordHash),
      },
    });
  } catch (error) {
    console.error("Failed to update profile", error);
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}

function isOwnProfileImage(imageUrl, userId) {
  try {
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    if (!endpoint) return false;

    const image = new URL(imageUrl);
    const endpointUrl = new URL(endpoint);
    const basePath = endpointUrl.pathname.replace(/\/+$/, "");
    const profilePrefix = `${basePath}/profiles/${userId}/`;

    return image.protocol === "https:"
      && image.origin === endpointUrl.origin
      && image.pathname.startsWith(profilePrefix);
  } catch {
    return false;
  }
}

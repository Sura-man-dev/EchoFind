import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    return NextResponse.json({
      authenticated: Boolean(session?.user),
      user: session?.user
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role,
          }
        : null,
    });
  } catch (error) {
    console.error("Session lookup failed", error);

    return NextResponse.json(
      { error: "Unable to load the current session." },
      { status: 500 }
    );
  }
}

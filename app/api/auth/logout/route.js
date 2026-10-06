import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function POST() {
  try {
    await signOut({
      redirect: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout failed", error);

    return NextResponse.json(
      { error: "Unable to log out right now." },
      { status: 500 }
    );
  }
}

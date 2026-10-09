import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in before uploading a profile photo." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a profile photo to upload." }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WEBP images are allowed." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Your profile photo must be 5MB or smaller." }, { status: 400 });
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      console.error("Profile image upload is unavailable because IMAGEKIT_PRIVATE_KEY is not configured.");
      return NextResponse.json({ error: "Profile image uploads are not configured yet." }, { status: 503 });
    }

    const uploadData = new FormData();
    uploadData.set("file", file);
    uploadData.set("fileName", `${randomUUID()}.${getExtension(file.type)}`);
    uploadData.set("folder", `/profiles/${session.user.id}`);

    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
      },
      body: uploadData,
      signal: AbortSignal.timeout(30000),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.url !== "string" || !result.url.startsWith("https://")) {
      console.error("ImageKit rejected profile photo upload", { status: response.status });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "ImageKit rejected the configured private key." }, { status: 502 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Image uploads are temporarily busy. Try again shortly." }, { status: 429 });
      }
      return NextResponse.json({ error: "ImageKit could not save your photo. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ image: result.url }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload profile photo", {
      message: error instanceof Error ? error.message : "Unknown upload error",
    });
    return NextResponse.json({ error: "Could not upload your profile photo. Check your connection and try again." }, { status: 502 });
  }
}

function getExtension(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

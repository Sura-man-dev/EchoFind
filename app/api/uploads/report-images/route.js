import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in before uploading images." }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("images").filter((file) => file instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "Please choose at least one image." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `You can upload up to ${MAX_FILES} images.` }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
    await mkdir(uploadDir, { recursive: true });

    const imageUrls = [];

    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, and WEBP images are allowed." },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Each image must be 5MB or smaller." },
          { status: 400 }
        );
      }

      const extension = getExtension(file);
      const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
      const filePath = path.join(uploadDir, fileName);
      const bytes = Buffer.from(await file.arrayBuffer());

      await writeFile(filePath, bytes);
      imageUrls.push(`/uploads/reports/${fileName}`);
    }

    return NextResponse.json({ imageUrls }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload report images", error);
    return NextResponse.json({ error: "Unable to upload images right now." }, { status: 500 });
  }
}

function getExtension(file) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

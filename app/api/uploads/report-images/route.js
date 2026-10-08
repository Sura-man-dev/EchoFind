import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

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
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      console.error("Image upload is unavailable because IMAGEKIT_PRIVATE_KEY is not configured.");
      return NextResponse.json(
        { error: "Image uploads are not configured yet." },
        { status: 503 }
      );
    }

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const uploadData = new FormData();
        uploadData.set("file", file);
        uploadData.set("fileName", `${randomUUID()}.${getExtension(file)}`);
        uploadData.set("folder", "/reports");

        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
          },
          body: uploadData,
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || typeof result.url !== "string" || !result.url.startsWith("https://")) {
          const message = typeof result.message === "string" ? result.message : "";
          const requestId = response.headers.get("x-request-id") || response.headers.get("x-ik-request-id");
          console.error("ImageKit rejected report image upload", {
            status: response.status,
            requestId,
          });

          if (response.status >= 500) {
            const credentialsAccepted = await checkImageKitCredentials(privateKey);

            if (credentialsAccepted === false) {
              throw new ImageKitUploadError(
                "ImageKit rejected the configured private key. Copy the current Private key from the same ImageKit account as your URL endpoint into IMAGEKIT_PRIVATE_KEY, then restart the app.",
                502
              );
            }
          }

          throw createImageKitError(response.status, message);
        }

        return result.url;
      })
    );

    return NextResponse.json({ imageUrls }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload report images", {
      message: error instanceof Error ? error.message : "Unknown upload error",
    });
    return NextResponse.json(
      {
        error:
          error instanceof ImageKitUploadError
            ? error.message
            : "Could not connect to ImageKit. Check your connection and try again.",
      },
      { status: error instanceof ImageKitUploadError ? error.status : 502 }
    );
  }
}

async function checkImageKitCredentials(privateKey) {
  try {
    const response = await fetch("https://api.imagekit.io/v1/files?limit=1", {
      headers: {
        Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401 || response.status === 403) {
      console.error("ImageKit private key verification failed", { status: response.status });
      return false;
    }

    if (!response.ok) {
      console.error("ImageKit private key verification was inconclusive", {
        status: response.status,
      });
      return null;
    }

    return true;
  } catch (error) {
    console.error("Could not verify the ImageKit private key", {
      message: error instanceof Error ? error.message : "Unknown verification error",
    });
    return null;
  }
}

function createImageKitError(status, message) {
  if (status === 401 || status === 403) {
    return new ImageKitUploadError(
      "ImageKit rejected the private API key. Check IMAGEKIT_PRIVATE_KEY in .env and restart the app.",
      502
    );
  }

  if (status === 413) {
    return new ImageKitUploadError("The image is too large for ImageKit. Choose a smaller image.", 413);
  }

  if (status === 429) {
    return new ImageKitUploadError("ImageKit is receiving too many uploads. Please wait and try again.", 429);
  }

  if (status >= 500) {
    return new ImageKitUploadError(
      "ImageKit is temporarily unable to process this image. Please try again in a moment.",
      502
    );
  }

  if (status === 400 && message) {
    return new ImageKitUploadError(`ImageKit rejected the upload: ${message}`, 400);
  }

  return new ImageKitUploadError("ImageKit could not save the image. Please try again.", 502);
}

class ImageKitUploadError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
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

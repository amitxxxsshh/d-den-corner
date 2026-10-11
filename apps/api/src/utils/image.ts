import type { ImagesBinding, R2Bucket } from "@cloudflare/workers-types";

export const R2_PUBLIC_BASE_URL = "https://pub-5d1d18dae43b48efbe570ca5a3b93a0e.r2.dev";
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export type SupportedImageFormat = "jpeg" | "png" | "webp";

/**
 * Validates actual binary content by inspecting magic bytes.
 */
export function detectImageFormat(buffer: Uint8Array): SupportedImageFormat | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG / JPG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // WebP: RIFF [4 bytes] WEBP
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return "webp";
  }

  return null;
}

/**
 * Validates image size and content.
 */
export function validateImage(buffer: Uint8Array): {
  valid: boolean;
  format?: SupportedImageFormat;
  error?: string;
} {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: "Image file is empty.",
    };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image file exceeds maximum allowed size of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  const format = detectImageFormat(buffer);
  if (!format) {
    return {
      valid: false,
      error: "Invalid image format. Supported formats are JPG, JPEG, PNG, and WebP.",
    };
  }

  return {
    valid: true,
    format,
  };
}

/**
 * Converts image buffer to WebP using Cloudflare Images binding when needed.
 * If the input is already WebP, returns the buffer directly.
 */
export async function convertToWebp(
  buffer: Uint8Array,
  format: SupportedImageFormat,
  imagesBinding?: ImagesBinding,
): Promise<Uint8Array> {
  // If already WebP, no conversion is necessary
  if (format === "webp") {
    return buffer;
  }

  if (!imagesBinding) {
    throw new Error(
      "Cloudflare Images binding is required for server-side JPEG/PNG to WebP conversion.",
    );
  }

  try {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });

    const transformed = await imagesBinding
      .input(stream)
      .output({ format: "image/webp", quality: 85 });

    const response = transformed.response();
    const arrayBuffer = await response.arrayBuffer();
    const webpBytes = new Uint8Array(arrayBuffer);

    // Verify converted output is valid WebP
    if (detectImageFormat(webpBytes) !== "webp") {
      throw new Error("Conversion did not produce valid WebP format.");
    }

    return webpBytes;
  } catch (error) {
    throw new Error(
      `Image conversion to WebP failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Generates a unique collision-resistant key for R2 storage following
 * the menu/<unique-filename>.webp convention.
 */
export function generateObjectKey(itemId: string): string {
  const sanitizedId = itemId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 32);
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `menu/${sanitizedId}-${timestamp}-${randomSuffix}.webp`;
}

/**
 * Uploads a WebP image to Cloudflare R2, verifies upload success,
 * and returns the public URL.
 */
export async function uploadWebpToR2(
  bucket: R2Bucket,
  itemId: string,
  webpBytes: Uint8Array,
): Promise<{ key: string; publicUrl: string }> {
  let key = generateObjectKey(itemId);

  // Avoid collisions: check if key already exists
  let attempts = 0;
  while (attempts < 3) {
    const existing = await bucket.head(key);
    if (!existing) {
      break;
    }
    key = generateObjectKey(itemId);
    attempts++;
  }

  // Upload to R2
  const putResult = await bucket.put(key, webpBytes, {
    httpMetadata: {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  if (!putResult) {
    throw new Error("Failed to write image to R2 storage.");
  }

  // Validate upload success before returning
  const headResult = await bucket.head(key);
  if (!headResult) {
    throw new Error("Upload verification failed: object was not found in R2.");
  }

  const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;
  return { key, publicUrl };
}

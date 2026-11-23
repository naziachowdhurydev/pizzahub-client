const DATA_IMAGE_PATTERN =
  /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i;

const MAX_DATA_IMAGE_CHARS = 2_800_000;

/**
 * Accepts an optional external HTTPS/HTTP image URL or an uploaded image data
 * URL. Uploaded images are stored directly on the Better Auth user record in
 * MongoDB, so no third-party image host is required.
 */
export function normalizeOptionalImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) {
    const match = DATA_IMAGE_PATTERN.exec(trimmed.replace(/\s/g, ""));
    if (!match) {
      throw new Error("Use a JPG, PNG, WEBP or GIF image.");
    }
    if (match[2].length > MAX_DATA_IMAGE_CHARS) {
      throw new Error("Please choose an image smaller than 2 MB.");
    }
    return `data:${match[1].toLowerCase()};base64,${match[2]}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Image URL must start with http:// or https://.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Image URL must start with http:// or https://.");
  }

  return parsed.toString();
}

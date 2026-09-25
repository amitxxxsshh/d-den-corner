/// <reference types="@cloudflare/workers-types" />

const HEX_LOOKUP = "0123456789abcdef";

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);

  const digest = await crypto.subtle.digest("SHA-256", data);

  const bytes = new Uint8Array(digest);

  let result = "";

  for (const byte of bytes) {
    result += HEX_LOOKUP[(byte >> 4) & 0x0f];
    result += HEX_LOOKUP[byte & 0x0f];
  }

  return result;
}

export function generateOpaqueToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);

  crypto.getRandomValues(bytes);

  let result = "";

  for (const byte of bytes) {
    result += HEX_LOOKUP[(byte >> 4) & 0x0f];
    result += HEX_LOOKUP[byte & 0x0f];
  }

  return result;
}
/// <reference types="@cloudflare/workers-types" />

const HEX_LOOKUP =
  "0123456789abcdef";

export async function sha256Hex(
  value: string,
): Promise<string> {
  const data =
    new TextEncoder().encode(value);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      data,
    );

  const bytes =
    new Uint8Array(digest);

  let result = "";

  for (const byte of bytes) {
    result +=
      HEX_LOOKUP[
        (byte >> 4) & 0x0f
      ];

    result +=
      HEX_LOOKUP[
        byte & 0x0f
      ];
  }

  return result;
}

export function generateOpaqueToken(
  byteLength = 32,
): string {
  const bytes =
    new Uint8Array(byteLength);

  crypto.getRandomValues(bytes);

  let result = "";

  for (const byte of bytes) {
    result +=
      HEX_LOOKUP[
        (byte >> 4) & 0x0f
      ];

    result +=
      HEX_LOOKUP[
        byte & 0x0f
      ];
  }

  return result;
}

function bytesToHex(
  bytes: Uint8Array,
): string {
  let result = "";

  for (const byte of bytes) {
    result +=
      HEX_LOOKUP[
        (byte >> 4) & 0x0f
      ];

    result +=
      HEX_LOOKUP[
        byte & 0x0f
      ];
  }

  return result;
}

function hexToBytes(
  hex: string,
): Uint8Array {
  const bytes =
    new Uint8Array(
      hex.length / 2,
    );

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {
    bytes[i] = parseInt(
      hex.slice(
        i * 2,
        i * 2 + 2,
      ),
      16,
    );
  }

  return bytes;
}

export async function hashPassword(
  password: string,
  saltHex?: string,
): Promise<{
  hash: string;
  salt: string;
}> {
  const salt =
    saltHex
      ? hexToBytes(saltHex)
      : crypto.getRandomValues(
          new Uint8Array(16),
        );

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        password,
      ),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

  const bits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100_000,
        hash: "SHA-256",
      },
      key,
      256,
    );

  return {
    hash: bytesToHex(
      new Uint8Array(bits),
    ),
    salt: bytesToHex(salt),
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const result =
    await hashPassword(
      password,
      storedSalt,
    );

  return result.hash ===
    storedHash;
}
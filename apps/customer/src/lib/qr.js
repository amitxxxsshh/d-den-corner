import { apiRequest } from "./api";

export async function joinTableWithQRToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("QR token is missing.");
  }

  return apiRequest("/api/qr/join", {
    method: "POST",
    body: JSON.stringify({
      token,
    }),
  });
}
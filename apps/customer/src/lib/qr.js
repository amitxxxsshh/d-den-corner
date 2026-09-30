import { apiRequest } from "./api";
import { setCustomerSessionToken } from "./session-token";

export async function joinTableWithQRToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("QR token is missing.");
  }

  const result = await apiRequest("/api/qr/join", {
    method: "POST",
    body: JSON.stringify({
      token,
    }),
  });

  const sessionToken = result?.token || result?.session?.token;
  if (sessionToken) {
    setCustomerSessionToken(sessionToken);
  }

  return result;
}
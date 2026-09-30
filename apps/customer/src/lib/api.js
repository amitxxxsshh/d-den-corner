import {
  getCustomerSessionToken,
  clearCustomerSessionToken,
} from "./session-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8787";

export async function apiRequest(
  path,
  options = {},
) {
  const token = getCustomerSessionToken();

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      cache: "no-store",
    },
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      (path.startsWith("/api/orders") || path.startsWith("/api/sessions"))
    ) {
      clearCustomerSessionToken();
    }

    const error = new Error(
      data?.message ||
        `Request failed with status ${response.status}.`,
    );

    error.status = response.status;

    throw error;
  }

  return data;
}
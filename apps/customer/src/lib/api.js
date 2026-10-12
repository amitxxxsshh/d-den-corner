import {
  getCustomerSessionToken,
  clearCustomerSessionToken,
} from "./session-token";

function getApiBaseUrl() {
  const url =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  // Ensure production builds never silently fall back to or use localhost
  if (process.env.NODE_ENV === "production") {
    if (url && !url.includes("localhost") && !url.includes("127.0.0.1")) {
      return url.replace(/\/$/, "");
    }
    return "https://api.soaiterbtech2024.workers.dev";
  }

  if (url) {
    return url.replace(/\/$/, "");
  }

  return "http://localhost:8787";
}

const API_BASE_URL = getApiBaseUrl();

export async function apiRequest(
  path,
  options = {},
) {
  const token = getCustomerSessionToken();
  const { timeoutMs = 15000, signal: callerSignal, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error("Request timed out."));
  }, timeoutMs);

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort(callerSignal.reason);
    } else {
      callerSignal.addEventListener("abort", () => {
        controller.abort(callerSignal.reason);
      });
    }
  }

  let response;
  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...fetchOptions,
        signal: controller.signal,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(fetchOptions.headers || {}),
        },
        cache: "no-store",
      },
    );
  } catch (err) {
    if (controller.signal.aborted && !callerSignal?.aborted) {
      const timeoutError = new Error(
        "Connection request timed out. Please check your network and try again.",
      );
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

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
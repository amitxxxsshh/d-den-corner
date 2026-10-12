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
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
      credentials: "include",
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
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}.`,
    );
  }

  return data;
}

export default apiRequest;
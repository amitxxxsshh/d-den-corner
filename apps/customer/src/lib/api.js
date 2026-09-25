const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787";

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      "Something went wrong. Please try again.";

    throw new ApiError(message, response.status, data);
  }

  return data;
}
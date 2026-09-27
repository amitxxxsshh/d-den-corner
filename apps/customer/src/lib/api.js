const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8787";

export async function apiRequest(
  path,
  options = {},
) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
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
    const error = new Error(
      data?.message ||
        `Request failed with status ${response.status}.`,
    );

    error.status = response.status;

    throw error;
  }

  return data;
}
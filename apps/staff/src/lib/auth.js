import { apiRequest } from "./api";

export async function loginStaff(
  email,
  password,
) {
  return apiRequest(
    "/api/staff/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );
}

export async function getCurrentStaff() {
  return apiRequest(
    "/api/staff/auth/me",
  );
}

export async function logoutStaff() {
  return apiRequest(
    "/api/staff/auth/logout",
    {
      method: "POST",
    },
  );
}
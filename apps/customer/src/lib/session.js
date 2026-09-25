import { apiRequest } from "./api";

export async function getCustomerSession() {
  return apiRequest("/api/sessions/me");
}
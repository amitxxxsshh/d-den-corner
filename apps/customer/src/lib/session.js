import { apiRequest } from "./api";
import {
  getCustomerSessionToken,
  setCustomerSessionToken,
  clearCustomerSessionToken,
} from "./session-token";

export {
  getCustomerSessionToken,
  setCustomerSessionToken,
  clearCustomerSessionToken,
};

export async function getCustomerSession() {
  return apiRequest("/api/sessions/me");
}

export async function leaveCustomerSession() {
  try {
    await apiRequest("/api/sessions/leave", {
      method: "POST",
    });
  } finally {
    clearCustomerSessionToken();
  }
}
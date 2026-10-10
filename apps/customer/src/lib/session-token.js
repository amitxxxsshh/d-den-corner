const CUSTOMER_SESSION_STORAGE_KEY = "dd_customer_session_token";

export function getCustomerSessionToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setCustomerSessionToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (token) {
      window.sessionStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (e.g. storage disabled or quota exceeded)
  }
}

export function clearCustomerSessionToken() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

const QR_TOKEN_STORAGE_KEY = "dd_customer_qr_token";

export function getQRToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(QR_TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setQRToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (token) {
      window.sessionStorage.setItem(QR_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(QR_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (e.g. storage disabled or quota exceeded)
  }
}

export function clearQRToken() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(QR_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}


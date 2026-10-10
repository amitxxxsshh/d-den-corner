"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCustomerSession,
  getCustomerSessionToken,
  clearCustomerSessionToken,
  clearQRToken,
  leaveCustomerSession,
} from "../../lib/session";

const CustomerSessionContext = createContext(null);

export function CustomerSessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const refreshSession = useCallback(async () => {
    setError(null);

    const token = getCustomerSessionToken();
    if (!token) {
      setSession(null);
      setStatus("unauthenticated");
      return null;
    }

    try {
      const result = await getCustomerSession();

      setSession(result?.session || null);
      setStatus("authenticated");
      return result?.session || null;
    } catch (err) {
      setSession(null);

      if (err?.status === 401 || err?.status === 404) {
        clearCustomerSessionToken();
        setStatus("unauthenticated");
      } else {
        setStatus("error");
        setError(
          err?.message ||
            "Unable to load your table session.",
        );
      }
      return null;
    }
  }, []);

  const leaveSession = useCallback(async () => {
    try {
      await leaveCustomerSession();
    } catch {
      clearCustomerSessionToken();
      clearQRToken();
    } finally {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      session,
      status,
      error,
      refreshSession,
      leaveSession,
      isAuthenticated: status === "authenticated",
    }),
    [session, status, error, refreshSession, leaveSession],
  );

  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);

  if (!context) {
    throw new Error(
      "useCustomerSession must be used inside CustomerSessionProvider.",
    );
  }

  return context;
}
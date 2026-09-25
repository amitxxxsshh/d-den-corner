"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getCustomerSession } from "../../lib/session";

const CustomerSessionContext = createContext(null);

export function CustomerSessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const refreshSession = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const result = await getCustomerSession();

      setSession(result?.session || null);
      setStatus("authenticated");
    } catch (err) {
      setSession(null);

      if (err?.status === 401) {
        setStatus("unauthenticated");
      } else {
        setStatus("error");
        setError(
          err?.message ||
            "Unable to load your table session.",
        );
      }
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
      isAuthenticated: status === "authenticated",
    }),
    [session, status, error, refreshSession],
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
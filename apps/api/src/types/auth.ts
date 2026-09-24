export type AuthenticatedUser = {
  id: string;
  email: string;
  role: "STAFF" | "ADMIN";
};

export type CustomerSessionContext = {
  customerSessionId: string;
  tableSessionId: string;
  tableId: string;
};

export type StaffAuthContext = {
  userId: string;
  role: "STAFF" | "ADMIN";
};
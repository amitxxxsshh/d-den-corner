import type { D1Database } from "@cloudflare/workers-types";

import { queryOne } from "./index";
import type { UserRow } from "../types/database";

export async function getUserById(
  db: D1Database,
  userId: string
): Promise<UserRow | null> {
  return queryOne<UserRow>(
    db,
    `
      SELECT
        id,
        email,
        role,
        active,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    userId
  );
}

export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<UserRow | null> {
  return queryOne<UserRow>(
    db,
    `
      SELECT
        id,
        email,
        role,
        active,
        created_at,
        updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    email
  );
}
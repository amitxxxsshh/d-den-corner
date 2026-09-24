import type { D1Database } from "@cloudflare/workers-types";

export async function queryMany<T>(
  db: D1Database,
  sql: string,
  ...bindings: unknown[]
): Promise<T[]> {
  const result = await db
    .prepare(sql)
    .bind(...bindings)
    .all<T>();

  return result.results;
}

export async function queryOne<T>(
  db: D1Database,
  sql: string,
  ...bindings: unknown[]
): Promise<T | null> {
  const result = await db
    .prepare(sql)
    .bind(...bindings)
    .first<T>();

  return result ?? null;
}

export async function execute(
  db: D1Database,
  sql: string,
  ...bindings: unknown[]
) {
  return db
    .prepare(sql)
    .bind(...bindings)
    .run();
}
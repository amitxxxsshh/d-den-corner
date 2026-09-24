import type { D1Database } from "@cloudflare/workers-types";

import { queryMany } from "./index";
import type { AuditLogRow } from "../types/database";

export async function getAuditLogsForEntity(
  db: D1Database,
  entityType: string,
  entityId: string
): Promise<AuditLogRow[]> {
  return queryMany<AuditLogRow>(
    db,
    `
      SELECT
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        details_json,
        created_at
      FROM audit_logs
      WHERE entity_type = ?
        AND entity_id = ?
      ORDER BY created_at DESC
    `,
    entityType,
    entityId
  );
}

export async function getRecentAuditLogs(
  db: D1Database,
  limit = 100
): Promise<AuditLogRow[]> {
  return queryMany<AuditLogRow>(
    db,
    `
      SELECT
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        details_json,
        created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ?
    `,
    limit
  );
}
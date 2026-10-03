import assert from "node:assert";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

import worker from "../src/index";
import {
  getDashboardRevenue,
  getStaffOrderHistory,
  cleanupOldAcceptedOrders,
} from "../src/db/dashboard";
import {
  getTimezoneBoundaries,
  getSixMonthsAgoIso,
  DEFAULT_BUSINESS_TIMEZONE,
} from "../src/utils/timezone";
import { sha256Hex } from "../src/utils/crypto";

// ============================================================
// D1 Database Shim over node:sqlite
// ============================================================
function createD1Shim(sqlite: DatabaseSync) {
  return {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first<T = unknown>(): Promise<T | null> {
              const stmt = sqlite.prepare(sql);
              const result = stmt.get(...args);
              return (result as T) ?? null;
            },
            async all<T = unknown>(): Promise<{ results: T[]; success: boolean }> {
              const stmt = sqlite.prepare(sql);
              const results = stmt.all(...args) as T[];
              return { results, success: true };
            },
            async run(): Promise<{ meta: { changes: number; last_row_id: number }; success: boolean }> {
              const stmt = sqlite.prepare(sql);
              const info = stmt.run(...args);
              return {
                meta: {
                  changes: info.changes,
                  last_row_id: Number(info.lastInsertRowid),
                },
                success: true,
              };
            },
          };
        },
      };
    },
    async batch(statements: Array<{ run: () => Promise<unknown> }>) {
      return Promise.all(statements.map((s) => s.run()));
    },
  };
}

import path from "node:path";

// Setup SQLite and run all migrations
function initTestDb() {
  const sqlite = new DatabaseSync(":memory:");
  const migrationNames = [
    "0001_initial_schema.sql",
    "0002_active_table_session.sql",
    "0003__staff_auth.sql",
    "0004_staff_passwords.sql",
    "0005_order_accepted_at.sql",
    "0006_qr_tokens_raw_token.sql",
  ];

  for (const name of migrationNames) {
    const filePath = path.resolve(import.meta.dirname, "../migrations", name);
    const sql = fs.readFileSync(filePath, "utf-8");
    sqlite.exec(sql);
  }

  return { sqlite, d1: createD1Shim(sqlite) };
}

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING STAFF DASHBOARD & REVENUE TEST SUITE");
  console.log("=================================================\n");

  const { sqlite, d1 } = initTestDb();

  // Seed baseline data: location, table, user, session, menu
  sqlite.exec(`
    INSERT INTO locations (id, name, active) VALUES ('loc-1', 'Main Hall', 1);
    INSERT INTO tables (id, location_id, name, active) VALUES ('tbl-1', 'loc-1', 'Table 1', 1);
    INSERT INTO users (id, email, role, active) VALUES ('staff-user-1', 'staff@ddencorner.local', 'STAFF', 1);
    INSERT INTO menu_categories (id, name, sort_order, active) VALUES ('cat-1', 'Curries', 1, 1);
    INSERT INTO menu_items (id, category_id, name, price_minor, available, archived)
      VALUES ('item-1', 'cat-1', 'Paneer Butter Masala', 25000, 1, 0);
  `);

  // Create staff session token for auth tests
  const rawStaffToken = "test-staff-session-secret-token";
  const staffTokenHash = await sha256Hex(rawStaffToken);
  sqlite.exec(`
    INSERT INTO staff_sessions (id, user_id, token_hash, expires_at)
    VALUES ('sess-1', 'staff-user-1', '${staffTokenHash}', datetime('now', '+1 day'));
  `);

  const staffCookieHeader = `ddc_staff_session=${rawStaffToken}`;

  // -------------------------------------------------------------
  // TEST 1: Timezone boundaries (Asia/Kolkata)
  // -------------------------------------------------------------
  console.log("✓ Test 1: Business Timezone (Asia/Kolkata) boundaries");
  {
    const refDate = new Date("2026-10-01T16:05:20.000Z"); // 21:35:20 IST on Oct 1, 2026
    const boundaries = getTimezoneBoundaries(refDate, "Asia/Kolkata");

    assert.strictEqual(boundaries.localDate, "2026-10-01");
    assert.strictEqual(boundaries.localMonth, "2026-10");
    // In IST (+05:30), start of day Oct 1 is 18:30:00 on Sept 30 UTC
    assert.strictEqual(boundaries.today.start, "2026-09-30T18:30:00.000Z");
    assert.strictEqual(boundaries.today.end, "2026-10-01T18:29:59.999Z");
    // Start of October is 2026-09-30T18:30:00.000Z
    assert.strictEqual(boundaries.month.start, "2026-09-30T18:30:00.000Z");
    // End of October (31 days) is 2026-10-31T18:29:59.999Z
    assert.strictEqual(boundaries.month.end, "2026-10-31T18:29:59.999Z");

    const sixMonthsAgo = getSixMonthsAgoIso(refDate);
    assert.strictEqual(sixMonthsAgo, "2026-04-01T16:05:20.000Z");
  }

  // -------------------------------------------------------------
  // TEST 2: Staff Authorization
  // -------------------------------------------------------------
  console.log("✓ Test 2: Staff Authorization protection");
  {
    // Without staff auth -> 401
    const unauthRevenue = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/revenue"),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(unauthRevenue.status, 401);

    const unauthHistory = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history"),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(unauthHistory.status, 401);

    const unauthCleanup = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/cleanup", { method: "POST" }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(unauthCleanup.status, 401);

    // With staff cookie -> 200 OK
    const authRevenue = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/revenue", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(authRevenue.status, 200);
    const revBody = await authRevenue.json();
    assert.strictEqual(revBody.ok, true);
    assert.strictEqual(revBody.today.revenueMinor, 0);
  }

  // -------------------------------------------------------------
  // TEST 3: Order Lifecycle, History & Revenue Calculation
  // -------------------------------------------------------------
  console.log("✓ Test 3: Order Lifecycle, History & Revenue rules");
  {
    // Create customer and table sessions
    const tableSessionId = "ts-test-1";
    const customerSessionId = "cs-test-1";
    sqlite.exec(`
      INSERT INTO table_sessions (id, table_id, status) VALUES ('${tableSessionId}', 'tbl-1', 'ACTIVE');
      INSERT INTO customer_sessions (id, table_session_id, session_token_hash, expires_at)
        VALUES ('${customerSessionId}', '${tableSessionId}', 'dummy-hash', datetime('now', '+1 hour'));
    `);

    // Place a NEW order (Total = 50,000 minor / ₹500)
    const orderId = "order-test-1";
    sqlite.exec(`
      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('${orderId}', '${tableSessionId}', '${customerSessionId}', 'NEW', 50000, NULL, '2026-10-01T10:00:00.000Z', '2026-10-01T10:00:00.000Z');

      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-1', '${orderId}', 'item-1', 'Paneer Butter Masala', 25000, 2, 50000);
    `);

    const refDate = new Date("2026-10-01T16:05:20.000Z");

    // A) While status is 'NEW', it must NOT appear in history and NOT contribute to revenue
    const revenueBeforeAccept = await getDashboardRevenue(d1 as any, DEFAULT_BUSINESS_TIMEZONE, refDate);
    assert.strictEqual(revenueBeforeAccept.today.revenueMinor, 0, "NEW order must not contribute to today's revenue");
    assert.strictEqual(revenueBeforeAccept.month.revenueMinor, 0, "NEW order must not contribute to monthly revenue");

    const historyBeforeAccept = await getStaffOrderHistory(d1 as any, { referenceDate: refDate });
    const foundInHistoryBefore = historyBeforeAccept.orders.some((o) => o.id === orderId);
    assert.strictEqual(foundInHistoryBefore, false, "NEW/unaccepted order must NOT appear in Order History");

    // B) Advance order to ACCEPTED via staff endpoint
    const advanceRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderId}/status`, {
        method: "POST",
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(advanceRes.status, 200);

    // Verify accepted_at was populated
    const acceptedOrderRow = sqlite.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
    assert.strictEqual(acceptedOrderRow.status, "ACCEPTED");
    assert.ok(acceptedOrderRow.accepted_at, "accepted_at must be populated when order is accepted");

    // Override accepted_at for controlled deterministic boundary test
    const acceptedAtToday = "2026-10-01T12:00:00.000Z"; // within today (Oct 1)
    sqlite.exec(`UPDATE orders SET accepted_at = '${acceptedAtToday}' WHERE id = '${orderId}';`);

    // C) After acceptance, it MUST contribute to revenue and MUST appear in Order History
    const revenueAfterAccept = await getDashboardRevenue(d1 as any, DEFAULT_BUSINESS_TIMEZONE, refDate);
    assert.strictEqual(revenueAfterAccept.today.revenueMinor, 50000, "Accepted order must contribute to today's revenue");
    assert.strictEqual(revenueAfterAccept.today.ordersCount, 1);
    assert.strictEqual(revenueAfterAccept.month.revenueMinor, 50000, "Accepted order must contribute to monthly revenue");
    assert.strictEqual(revenueAfterAccept.month.ordersCount, 1);

    const historyAfterAccept = await getStaffOrderHistory(d1 as any, { referenceDate: refDate });
    const historicalOrder = historyAfterAccept.orders.find((o) => o.id === orderId);
    assert.ok(historicalOrder, "Accepted order must appear in Order History");
    assert.strictEqual(historicalOrder?.total_amount_minor, 50000);
    assert.strictEqual(historicalOrder?.table?.name, "Table 1");
    assert.strictEqual(historicalOrder?.items.length, 1);
    assert.strictEqual(historicalOrder?.items[0].quantity, 2);

    // D) Advance through PREPARING -> READY -> SERVED
    sqlite.exec(`UPDATE orders SET status = 'SERVED' WHERE id = '${orderId}';`);
    const historyAfterServed = await getStaffOrderHistory(d1 as any, { referenceDate: refDate });
    const servedOrder = historyAfterServed.orders.find((o) => o.id === orderId);
    assert.ok(servedOrder, "SERVED order must remain in Order History");
    assert.strictEqual(servedOrder?.status, "SERVED");
  }

  // -------------------------------------------------------------
  // TEST 4: Date Boundaries & Revenue Consistency
  // -------------------------------------------------------------
  console.log("✓ Test 4: Revenue calendar boundaries (IST)");
  {
    const refDate = new Date("2026-10-01T16:05:20.000Z"); // Oct 1, 2026

    // Add Order 2: Accepted on Sept 30 in IST (prior calendar day, prior calendar month)
    // 2026-09-30 12:00:00 IST = 2026-09-30T06:30:00.000Z
    sqlite.exec(`
      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-yesterday', 'ts-test-1', 'cs-test-1', 'SERVED', 30000, '2026-09-30T06:30:00.000Z', '2026-09-30T06:00:00.000Z', '2026-09-30T07:00:00.000Z');
    `);

    const rev = await getDashboardRevenue(d1 as any, DEFAULT_BUSINESS_TIMEZONE, refDate);
    // Today's revenue must still be only order 1 (50000), NOT order 2 (30000)
    assert.strictEqual(rev.today.revenueMinor, 50000, "Yesterday's order must NOT contribute to Today's Revenue");
    // Monthly revenue for October must also be only order 1 (50000), since Sept 30 is September
    assert.strictEqual(rev.month.revenueMinor, 50000, "Previous month's order must NOT contribute to October Monthly Revenue");
  }

  // -------------------------------------------------------------
  // TEST 5: Order History Pagination & Status Filtering
  // -------------------------------------------------------------
  console.log("✓ Test 5: Order History pagination and status filters");
  {
    const refDate = new Date("2026-10-01T16:05:20.000Z");

    // Insert additional orders
    for (let i = 1; i <= 5; i++) {
      sqlite.exec(`
        INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
        VALUES ('order-page-${i}', 'ts-test-1', 'cs-test-1', '${i % 2 === 0 ? "ACCEPTED" : "SERVED"}', 10000 * ${i}, '2026-10-01T1${i}:00:00.000Z', '2026-10-01T1${i}:00:00.000Z', '2026-10-01T1${i}:00:00.000Z');
      `);
    }

    // Page 1, limit 2
    const page1 = await getStaffOrderHistory(d1 as any, { page: 1, limit: 2, referenceDate: refDate });
    assert.strictEqual(page1.orders.length, 2);
    assert.strictEqual(page1.pagination.page, 1);
    assert.strictEqual(page1.pagination.limit, 2);
    assert.ok(page1.pagination.total >= 7);

    // Page 2, limit 2
    const page2 = await getStaffOrderHistory(d1 as any, { page: 2, limit: 2, referenceDate: refDate });
    assert.strictEqual(page2.orders.length, 2);
    assert.notStrictEqual(page1.orders[0].id, page2.orders[0].id);

    // Filter by status=ACCEPTED
    const acceptedOnly = await getStaffOrderHistory(d1 as any, { status: "ACCEPTED", referenceDate: refDate });
    assert.ok(acceptedOnly.orders.length > 0);
    assert.ok(acceptedOnly.orders.every((o) => o.status === "ACCEPTED"));
  }

  // -------------------------------------------------------------
  // TEST 6: Six-Month Retention Policy and Cleanup Safety
  // -------------------------------------------------------------
  console.log("✓ Test 6: 6-Month historical retention and cleanup safety");
  {
    const refDate = new Date("2026-10-01T16:05:20.000Z");
    // 7 months ago: ~2026-03-01
    const sevenMonthsAgo = "2026-03-01T10:00:00.000Z";
    const twoMonthsAgo = "2026-08-01T10:00:00.000Z";

    // 1. Historical completed order older than 6 months (SHOULD BE CLEANED UP)
    sqlite.exec(`
      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-old-served', 'ts-test-1', 'cs-test-1', 'SERVED', 20000, '${sevenMonthsAgo}', '${sevenMonthsAgo}', '${sevenMonthsAgo}');

      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-old-served', 'order-old-served', 'item-1', 'Paneer Butter Masala', 20000, 1, 20000);

      INSERT INTO order_status_history (id, order_id, from_status, to_status, created_at)
      VALUES ('osh-old-served', 'order-old-served', 'NEW', 'ACCEPTED', '${sevenMonthsAgo}');
    `);

    // 2. Old order that is still in active kitchen prep (SAFETY CHECK: MUST NOT BE CLEANED UP)
    sqlite.exec(`
      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-old-active', 'ts-test-1', 'cs-test-1', 'PREPARING', 22000, '${sevenMonthsAgo}', '${sevenMonthsAgo}', '${sevenMonthsAgo}');

      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-old-active', 'order-old-active', 'item-1', 'Paneer Butter Masala', 22000, 1, 22000);
    `);

    // 3. Recent completed order (2 months old, within 6 months) (MUST NOT BE CLEANED UP)
    sqlite.exec(`
      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-recent-served', 'ts-test-1', 'cs-test-1', 'SERVED', 25000, '${twoMonthsAgo}', '${twoMonthsAgo}', '${twoMonthsAgo}');
    `);

    // Verify 7-month-old order is excluded from Order History view
    const historyView = await getStaffOrderHistory(d1 as any, { referenceDate: refDate });
    const foundOldInHistory = historyView.orders.some((o) => o.id === "order-old-served");
    assert.strictEqual(foundOldInHistory, false, "Orders older than 6 months must not appear in Order History");

    // Execute retention cleanup
    const cleanupResult = await cleanupOldAcceptedOrders(d1 as any, { referenceDate: refDate });
    assert.ok(cleanupResult.deletedOrdersCount >= 1, "At least 1 order should be deleted");

    // Verify order-old-served and its items/history are deleted
    const oldServed = sqlite.prepare("SELECT * FROM orders WHERE id = 'order-old-served'").get();
    assert.strictEqual(oldServed, undefined, "order-old-served must be purged from database");

    const oldServedItems = sqlite.prepare("SELECT * FROM order_items WHERE order_id = 'order-old-served'").all();
    assert.strictEqual(oldServedItems.length, 0, "order_items for old-served must be purged");

    const oldServedHistory = sqlite.prepare("SELECT * FROM order_status_history WHERE order_id = 'order-old-served'").all();
    assert.strictEqual(oldServedHistory.length, 0, "order_status_history for old-served must be purged");

    // CRITICAL SAFETY CHECK: Old active order must still exist!
    const oldActive = sqlite.prepare("SELECT * FROM orders WHERE id = 'order-old-active'").get();
    assert.ok(oldActive, "ACTIVE order (PREPARING) must NEVER be deleted even if old");

    // Recent served order must still exist
    const recentServed = sqlite.prepare("SELECT * FROM orders WHERE id = 'order-recent-served'").get();
    assert.ok(recentServed, "Recent served order (< 6 months) must NOT be deleted");

    // Cleanup should be idempotent
    const rerun = await cleanupOldAcceptedOrders(d1 as any, { referenceDate: refDate });
    assert.strictEqual(rerun.deletedOrdersCount, 0, "Repeated cleanup must be idempotent (0 deleted)");
  }

  // -------------------------------------------------------------
  // TEST 7: Scheduled handler verification
  // -------------------------------------------------------------
  console.log("✓ Test 7: Cloudflare Worker scheduled background handler");
  {
    let waitUntilPromise: Promise<unknown> | null = null;
    const mockCtx = {
      waitUntil(p: Promise<unknown>) {
        waitUntilPromise = p;
      },
      passThroughOnException() {},
    };

    await worker.scheduled(
      { scheduledTime: Date.now(), cron: "0 3 * * *" } as any,
      { DB: d1 } as any,
      mockCtx as any,
    );

    assert.ok(waitUntilPromise, "ctx.waitUntil should have been called with cleanup task");
    await waitUntilPromise;
  }

  // -------------------------------------------------------------
  // TEST 8: Day-Mode Order History & Timezone Midnight Boundaries
  // -------------------------------------------------------------
  console.log("✓ Test 8: Day-Mode Order History & Timezone Midnight Boundaries");
  {
    // Sept 30 in IST ends at 2026-09-30T18:29:59.999Z
    // Oct 1 in IST starts at 2026-09-30T18:30:00.000Z
    // Oct 1 in IST ends at 2026-10-01T18:29:59.999Z
    // Oct 2 in IST starts at 2026-10-01T18:30:00.000Z

    // Insert order right at midnight start of Oct 1 (18:30:00 UTC Sept 30)
    sqlite.exec(`
      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-oct1-midnight', 'ts-test-1', 'cs-test-1', 'ACCEPTED', 15000, '2026-09-30T18:30:00.000Z', '2026-09-30T18:30:00.000Z', '2026-09-30T18:30:00.000Z');
      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-oct1-m', 'order-oct1-midnight', 'item-1', 'Paneer Butter Masala', 15000, 1, 15000);

      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-sept30-late', 'ts-test-1', 'cs-test-1', 'ACCEPTED', 16000, '2026-09-30T18:29:59.000Z', '2026-09-30T18:29:59.000Z', '2026-09-30T18:29:59.000Z');
      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-sep30-l', 'order-sept30-late', 'item-1', 'Paneer Butter Masala', 16000, 1, 16000);
    `);

    const refDate = new Date("2026-10-01T20:00:00.000Z");

    // Query for 2026-10-01:
    // Must include 'order-oct1-midnight' (18:30:00Z)
    // Must NOT include 'order-sept30-late' (18:29:59Z)
    const oct1History = await getStaffOrderHistory(d1 as any, {
      date: "2026-10-01",
      referenceDate: refDate,
    });
    assert.strictEqual(oct1History.orders.some((o) => o.id === "order-oct1-midnight"), true);
    assert.strictEqual(oct1History.orders.some((o) => o.id === "order-sept30-late"), false);
    assert.strictEqual(oct1History.filter?.type, "day");
    assert.strictEqual(oct1History.filter?.date, "2026-10-01");

    // Query for 2026-09-30:
    // Must include 'order-sept30-late'
    // Must NOT include 'order-oct1-midnight'
    const sept30History = await getStaffOrderHistory(d1 as any, {
      date: "2026-09-30",
      referenceDate: refDate,
    });
    assert.strictEqual(sept30History.orders.some((o) => o.id === "order-sept30-late"), true);
    assert.strictEqual(sept30History.orders.some((o) => o.id === "order-oct1-midnight"), false);

    // Empty date check: a past date with no orders
    const emptyDayHistory = await getStaffOrderHistory(d1 as any, {
      date: "2026-09-01",
      referenceDate: refDate,
    });
    assert.strictEqual(emptyDayHistory.orders.length, 0);
    assert.strictEqual(emptyDayHistory.pagination.total, 0);

    // Date older than 6 months gracefully returns empty results
    const oldDateHistory = await getStaffOrderHistory(d1 as any, {
      date: "2025-01-01",
      referenceDate: refDate,
    });
    assert.strictEqual(oldDateHistory.orders.length, 0);

    // Verify October 2, 2026 handling explicitly
    // In IST:
    // October 2 starts at 2026-10-01T18:30:00.000Z
    // October 2 ends (half-open) at 2026-10-02T18:30:00.000Z
    // October 3 starts at 2026-10-02T18:30:00.000Z
    sqlite.exec(`
      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-oct2-start', 'ts-test-1', 'cs-test-1', 'ACCEPTED', 10000, '2026-10-01T18:30:00.000Z', '2026-10-01T18:30:00.000Z', '2026-10-01T18:30:00.000Z');
      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-oct2-start', 'order-oct2-start', 'item-1', 'Paneer Butter Masala', 10000, 1, 10000);

      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-oct2-noon', 'ts-test-1', 'cs-test-1', 'SERVED', 12000, '2026-10-02T06:30:00.000Z', '2026-10-02T06:30:00.000Z', '2026-10-02T06:30:00.000Z');
      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-oct2-noon', 'order-oct2-noon', 'item-1', 'Paneer Butter Masala', 12000, 1, 12000);

      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-oct2-late', 'ts-test-1', 'cs-test-1', 'ACCEPTED', 14000, '2026-10-02T18:29:59.999Z', '2026-10-02T18:29:59.999Z', '2026-10-02T18:29:59.999Z');
      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-oct2-late', 'order-oct2-late', 'item-1', 'Paneer Butter Masala', 14000, 1, 14000);

      INSERT INTO orders (id, table_session_id, customer_session_id, status, total_amount_minor, accepted_at, created_at, updated_at)
      VALUES ('order-oct3-start', 'ts-test-1', 'cs-test-1', 'ACCEPTED', 18000, '2026-10-02T18:30:00.000Z', '2026-10-02T18:30:00.000Z', '2026-10-02T18:30:00.000Z');
      INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor)
      VALUES ('oi-oct3-start', 'order-oct3-start', 'item-1', 'Paneer Butter Masala', 18000, 1, 18000);
    `);

    const refDateOct3 = new Date("2026-10-03T12:00:00.000Z");

    const oct2History = await getStaffOrderHistory(d1 as any, {
      date: "2026-10-02",
      referenceDate: refDateOct3,
    });
    assert.strictEqual(oct2History.filter?.type, "day");
    assert.strictEqual(oct2History.filter?.date, "2026-10-02");
    assert.strictEqual(oct2History.orders.some((o) => o.id === "order-oct2-start"), true);
    assert.strictEqual(oct2History.orders.some((o) => o.id === "order-oct2-noon"), true);
    assert.strictEqual(oct2History.orders.some((o) => o.id === "order-oct2-late"), true);
    assert.strictEqual(oct2History.orders.some((o) => o.id === "order-oct3-start"), false);

    const oct3History = await getStaffOrderHistory(d1 as any, {
      date: "2026-10-03",
      referenceDate: refDateOct3,
    });
    assert.strictEqual(oct3History.orders.some((o) => o.id === "order-oct3-start"), true);
    assert.strictEqual(oct3History.orders.some((o) => o.id === "order-oct2-late"), false);
  }

  // -------------------------------------------------------------
  // TEST 9: Month-Mode Order History & Grouping Verification
  // -------------------------------------------------------------
  console.log("✓ Test 9: Month-Mode Order History & Aggregation");
  {
    const refDate = new Date("2026-10-03T20:00:00.000Z");

    // Query October 2026
    const octMonthHistory = await getStaffOrderHistory(d1 as any, {
      month: "2026-10",
      referenceDate: refDate,
    });
    assert.ok(octMonthHistory.orders.length > 0);
    assert.strictEqual(octMonthHistory.filter?.type, "month");
    assert.strictEqual(octMonthHistory.filter?.month, "2026-10");
    // All orders in October must have accepted_at in October IST
    for (const o of octMonthHistory.orders) {
      assert.ok(o.accepted_at! >= "2026-09-30T18:30:00.000Z" && o.accepted_at! < "2026-10-31T18:30:00.000Z");
    }

    // Query September 2026
    const sepMonthHistory = await getStaffOrderHistory(d1 as any, {
      month: "2026-09",
      referenceDate: refDate,
    });
    assert.ok(sepMonthHistory.orders.length > 0);
    for (const o of sepMonthHistory.orders) {
      assert.ok(o.accepted_at! >= "2026-08-31T18:30:00.000Z" && o.accepted_at! < "2026-09-30T18:30:00.000Z");
    }

    // Month with no orders returns empty
    const emptyMonthHistory = await getStaffOrderHistory(d1 as any, {
      month: "2026-07",
      referenceDate: refDate,
    });
    assert.strictEqual(emptyMonthHistory.orders.length, 0);
  }

  // -------------------------------------------------------------
  // TEST 10: API Endpoint Validation (Future dates, malformed, conflicts)
  // -------------------------------------------------------------
  console.log("✓ Test 10: API endpoint validation for dates, months, pagination");
  {
    // A) Both date and month provided simultaneously -> 400 Bad Request
    const conflictRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?date=2026-10-01&month=2026-10", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(conflictRes.status, 400);
    const conflictBody = await conflictRes.json();
    assert.strictEqual(conflictBody.ok, false);
    assert.ok(conflictBody.error.includes("simultaneously"));

    // B) Future date -> 400 Bad Request
    const futureDateRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?date=2099-01-01", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(futureDateRes.status, 400);
    const futureDateBody = await futureDateRes.json();
    assert.strictEqual(futureDateBody.ok, false);
    assert.ok(futureDateBody.error.includes("future"));

    // C) Malformed / impossible date (e.g. 2026-02-30) -> 400 Bad Request
    const impossibleDateRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?date=2026-02-30", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(impossibleDateRes.status, 400);

    const malformedDateRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?date=invalid-date", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(malformedDateRes.status, 400);

    // D) Future month -> 400 Bad Request
    const futureMonthRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?month=2099-01", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(futureMonthRes.status, 400);

    // E) Malformed month (e.g. 2026-13) -> 400 Bad Request
    const badMonthRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?month=2026-13", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(badMonthRes.status, 400);

    // F) Invalid pagination (e.g. page=-1, limit=abc) -> 400 Bad Request
    const badPageRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?page=-1", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(badPageRes.status, 400);

    const badLimitRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?limit=xyz", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(badLimitRes.status, 400);

    // G) Valid date request succeeds with 200 and filter metadata
    const validDayRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?date=2026-09-30", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(validDayRes.status, 200);
    const validDayBody = await validDayRes.json();
    assert.strictEqual(validDayBody.ok, true);
    assert.strictEqual(validDayBody.filter.type, "day");
    assert.strictEqual(validDayBody.filter.date, "2026-09-30");

    // H) Valid month request succeeds with 200
    const validMonthRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?month=2026-09", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(validMonthRes.status, 200);
    const validMonthBody = await validMonthRes.json();
    assert.strictEqual(validMonthBody.ok, true);
    assert.strictEqual(validMonthBody.filter.type, "month");
    assert.strictEqual(validMonthBody.filter.month, "2026-09");

    // I) Valid October 2 Day mode request succeeds with 200 and returns October 2 orders
    const oct2ApiRes = await worker.fetch(
      new Request("http://localhost/api/staff/dashboard/history?date=2026-10-02", {
        headers: { Cookie: staffCookieHeader },
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(oct2ApiRes.status, 200);
    const oct2ApiBody = await oct2ApiRes.json();
    assert.strictEqual(oct2ApiBody.ok, true);
    assert.strictEqual(oct2ApiBody.filter.type, "day");
    assert.strictEqual(oct2ApiBody.filter.date, "2026-10-02");
    assert.strictEqual(oct2ApiBody.orders.some((o: any) => o.id === "order-oct2-noon"), true);
  }

  console.log("\n=================================================");
  console.log("ALL 10 TEST SUITES PASSED CLEANLY!");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});

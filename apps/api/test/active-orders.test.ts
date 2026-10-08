import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import worker from "../src/index";
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

async function runActiveOrdersTests() {
  console.log("=================================================");
  console.log("RUNNING MULTIPLE INDEPENDENT ORDERS PER TABLE TEST SUITE");
  console.log("=================================================\n");

  const { sqlite, d1 } = initTestDb();

  // Baseline database seeds
  sqlite.exec(`
    INSERT INTO locations (id, name, active) VALUES ('loc-1', 'Main Dining Hall', 1);
    INSERT INTO tables (id, location_id, name, active) VALUES
      ('tbl-3', 'loc-1', 'Table 3', 1),
      ('tbl-1', 'loc-1', 'Table 1', 1),
      ('tbl-10', 'loc-1', 'Table 10', 1),
      ('tbl-2', 'loc-1', 'Table 2', 1);

    INSERT INTO users (id, email, role, active) VALUES ('staff-user-1', 'staff@ddencorner.local', 'STAFF', 1);

    INSERT INTO menu_categories (id, name, sort_order, active) VALUES
      ('cat-1', 'Breads & Mains', 1, 1),
      ('cat-2', 'Beverages', 2, 1);

    INSERT INTO menu_items (id, category_id, name, price_minor, available, archived) VALUES
      ('item-paratha', 'cat-1', 'Laccha Paratha', 3990, 1, 0),
      ('item-biryani', 'cat-1', 'Chicken Biryani', 18000, 1, 0),
      ('item-coke', 'cat-2', 'Diet Coke', 5000, 1, 0),
      ('item-chai', 'cat-2', 'Masala Chai', 4000, 1, 0);

    INSERT INTO table_sessions (id, table_id, status) VALUES
      ('ts-1', 'tbl-1', 'ACTIVE'),
      ('ts-2', 'tbl-2', 'ACTIVE'),
      ('ts-3', 'tbl-3', 'ACTIVE'),
      ('ts-10', 'tbl-10', 'ACTIVE');
  `);

  const futureIso = new Date(Date.now() + 86400000).toISOString();

  // Customer session tokens
  const cs1Token = "customer-token-table-1";
  const cs1Hash = await sha256Hex(cs1Token);
  sqlite.exec(`
    INSERT INTO customer_sessions (id, table_session_id, session_token_hash, expires_at)
    VALUES ('cs-1', 'ts-1', '${cs1Hash}', '${futureIso}');
  `);

  const cs2Token = "customer-token-table-2";
  const cs2Hash = await sha256Hex(cs2Token);
  sqlite.exec(`
    INSERT INTO customer_sessions (id, table_session_id, session_token_hash, expires_at)
    VALUES ('cs-2', 'ts-2', '${cs2Hash}', '${futureIso}');
  `);

  const cs3Token = "customer-token-table-3";
  const cs3Hash = await sha256Hex(cs3Token);
  sqlite.exec(`
    INSERT INTO customer_sessions (id, table_session_id, session_token_hash, expires_at)
    VALUES ('cs-3', 'ts-3', '${cs3Hash}', '${futureIso}');
  `);

  const cs10Token = "customer-token-table-10";
  const cs10Hash = await sha256Hex(cs10Token);
  sqlite.exec(`
    INSERT INTO customer_sessions (id, table_session_id, session_token_hash, expires_at)
    VALUES ('cs-10', 'ts-10', '${cs10Hash}', '${futureIso}');
  `);

  // Staff session token
  const rawStaffToken = "test-staff-active-orders-token";
  const staffTokenHash = await sha256Hex(rawStaffToken);
  sqlite.exec(`
    INSERT INTO staff_sessions (id, user_id, token_hash, expires_at)
    VALUES ('sess-1', 'staff-user-1', '${staffTokenHash}', datetime('now', '+1 day'));
  `);

  const staffHeaders = {
    Cookie: `ddc_staff_session=${rawStaffToken}`,
    "Content-Type": "application/json",
  };

  const customerHeaders1 = {
    Authorization: `Bearer ${cs1Token}`,
    "Content-Type": "application/json",
  };

  // -------------------------------------------------------------
  // Scenario A: First order
  // -------------------------------------------------------------
  console.log("✓ Scenario A: Table 1 places first order (Laccha Paratha + Chicken Biryani)");
  let orderAId: string;
  {
    const createRes = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders1,
        body: JSON.stringify({
          items: [
            { menuItemId: "item-paratha", quantity: 1 },
            { menuItemId: "item-biryani", quantity: 1 },
          ],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    assert.strictEqual(createRes.status, 201);
    const body = await createRes.json();
    assert.strictEqual(body.ok, true);
    assert.ok(body.order.id, "Order ID must be generated");
    orderAId = body.order.id;
    assert.strictEqual(body.order.status, "NEW");
    assert.strictEqual(body.order.total_amount_minor, 3990 + 18000); // ₹219.90
    assert.strictEqual(body.order.items.length, 2);

    // Verify staff active orders returns Table 1 with 1 order
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(staffRes.status, 200);
    const staffBody = await staffRes.json();
    assert.strictEqual(staffBody.tables.length, 1);
    assert.strictEqual(staffBody.tables[0].tableName, "Table 1");
    assert.strictEqual(staffBody.tables[0].orders.length, 1);
    assert.strictEqual(staffBody.tables[0].orders[0].id, orderAId);
    assert.strictEqual(staffBody.tables[0].orders[0].status, "NEW");
  }

  // -------------------------------------------------------------
  // Scenario B: Subsequent order while the first is NEW
  // Must NOT merge! Must create a distinct order record with status NEW
  // -------------------------------------------------------------
  console.log("✓ Scenario B: Table 1 places Order B while Order A is NEW -> Distinct Order ID, both remain NEW");
  let orderBId: string;
  {
    const secondRes = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders1,
        body: JSON.stringify({
          items: [{ menuItemId: "item-coke", quantity: 2 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    assert.strictEqual(secondRes.status, 201);
    const secondBody = await secondRes.json();
    assert.strictEqual(secondBody.ok, true);
    orderBId = secondBody.order.id;

    // Distinct Order ID!
    assert.notStrictEqual(
      orderBId,
      orderAId,
      "Order B must receive a distinct Order ID from Order A",
    );
    assert.strictEqual(secondBody.order.status, "NEW");
    assert.strictEqual(secondBody.order.total_amount_minor, 10000); // 2 * 5000 = ₹100.00
    assert.strictEqual(secondBody.order.items.length, 1);

    // DB Verification: Exactly 2 distinct order records for this table session
    const orderRows = sqlite
      .prepare("SELECT * FROM orders WHERE table_session_id = 'ts-1' ORDER BY created_at ASC")
      .all() as any[];
    assert.strictEqual(orderRows.length, 2, "Must be 2 distinct order records in DB for Table 1");
    assert.strictEqual(orderRows[0].id, orderAId);
    assert.strictEqual(orderRows[0].status, "NEW");
    assert.strictEqual(orderRows[0].total_amount_minor, 21990);
    assert.strictEqual(orderRows[1].id, orderBId);
    assert.strictEqual(orderRows[1].status, "NEW");
    assert.strictEqual(orderRows[1].total_amount_minor, 10000);

    // Staff API Verification: Table 1 section contains 2 distinct orders
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    assert.strictEqual(staffBody.tables.length, 1);
    const t1 = staffBody.tables[0];
    assert.strictEqual(t1.orders.length, 2);
    assert.strictEqual(t1.orders[0].id, orderAId);
    assert.strictEqual(t1.orders[0].total_amount_minor, 21990);
    assert.strictEqual(t1.orders[1].id, orderBId);
    assert.strictEqual(t1.orders[1].total_amount_minor, 10000);
  }

  // -------------------------------------------------------------
  // Scenario C: Subsequent order after acceptance
  // Accept Order A. Then place Order C. Order A stays ACCEPTED, Order C is NEW.
  // -------------------------------------------------------------
  console.log("✓ Scenario C: Staff accepts Order A -> Order A ACCEPTED, Order B stays NEW, Order C placed as NEW");
  let orderCId: string;
  {
    // Accept Order A
    const acceptRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderAId}/status`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(acceptRes.status, 200);
    const acceptBody = await acceptRes.json();
    assert.strictEqual(acceptBody.order.status, "ACCEPTED");

    // Table 1 places Order C
    const thirdRes = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders1,
        body: JSON.stringify({
          items: [{ menuItemId: "item-chai", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(thirdRes.status, 201);
    const thirdBody = await thirdRes.json();
    orderCId = thirdBody.order.id;
    assert.notStrictEqual(orderCId, orderAId);
    assert.notStrictEqual(orderCId, orderBId);
    assert.strictEqual(thirdBody.order.status, "NEW");
    assert.strictEqual(thirdBody.order.total_amount_minor, 4000);

    // Verify all 3 orders on staff dashboard
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    const t1 = staffBody.tables[0];
    assert.strictEqual(t1.orders.length, 3);
    const ordA = t1.orders.find((o: any) => o.id === orderAId);
    const ordB = t1.orders.find((o: any) => o.id === orderBId);
    const ordC = t1.orders.find((o: any) => o.id === orderCId);
    assert.strictEqual(ordA.status, "ACCEPTED");
    assert.strictEqual(ordB.status, "NEW");
    assert.strictEqual(ordC.status, "NEW");
  }

  // -------------------------------------------------------------
  // Scenario D: Multiple orders and independent acceptance
  // Place Order D for Table 1 (total 4 orders). Accept Order B.
  // -------------------------------------------------------------
  console.log("✓ Scenario D: Table 1 has 4 orders; accepting Order B only changes Order B");
  let orderDId: string;
  {
    const fourthRes = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders1,
        body: JSON.stringify({
          items: [
            { menuItemId: "item-paratha", quantity: 2 },
            { menuItemId: "item-coke", quantity: 1 },
            { menuItemId: "item-chai", quantity: 1 },
          ],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(fourthRes.status, 201);
    orderDId = (await fourthRes.json()).order.id;

    // Accept Order B
    const acceptB = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderBId}/status`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(acceptB.status, 200);

    // Verify statuses
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    const t1 = staffBody.tables[0];
    assert.strictEqual(t1.orders.length, 4);
    assert.strictEqual(t1.orders.find((o: any) => o.id === orderAId).status, "ACCEPTED");
    assert.strictEqual(t1.orders.find((o: any) => o.id === orderBId).status, "ACCEPTED");
    assert.strictEqual(t1.orders.find((o: any) => o.id === orderCId).status, "NEW");
    assert.strictEqual(t1.orders.find((o: any) => o.id === orderDId).status, "NEW");
  }

  // -------------------------------------------------------------
  // Scenario E: Item deletion
  // -------------------------------------------------------------
  console.log("✓ Scenario E: Item deletion for unavailable items");
  {
    // Order D has 3 items: Paratha (3990*2=7980), Coke (5000), Chai (4000). Total = 16980.
    const orderDItems = sqlite
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(orderDId) as any[];
    assert.strictEqual(orderDItems.length, 3);
    const chaiItem = orderDItems.find((i) => i.item_name_snapshot === "Masala Chai");
    assert.ok(chaiItem);

    // 1. Delete Masala Chai from Order D (status is NEW)
    const delRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderDId}/items/${chaiItem.id}`, {
        method: "DELETE",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(delRes.status, 200);
    const delBody = await delRes.json();
    assert.strictEqual(delBody.ok, true);
    assert.strictEqual(delBody.deleted, false);
    // Recalculated total: 16980 - 4000 = 12980
    assert.strictEqual(delBody.order.total_amount_minor, 12980);
    assert.strictEqual(delBody.order.items.length, 2);

    // DB verification
    const dbOrderD = sqlite.prepare("SELECT * FROM orders WHERE id = ?").get(orderDId) as any;
    assert.strictEqual(dbOrderD.total_amount_minor, 12980);
    const dbItemsD = sqlite.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderDId) as any[];
    assert.strictEqual(dbItemsD.length, 2);
    assert.strictEqual(dbItemsD.some((i) => i.id === chaiItem.id), false);

    // 2. Reject deletion from ACCEPTED order (Order A)
    const orderAItems = sqlite
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(orderAId) as any[];
    const rejectDel = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderAId}/items/${orderAItems[0].id}`, {
        method: "DELETE",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(rejectDel.status, 400, "Deleting item from ACCEPTED order must be rejected");

    // 3. Delete last remaining item resolves and removes empty order
    // Order C has exactly 1 item (Chai).
    const orderCItems = sqlite
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(orderCId) as any[];
    assert.strictEqual(orderCItems.length, 1);

    const delLastRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderCId}/items/${orderCItems[0].id}`, {
        method: "DELETE",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(delLastRes.status, 200);
    const delLastBody = await delLastRes.json();
    assert.strictEqual(delLastBody.ok, true);
    assert.strictEqual(delLastBody.deleted, true);

    // Verify Order C is completely removed from DB
    const orderCRow = sqlite.prepare("SELECT * FROM orders WHERE id = ?").get(orderCId);
    assert.strictEqual(orderCRow, undefined, "Empty order must be deleted");

    // Verify staff active orders no longer includes Order C
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    const t1 = staffBody.tables[0];
    assert.strictEqual(t1.orders.some((o: any) => o.id === orderCId), false);
  }

  // -------------------------------------------------------------
  // Scenario F: Table Prioritization & Sorting
  // -------------------------------------------------------------
  console.log("✓ Scenario F: Table prioritization and sorting");
  {
    // Place orders for Table 2 and Table 3
    const customerHeaders2 = {
      Authorization: `Bearer ${cs2Token}`,
      "Content-Type": "application/json",
    };
    const customerHeaders3 = {
      Authorization: `Bearer ${cs3Token}`,
      "Content-Type": "application/json",
    };
    const customerHeaders10 = {
      Authorization: `Bearer ${cs10Token}`,
      "Content-Type": "application/json",
    };

    await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders2,
        body: JSON.stringify({
          items: [{ menuItemId: "item-biryani", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders3,
        body: JSON.stringify({
          items: [{ menuItemId: "item-paratha", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders10,
        body: JSON.stringify({
          items: [{ menuItemId: "item-coke", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    assert.strictEqual(staffBody.tables.length, 4);

    // Verify numerical table order: Table 1, Table 2, Table 3, Table 10
    const tableNames = staffBody.tables.map((t: any) => t.tableName);
    assert.deepStrictEqual(tableNames, ["Table 1", "Table 2", "Table 3", "Table 10"]);

    // Verify each table has independent orders
    const t1 = staffBody.tables.find((t: any) => t.tableName === "Table 1");
    assert.strictEqual(t1.orders.length, 3); // A, B, D
    const t2 = staffBody.tables.find((t: any) => t.tableName === "Table 2");
    assert.strictEqual(t2.orders.length, 1);
  }

  // -------------------------------------------------------------
  // Scenario G: Completion and sessions
  // Completing Order A leaves Order B and D intact, keeps table session active
  // -------------------------------------------------------------
  console.log("✓ Scenario G: Complete Order A -> Preserves pending orders & active session");
  {
    const completeRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderAId}/complete`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(completeRes.status, 200);
    const completeBody = await completeRes.json();
    assert.strictEqual(completeBody.order.status, "SERVED");

    // Table 1 session MUST STILL BE ACTIVE!
    const sessionRow = sqlite.prepare("SELECT * FROM table_sessions WHERE id = 'ts-1'").get() as any;
    assert.strictEqual(
      sessionRow.status,
      "ACTIVE",
      "Table session must remain ACTIVE so customer can continue ordering",
    );

    // Active orders for Table 1 still contains Order B and Order D!
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    const t1 = staffBody.tables.find((t: any) => t.tableName === "Table 1");
    assert.ok(t1, "Table 1 must still appear with active orders B and D");
    assert.strictEqual(t1.orders.length, 2);
    assert.strictEqual(t1.orders[0].id, orderBId);
    assert.strictEqual(t1.orders[1].id, orderDId);

    // Order A is now in Order History
    const historyRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders/history?limit=10", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const historyBody = await historyRes.json();
    const histA = historyBody.orders.find((o: any) => o.id === orderAId);
    assert.ok(histA, "Completed Order A must appear in Order History");
    assert.strictEqual(histA.status, "SERVED");

    // Customer can continue placing orders under the same active session
    const customerOrder5 = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders1,
        body: JSON.stringify({
          items: [{ menuItemId: "item-biryani", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(customerOrder5.status, 201);
  }

  // -------------------------------------------------------------
  // Scenario H: Status transitions and conflict checks
  // -------------------------------------------------------------
  console.log("✓ Scenario H: No transition after ACCEPTED (returns 409 conflict)");
  {
    const advanceAgain = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${orderBId}/status`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(
      advanceAgain.status,
      409,
      "Advancing an ACCEPTED order must return 409 conflict",
    );
  }

  // -------------------------------------------------------------
  // Scenario I: Close Table Session automatically serves all orders
  // and moves them to Order History while table becomes CLOSED
  // -------------------------------------------------------------
  console.log("✓ Scenario I: Close Table Session -> Automatically serves all orders into Order History");
  {
    // Close Table 1 session
    const closeRes = await worker.fetch(
      new Request("http://localhost/api/staff/tables/tbl-1/close", {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(closeRes.status, 200, "Closing Table 1 session returns 200");
    const closeBody = await closeRes.json();
    assert.strictEqual(closeBody.session.status, "CLOSED", "Table session is now CLOSED");

    // Table 1 no longer appears in active staff orders
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    const t1 = staffBody.tables.find((t: any) => t.tableName === "Table 1");
    assert.strictEqual(t1, undefined, "Table 1 must no longer appear in active table orders");

    // Unrelated tables (Table 2, Table 3, Table 10) are unaffected
    const otherTables = staffBody.tables.map((t: any) => t.tableName);
    assert.ok(otherTables.includes("Table 2"), "Table 2 orders remain active");
    assert.ok(otherTables.includes("Table 3"), "Table 3 orders remain active");
    assert.ok(otherTables.includes("Table 10"), "Table 10 orders remain active");

    // All Table 1 orders now appear in Order History with status SERVED
    const historyRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders/history?limit=20", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const historyBody = await historyRes.json();
    const histB = historyBody.orders.find((o: any) => o.id === orderBId);
    const histD = historyBody.orders.find((o: any) => o.id === orderDId);

    assert.ok(histB, "Order B must appear in Order History");
    assert.strictEqual(histB.status, "SERVED", "Order B is automatically SERVED");
    assert.ok(histD, "Order D must appear in Order History");
    assert.strictEqual(histD.status, "SERVED", "Order D is automatically SERVED");
  }

  console.log("\n=================================================");
  console.log("ALL MULTIPLE INDEPENDENT ORDERS TESTS PASSED CLEANLY!");
  console.log("=================================================");
}

runActiveOrdersTests().catch((err) => {
  console.error("ACTIVE ORDERS TEST FAILED:", err);
  process.exit(1);
});

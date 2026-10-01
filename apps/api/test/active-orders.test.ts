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
  console.log("RUNNING SINGLE ACTIVE ORDER PER TABLE TEST SUITE");
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
  // Test 1: Table 1 places first order (Laccha Paratha + Chicken Biryani)
  // -------------------------------------------------------------
  console.log("✓ Test 1: Table 1 creates first order (Laccha Paratha + Chicken Biryani)");
  let order1Id: string;
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
    order1Id = body.order.id;
    assert.strictEqual(body.order.status, "NEW");
    assert.strictEqual(body.order.total_amount_minor, 3990 + 18000); // ₹219.90
    assert.strictEqual(body.order.items.length, 2);

    // Verify staff active orders
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
    assert.strictEqual(staffBody.tables[0].orders[0].id, order1Id);
    assert.strictEqual(staffBody.tables[0].orders[0].status, "NEW");
    assert.strictEqual(staffBody.tables[0].orders[0].items.length, 2);
  }

  // -------------------------------------------------------------
  // Test 2: Staff accepts Order 1 -> ACCEPTED
  // -------------------------------------------------------------
  console.log("✓ Test 2: Staff accepts Table 1 order (NEW -> ACCEPTED)");
  {
    const acceptRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${order1Id}/status`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(acceptRes.status, 200);
    const acceptBody = await acceptRes.json();
    assert.strictEqual(acceptBody.ok, true);
    assert.strictEqual(acceptBody.order.status, "ACCEPTED");
    assert.ok(acceptBody.order.accepted_at, "accepted_at timestamp must be set");

    // Verify staff active orders reflects ACCEPTED
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    assert.strictEqual(staffBody.tables.length, 1);
    assert.strictEqual(staffBody.tables[0].orders[0].status, "ACCEPTED");
  }

  // -------------------------------------------------------------
  // Test 3: Table 1 places another order later (Diet Coke)
  // Must append to EXISTING active order, KEEP same Order ID, PRESERVE ACCEPTED
  // -------------------------------------------------------------
  console.log("✓ Test 3: Table 1 orders Diet Coke later -> Appends to same Order ID, status stays ACCEPTED");
  {
    const secondRes = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders1,
        body: JSON.stringify({
          items: [{ menuItemId: "item-coke", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    assert.strictEqual(secondRes.status, 201);
    const secondBody = await secondRes.json();
    assert.strictEqual(secondBody.ok, true);

    // IMPORTANT: DO NOT create a new order ID! Must keep existing order ID.
    assert.strictEqual(
      secondBody.order.id,
      order1Id,
      "Order ID must remain the same when appending to active table session",
    );

    // Status must remain ACCEPTED, not reset to NEW
    assert.strictEqual(
      secondBody.order.status,
      "ACCEPTED",
      "Order status must stay ACCEPTED when new items are added",
    );

    // Total must be updated: 3990 + 18000 + 5000 = 26990 (₹269.90)
    assert.strictEqual(secondBody.order.total_amount_minor, 26990);

    // Items list must contain all 3 items in order
    assert.strictEqual(secondBody.order.items.length, 3);
    assert.strictEqual(secondBody.order.items[0].item_name_snapshot, "Laccha Paratha");
    assert.strictEqual(secondBody.order.items[1].item_name_snapshot, "Chicken Biryani");
    assert.strictEqual(secondBody.order.items[2].item_name_snapshot, "Diet Coke");

    // DATABASE VERIFICATION: strictly ONE row in orders for this table session
    const orderRows = sqlite.prepare("SELECT * FROM orders WHERE table_session_id = 'ts-1'").all() as any[];
    assert.strictEqual(orderRows.length, 1, "There must be strictly ONE order record in DB for Table 1");
    assert.strictEqual(orderRows[0].id, order1Id);
    assert.strictEqual(orderRows[0].total_amount_minor, 26990);
    assert.strictEqual(orderRows[0].status, "ACCEPTED");

    // Order items in DB must be 3 rows all referencing order1Id
    const itemRows = sqlite.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order1Id) as any[];
    assert.strictEqual(itemRows.length, 3, "All 3 items must reference the single order ID in D1");

    // STAFF API VERIFICATION:
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    assert.strictEqual(staffBody.tables.length, 1, "Only one table group");
    assert.strictEqual(staffBody.tables[0].orders.length, 1, "Strictly ONE order for Table 1");
    assert.strictEqual(staffBody.tables[0].orders[0].id, order1Id);
    assert.strictEqual(staffBody.tables[0].orders[0].total_amount_minor, 26990);
    assert.strictEqual(staffBody.tables[0].orders[0].items.length, 3);
  }

  // -------------------------------------------------------------
  // Test 4: Different Tables have Different Active Orders
  // Table 2 places an order -> receives DIFFERENT Order ID
  // -------------------------------------------------------------
  console.log("✓ Test 4: Table 2 places an order -> Gets its own unique Order ID");
  let order2Id: string;
  {
    const customerHeaders2 = {
      Authorization: `Bearer ${cs2Token}`,
      "Content-Type": "application/json",
    };

    const res2 = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders2,
        body: JSON.stringify({
          items: [{ menuItemId: "item-chai", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    assert.strictEqual(res2.status, 201);
    const body2 = await res2.json();
    order2Id = body2.order.id;
    assert.notStrictEqual(order2Id, order1Id, "Table 2 must get a separate Order ID");
    assert.strictEqual(body2.order.status, "NEW");
    assert.strictEqual(body2.order.total_amount_minor, 4000);

    // Verify staff active orders shows both tables
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    assert.strictEqual(staffBody.tables.length, 2);

    const t1 = staffBody.tables.find((t: any) => t.tableName === "Table 1");
    const t2 = staffBody.tables.find((t: any) => t.tableName === "Table 2");
    assert.ok(t1 && t2);
    assert.strictEqual(t1.orders[0].id, order1Id);
    assert.strictEqual(t1.orders[0].status, "ACCEPTED");
    assert.strictEqual(t2.orders[0].id, order2Id);
    assert.strictEqual(t2.orders[0].status, "NEW");
  }

  // -------------------------------------------------------------
  // Test 5: Table 3 places order and appends items while still NEW
  // -------------------------------------------------------------
  console.log("✓ Test 5: Table 3 places order and appends while still NEW -> Status stays NEW");
  let order3Id: string;
  {
    const customerHeaders3 = {
      Authorization: `Bearer ${cs3Token}`,
      "Content-Type": "application/json",
    };

    // First item
    const r1 = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders3,
        body: JSON.stringify({
          items: [{ menuItemId: "item-chai", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );
    const b1 = await r1.json();
    order3Id = b1.order.id;
    assert.strictEqual(b1.order.status, "NEW");

    // Second item placed before staff accepts
    const r2 = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders3,
        body: JSON.stringify({
          items: [{ menuItemId: "item-biryani", quantity: 1 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );
    const b2 = await r2.json();
    assert.strictEqual(b2.order.id, order3Id, "Same Order ID retained");
    assert.strictEqual(b2.order.status, "NEW", "Status remains NEW");
    assert.strictEqual(b2.order.items.length, 2);
    assert.strictEqual(b2.order.total_amount_minor, 4000 + 18000);
  }

  // -------------------------------------------------------------
  // Test 6: Numerical table sorting (Table 1, Table 2, Table 3, Table 10)
  // -------------------------------------------------------------
  console.log("✓ Test 6: Numerical table sorting (Table 1, Table 2, Table 3, Table 10)");
  {
    const customerHeaders10 = {
      Authorization: `Bearer ${cs10Token}`,
      "Content-Type": "application/json",
    };

    await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders10,
        body: JSON.stringify({
          items: [{ menuItemId: "item-paratha", quantity: 1 }],
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
    const tableNames = staffBody.tables.map((t: any) => t.tableName);
    assert.deepStrictEqual(tableNames, ["Table 1", "Table 2", "Table 3", "Table 10"]);
  }

  // -------------------------------------------------------------
  // Test 7: Closing an Active Order moves it to Order History
  // -------------------------------------------------------------
  console.log("✓ Test 7: Completing Table 1 active order moves it to Order History");
  {
    const completeRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${order1Id}/complete`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(completeRes.status, 200);
    const completeBody = await completeRes.json();
    assert.strictEqual(completeBody.ok, true);
    assert.strictEqual(completeBody.order.status, "SERVED");

    // Table 1 must NO LONGER appear in active orders!
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    const hasTable1 = staffBody.tables.some((t: any) => t.tableName === "Table 1");
    assert.strictEqual(hasTable1, false, "Table 1 must not appear in active orders after completion");

    // Table 1 order must appear in Order History
    const historyRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders/history?limit=10", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(historyRes.status, 200);
    const historyBody = await historyRes.json();
    const historicalOrder = historyBody.orders.find((o: any) => o.id === order1Id);
    assert.ok(historicalOrder, "Order #1 must be present in Order History");
    assert.strictEqual(historicalOrder.status, "SERVED");
    assert.strictEqual(historicalOrder.total_amount_minor, 26990);
  }

  // -------------------------------------------------------------
  // Test 8: Table 1 places a NEW order after previous order was closed
  // Must generate a BRAND NEW Order ID and NOT touch historical order
  // -------------------------------------------------------------
  console.log("✓ Test 8: Table 1 places new order after closing -> Receives BRAND NEW Order ID");
  {
    // Open new session for Table 1
    sqlite.exec(`
      INSERT INTO table_sessions (id, table_id, status) VALUES ('ts-1-new', 'tbl-1', 'ACTIVE');
    `);
    const cs1NewToken = "customer-token-table-1-new";
    const cs1NewHash = await sha256Hex(cs1NewToken);
    sqlite.exec(`
      INSERT INTO customer_sessions (id, table_session_id, session_token_hash, expires_at)
      VALUES ('cs-1-new', 'ts-1-new', '${cs1NewHash}', '${futureIso}');
    `);

    const customerHeaders1New = {
      Authorization: `Bearer ${cs1NewToken}`,
      "Content-Type": "application/json",
    };

    const newOrderRes = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: customerHeaders1New,
        body: JSON.stringify({
          items: [{ menuItemId: "item-biryani", quantity: 2 }],
        }),
      }),
      { DB: d1 } as any,
      {} as any,
    );

    assert.strictEqual(newOrderRes.status, 201);
    const newOrderBody = await newOrderRes.json();
    const newOrderId = newOrderBody.order.id;

    // Must be a brand new Order ID
    assert.notStrictEqual(
      newOrderId,
      order1Id,
      "New order from Table 1 must receive a BRAND NEW Order ID",
    );
    assert.strictEqual(newOrderBody.order.status, "NEW");
    assert.strictEqual(newOrderBody.order.total_amount_minor, 36000);

    // Verify historical order1 in DB remains completely unchanged
    const oldOrder = sqlite.prepare("SELECT * FROM orders WHERE id = ?").get(order1Id) as any;
    assert.strictEqual(oldOrder.status, "SERVED");
    assert.strictEqual(oldOrder.total_amount_minor, 26990);

    // Active orders now shows Table 1 with the NEW Order ID
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/orders", { headers: staffHeaders }),
      { DB: d1 } as any,
      {} as any,
    );
    const staffBody = await staffRes.json();
    const table1Group = staffBody.tables.find((t: any) => t.tableName === "Table 1");
    assert.ok(table1Group);
    assert.strictEqual(table1Group.orders.length, 1);
    assert.strictEqual(table1Group.orders[0].id, newOrderId);
  }

  // -------------------------------------------------------------
  // Test 9: Workflow is strictly NEW -> ACCEPTED (no transition after ACCEPTED)
  // -------------------------------------------------------------
  console.log("✓ Test 9: No transition after ACCEPTED (returns 409 conflict)");
  {
    // Accept order2 (Table 2)
    const acceptRes = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${order2Id}/status`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(acceptRes.status, 200);

    // Try to advance order2 again
    const advanceAgain = await worker.fetch(
      new Request(`http://localhost/api/staff/orders/${order2Id}/status`, {
        method: "POST",
        headers: staffHeaders,
      }),
      { DB: d1 } as any,
      {} as any,
    );
    assert.strictEqual(
      advanceAgain.status,
      409,
      "Advancing an ACCEPTED order must return 409 (final state reached)",
    );
  }

  console.log("\n=================================================");
  console.log("ALL SINGLE ACTIVE ORDER PER TABLE TESTS PASSED!");
  console.log("=================================================");
}

runActiveOrdersTests().catch((err) => {
  console.error("ACTIVE ORDERS TEST FAILED:", err);
  process.exit(1);
});

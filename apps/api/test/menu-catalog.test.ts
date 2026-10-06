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

  // Execute seed-menu.sql
  const seedSqlPath = path.resolve(import.meta.dirname, "../scripts/seed-menu.sql");
  const seedSql = fs.readFileSync(seedSqlPath, "utf-8");
  sqlite.exec(seedSql);

  return { sqlite, d1: createD1Shim(sqlite) };
}

async function runMenuCatalogTests() {
  console.log("=================================================");
  console.log("RUNNING COMPLETE MENU CATALOG TEST SUITE");
  console.log("=================================================\n");

  const { sqlite, d1 } = initTestDb();
  const env = { DB: d1 } as any;

  // -------------------------------------------------------------
  // Test 1: GET /api/menu returns all 22 categories and 143 items
  // -------------------------------------------------------------
  console.log("✓ Test 1: GET /api/menu returns complete catalog (22 categories, 143 items)");
  {
    const res = await worker.fetch(
      new Request("http://localhost/api/menu"),
      env,
      {} as any,
    );

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.categories.length, 22, `Expected 22 categories, got ${data.categories.length}`);
    assert.strictEqual(data.items.length, 143, `Expected 143 items, got ${data.items.length}`);

    // Verify expected categories in exact order
    const expectedCategories = [
      "Refreshing Mocktails",
      "Shakes & Beverages",
      "Hot Beverage",
      "Soups",
      "Noodles",
      "Sandwiches",
      "Burgers",
      "Pizza",
      "Wraps",
      "Pasta",
      "Veg Starters — Fries & Potato Bites",
      "Veg Starters — Cheese & Bread Bites",
      "Veg Starters — Indo-Chinese Favourites",
      "Non-Veg Starters",
      "Non-Veg Starters — Indo-Chinese Favourites",
      "Tandoor",
      "Salads",
      "Biryani",
      "Rice",
      "Parathas & Breads",
      "Signature Gravy",
      "Desserts",
    ];

    for (let i = 0; i < expectedCategories.length; i++) {
      assert.strictEqual(
        data.categories[i].name,
        expectedCategories[i],
        `Category at index ${i} expected "${expectedCategories[i]}", got "${data.categories[i].name}"`
      );
      assert.strictEqual(data.categories[i].sort_order, i + 1);
      assert.strictEqual(data.categories[i].active, 1);
    }
  }

  // -------------------------------------------------------------
  // Test 2: Category and Item counts per section
  // -------------------------------------------------------------
  console.log("✓ Test 2: Verify item count per category");
  {
    const res = await worker.fetch(
      new Request("http://localhost/api/menu"),
      env,
      {} as any,
    );
    const data = await res.json();

    const expectedCounts: Record<string, number> = {
      "Refreshing Mocktails": 7,
      "Shakes & Beverages": 8,
      "Hot Beverage": 8,
      "Soups": 5,
      "Noodles": 3,
      "Sandwiches": 7,
      "Burgers": 8,
      "Pizza": 11,
      "Wraps": 9,
      "Pasta": 6,
      "Veg Starters — Fries & Potato Bites": 3,
      "Veg Starters — Cheese & Bread Bites": 3,
      "Veg Starters — Indo-Chinese Favourites": 8,
      "Non-Veg Starters": 8,
      "Non-Veg Starters — Indo-Chinese Favourites": 5,
      "Tandoor": 7,
      "Salads": 6,
      "Biryani": 4,
      "Rice": 5,
      "Parathas & Breads": 3,
      "Signature Gravy": 12,
      "Desserts": 7,
    };

    const catMap = new Map(data.categories.map((c: any) => [c.id, c.name]));
    const itemsPerCat: Record<string, number> = {};

    for (const item of data.items) {
      const catName = catMap.get(item.category_id) as string;
      itemsPerCat[catName] = (itemsPerCat[catName] || 0) + 1;
    }

    for (const [catName, expectedCount] of Object.entries(expectedCounts)) {
      assert.strictEqual(
        itemsPerCat[catName],
        expectedCount,
        `Category "${catName}" expected ${expectedCount} items, got ${itemsPerCat[catName]}`
      );
    }
  }

  // -------------------------------------------------------------
  // Test 3: Specific prices and variants integrity check
  // -------------------------------------------------------------
  console.log("✓ Test 3: Check sample item prices, variants, and minor units (paise)");
  {
    const res = await worker.fetch(
      new Request("http://localhost/api/menu"),
      env,
      {} as any,
    );
    const data = await res.json();
    const itemMap = new Map(data.items.map((it: any) => [it.name, it]));

    const checkPrices: [string, number][] = [
      ["Virgin Mojito", 12900],
      ["Cold Coffee", 17900],
      ["Masala Tea", 4900],
      ["Hot & Sour Soup (Veg)", 13900],
      ["Hot & Sour Soup (Non-Veg)", 14900],
      ["Lemon Pepper Coriander Soup (Veg)", 13900],
      ["Lemon Pepper Coriander Soup (Non-Veg)", 14900],
      ["Cream of Chicken Soup", 19900],
      ["Classic Margherita Pizza", 14900],
      ["Makhni Paneer Pizza", 29900],
      ["Makhni Chicken Pizza", 29900],
      ["Tandoori Chicken Pizza", 29900],
      ["Tandoori Paneer Pizza", 29900],
      ["Crispy Chicken Wings (6 pcs)", 24900],
      ["Crispy Chicken Wings (12 pcs)", 44900],
      ["Crispy Fried Chicken (2 pcs)", 19900],
      ["Crispy Fried Chicken (4 pcs)", 34900],
      ["Crispy Fried Chicken (6 pcs)", 49900],
      ["Chicken Popcorn", 29900],
      ["Tandoori Chicken (Half)", 24900],
      ["Tandoori Chicken (Full)", 39900],
      ["Roti", 1900],
      ["Lachha Paratha", 3900],
      ["Egg Lachha Paratha", 5900],
      ["Butter Chicken", 26900],
      ["Ice Cream", 4900],
    ];

    for (const [name, expectedMinor] of checkPrices) {
      const item = itemMap.get(name);
      assert.ok(item, `Item "${name}" must exist in catalog`);
      assert.strictEqual(
        item.price_minor,
        expectedMinor,
        `Item "${name}" price_minor expected ${expectedMinor} (₹${expectedMinor / 100}), got ${item.price_minor}`
      );
      assert.strictEqual(item.available, 1);
      assert.strictEqual(item.archived, 0);
    }
  }

  // -------------------------------------------------------------
  // Test 4: Search functionality
  // -------------------------------------------------------------
  console.log("✓ Test 4: Search functionality (/api/menu/search)");
  {
    const searchRes = await worker.fetch(
      new Request("http://localhost/api/menu/search?q=mojito"),
      env,
      {} as any,
    );
    assert.strictEqual(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.ok(searchData.items.some((it: any) => it.name === "Virgin Mojito"));

    const pizzaRes = await worker.fetch(
      new Request("http://localhost/api/menu/search?q=pizza"),
      env,
      {} as any,
    );
    assert.strictEqual(pizzaRes.status, 200);
    const pizzaData = await pizzaRes.json();
    // 10 items explicitly have "Pizza" in their name; "Double Cheese Margherita" does not contain the word "pizza"
    assert.strictEqual(pizzaData.items.length, 10, `Expected 10 pizza items matching "pizza", got ${pizzaData.items.length}`);

    // Verify GET /api/menu/categories/:categoryId/items returns all 11 items in the Pizza category
    const catItemsRes = await worker.fetch(
      new Request("http://localhost/api/menu/categories/cat-pizza/items"),
      env,
      {} as any,
    );
    assert.strictEqual(catItemsRes.status, 200);
    const catItemsData = await catItemsRes.json();
    assert.strictEqual(catItemsData.items.length, 11, `Expected 11 items in category cat-pizza, got ${catItemsData.items.length}`);
  }

  // -------------------------------------------------------------
  // Test 5: Customer Order Placement with new catalog items
  // -------------------------------------------------------------
  console.log("✓ Test 5: Place customer order with new items and verify cart/line totals");
  {
    // Setup table and customer session
    sqlite.exec(`
      INSERT INTO locations (id, name, active) VALUES ('loc-test', 'Main Hall', 1);
      INSERT INTO tables (id, location_id, name, active) VALUES ('tbl-test', 'loc-test', 'Table T1', 1);
      INSERT INTO table_sessions (id, table_id, status) VALUES ('ts-test', 'tbl-test', 'ACTIVE');
    `);

    const customerToken = "test-customer-menu-token";
    const customerTokenHash = await sha256Hex(customerToken);
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    sqlite.exec(`
      INSERT INTO customer_sessions (id, table_session_id, session_token_hash, expires_at)
      VALUES ('cs-test', 'ts-test', '${customerTokenHash}', '${futureDate}');
    `);

    const orderRes = await worker.fetch(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            { menuItemId: "item-virgin-mojito", quantity: 2 }, // 2 * 12900 = 25800
            { menuItemId: "item-hot-sour-soup-veg", quantity: 1 }, // 1 * 13900 = 13900
            { menuItemId: "item-tandoori-chicken-half", quantity: 1 }, // 1 * 24900 = 24900
          ],
        }),
      }),
      env,
      {} as any,
    );

    assert.strictEqual(orderRes.status, 201);
    const orderData = await orderRes.json();
    assert.strictEqual(orderData.ok, true);
    assert.ok(orderData.order.id);
    // Expected: 25800 + 13900 + 24900 = 64600 paise (₹646.00)
    assert.strictEqual(orderData.order.total_amount_minor, 64600);
    assert.strictEqual(orderData.order.items.length, 3);
  }

  console.log("\n=================================================");
  console.log("ALL COMPLETE MENU CATALOG TESTS PASSED CLEANLY!");
  console.log("=================================================\n");
}

runMenuCatalogTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

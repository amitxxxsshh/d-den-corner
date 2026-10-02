import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import worker from "../src/index";
import { sha256Hex } from "../src/utils/crypto";
import { createQRToken, getCurrentQRTokenForTable } from "../src/db/qr";

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
    const content = fs.readFileSync(filePath, "utf-8");
    sqlite.exec(content);
  }

  // Seed user, location, table
  sqlite.exec(`
    INSERT INTO users (id, email, role, active, password_hash, password_salt)
    VALUES ('staff-1', 'staff@ddencorner.local', 'STAFF', 1, 'dummy_hash', 'dummy_salt');

    INSERT INTO locations (id, name, active) VALUES ('loc-1', 'Main Dining', 1);
    INSERT INTO tables (id, location_id, name, active) VALUES ('tbl-1', 'loc-1', 'Table 1', 1);
    INSERT INTO tables (id, location_id, name, active) VALUES ('dev-table-3', 'loc-1', 'Table 3', 1);
  `);

  return sqlite;
}

async function createStaffSession(sqlite: DatabaseSync, userId: string): Promise<string> {
  const rawToken = "test_staff_session_token_" + Math.random().toString(36).slice(2);
  const hash = await sha256Hex(rawToken);

  sqlite.exec(`
    INSERT INTO staff_sessions (id, user_id, token_hash, expires_at)
    VALUES ('sess-${Math.random().toString(36).slice(2)}', '${userId}', '${hash}', datetime('now', '+1 day'));
  `);

  return rawToken;
}

async function run() {
  console.log("=================================================");
  console.log("RUNNING TABLE ORDERING LINK ACCESS-CONTROL SUITE");
  console.log("=================================================\n");

  const sqlite = initTestDb();
  const d1 = createD1Shim(sqlite);
  const env: any = {
    DB: d1,
    CUSTOMER_ORIGIN: "http://localhost:3000",
    STAFF_ORIGIN: "http://localhost:3001",
  };

  const staffToken = await createStaffSession(sqlite, "staff-1");
  const staffCookie = `ddc_staff_session=${encodeURIComponent(staffToken)}`;

  // 1. Staff dashboard API call to generate link should NOT exist (returns 404)
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-1/qr", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );

    assert.strictEqual(
      res.status,
      404,
      "POST /api/staff/tables/:tableId/qr must return 404 (endpoint removed from staff API)"
    );
    console.log("✓ Test 1: Staff dashboard cannot call QR generation endpoint (404 Not Found)");
  }

  // 2. Staff dashboard API call to revoke link should NOT exist (returns 404)
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-1/qr/some-id/revoke", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );

    assert.strictEqual(
      res.status,
      404,
      "POST /api/staff/tables/:tableId/qr/:qrId/revoke must return 404 (endpoint removed from staff API)"
    );
    console.log("✓ Test 2: Staff dashboard cannot call QR revoke endpoint (404 Not Found)");
  }

  // 3. Admin / Terminal tooling generates an ordering link via createQRToken backend capability
  let generatedToken: string;
  {
    const qrResult = await createQRToken(d1 as any, "tbl-1");
    assert.ok(qrResult.token, "Admin tooling generates token successfully");
    assert.strictEqual(qrResult.row.table_id, "tbl-1");
    assert.strictEqual(qrResult.row.active, 0, "New token starts inactive");
    generatedToken = qrResult.token;
    console.log("✓ Test 3: Terminal/Admin tooling generates ordering link via backend capability");
  }

  // 4. Staff fetches tables: sees QR is assigned, and sees permanent ordering URL for viewing and copying
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables", {
        method: "GET",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );

    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    const tbl = body.locations[0].tables.find((t: any) => t.id === "tbl-1");
    assert.ok(tbl, "Table found in response");
    assert.ok(tbl.qr, "QR status is assigned");
    assert.strictEqual(tbl.qr.active, false, "QR is inactive because table is closed");
    const expectedUrl = `http://localhost:3000/menu?token=${encodeURIComponent(generatedToken)}`;
    assert.strictEqual(tbl.qr.url, expectedUrl, "Staff API exposes ordering URL for viewing and copying");
    assert.strictEqual(tbl.orderingUrl, expectedUrl, "Staff API exposes orderingUrl for table card");
    console.log("✓ Test 4: Staff tables list exposes permanent ordering URL for viewing and copying");
  }

  // 5. Customer scanning inactive QR fails to join (401)
  {
    const res = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: generatedToken }),
      }),
      env,
      {} as any
    );

    assert.strictEqual(res.status, 401, "Customer cannot join while table is closed");
    console.log("✓ Test 5: Customer cannot join while table session is closed");
  }

  // 6. Staff opens table session -> Activates the permanent QR token
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-1/open", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );

    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    assert.ok(body.session, "Session was created");
    assert.strictEqual(body.qr.active, true, "QR token was activated");
    console.log("✓ Test 6: Staff opens table session and activates the permanent QR");
  }

  // 7. Customer scans permanent QR while open -> Successfully joins!
  {
    const res = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: generatedToken }),
      }),
      env,
      {} as any
    );

    assert.strictEqual(res.status, 200, "Customer successfully joins open table");
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    assert.ok(body.token, "Customer session token issued");
    console.log("✓ Test 7: Customer successfully joins open table session with permanent QR token");
  }

  // 8. Staff closes table session -> Deactivates the permanent QR token
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-1/close", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );

    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.qr.active, false, "QR token was deactivated");
    console.log("✓ Test 8: Staff closes table session and deactivates the permanent QR");
  }

  // 9. Customer scan is now rejected again (401)
  {
    const res = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: generatedToken }),
      }),
      env,
      {} as any
    );

    assert.strictEqual(res.status, 401, "Customer cannot join after table session closed");
    console.log("✓ Test 9: Customer scan is rejected after table is closed");
  }

  // 10. Admin replaces link: old token is revoked, new token works
  {
    const newQRResult = await createQRToken(d1 as any, "tbl-1");
    assert.notStrictEqual(newQRResult.token, generatedToken, "New token is generated");

    // Reopen table
    await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-1/open", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );

    // Old token should be rejected
    const oldRes = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: generatedToken }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(oldRes.status, 401, "Old revoked token is rejected");

    // New token should be accepted
    const newRes = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: newQRResult.token }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(newRes.status, 200, "New rotated token is accepted");
    console.log("✓ Test 10: Admin rotates token: old token revoked, new token accepted");
  }

  // ============================================================
  // REGRESSION TEST SUITE: Exact Sequence A - L for Table 3 (dev-table-3)
  // ============================================================
  console.log("\n-------------------------------------------------");
  console.log("EXACT REGRESSION SEQUENCE: Table 3 (dev-table-3)");
  console.log("-------------------------------------------------");

  // Step A: Admin generates permanent link for Table 3
  const linkResultTable3 = await createQRToken(d1 as any, "dev-table-3");
  const table3Token = linkResultTable3.token;
  console.log("✓ Step A: Admin generates permanent link for Table 3");

  // Step B: Verify token exists
  assert.ok(table3Token, "Token string must be generated and non-empty");
  const dbTokenRows = sqlite.prepare("SELECT * FROM qr_tokens WHERE table_id = 'dev-table-3'").all() as any[];
  assert.strictEqual(dbTokenRows.length, 1, "Exactly one token record exists for Table 3");
  const expectedHash = await sha256Hex(table3Token);
  assert.strictEqual(dbTokenRows[0].token_hash, expectedHash, "Token hash matches the raw generated token");
  console.log("✓ Step B: Verify token exists in database with correct hash");

  // Step C: Verify link is initially inactive because session is closed
  assert.strictEqual(linkResultTable3.row.active, 0, "Token row in database is initially active=0");
  const preOpenJoinRes = await worker.fetch(
    new Request("http://localhost:3000/api/qr/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: table3Token }),
    }),
    env,
    {} as any
  );
  assert.strictEqual(preOpenJoinRes.status, 401, "Customer cannot join while Table 3 session is closed");
  console.log("✓ Step C: Verify link is initially inactive because session is closed");

  // Step D: Staff opens Table 3
  const openTable3Res = await worker.fetch(
    new Request("http://localhost:3001/api/staff/tables/dev-table-3/open", {
      method: "POST",
      headers: { Cookie: staffCookie },
    }),
    env,
    {} as any
  );
  assert.strictEqual(openTable3Res.status, 200, "Staff opens Table 3 successfully");
  const openTable3Body: any = await openTable3Res.json();
  assert.strictEqual(openTable3Body.ok, true);
  console.log("✓ Step D: Staff opens Table 3");

  // Step E: Verify the SAME token becomes usable
  const postOpenTokens = sqlite.prepare("SELECT * FROM qr_tokens WHERE table_id = 'dev-table-3'").all() as any[];
  assert.strictEqual(postOpenTokens.length, 1, "Opening table MUST NOT generate a new token or duplicate row");
  assert.strictEqual(postOpenTokens[0].token_hash, expectedHash, "Token hash is unchanged (SAME token)");
  assert.strictEqual(postOpenTokens[0].active, 1, "Token active flag is now 1");
  const currentQR = await getCurrentQRTokenForTable(d1 as any, "dev-table-3");
  assert.ok(currentQR, "Current QR token found");
  assert.strictEqual(currentQR?.token_hash, expectedHash, "Current active QR token is the SAME token");
  console.log("✓ Step E: Verify the SAME token becomes usable (no new token generated)");

  // Step F: Customer requests/join using the SAME token
  const customerJoinRes = await worker.fetch(
    new Request("http://localhost:3000/api/qr/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: table3Token }),
    }),
    env,
    {} as any
  );

  // Step G: Customer join succeeds
  assert.strictEqual(customerJoinRes.status, 200, "Customer join returns 200 OK");
  const customerJoinBody: any = await customerJoinRes.json();
  assert.strictEqual(customerJoinBody.ok, true, "Customer join response is ok: true");
  assert.ok(customerJoinBody.token, "Customer session token is issued");
  assert.strictEqual(customerJoinBody.session.tableId, "dev-table-3", "Joined table is dev-table-3");
  assert.strictEqual(customerJoinBody.session.tableName, "Table 3", "Joined table name is Table 3");
  console.log("✓ Step F & G: Customer requests/join using the SAME token and succeeds");

  // Step H: Staff closes Table 3
  const closeTable3Res = await worker.fetch(
    new Request("http://localhost:3001/api/staff/tables/dev-table-3/close", {
      method: "POST",
      headers: { Cookie: staffCookie },
    }),
    env,
    {} as any
  );
  assert.strictEqual(closeTable3Res.status, 200, "Staff closes Table 3 successfully");
  console.log("✓ Step H: Staff closes Table 3");

  // Step I: Customer attempts to use the SAME token again
  const postCloseJoinRes = await worker.fetch(
    new Request("http://localhost:3000/api/qr/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: table3Token }),
    }),
    env,
    {} as any
  );

  // Step J: Customer is rejected because the table session is closed
  assert.strictEqual(postCloseJoinRes.status, 401, "Customer join returns 401 Unauthorized after table closed");
  const postCloseBody: any = await postCloseJoinRes.json();
  assert.strictEqual(postCloseBody.message, "This QR code is invalid or inactive.", "Expected error message");
  console.log("✓ Step I & J: Customer attempts to use SAME token again and is rejected (401)");

  // Step K: Admin rotates/replaces the permanent link
  const rotatedQR = await createQRToken(d1 as any, "dev-table-3");
  assert.notStrictEqual(rotatedQR.token, table3Token, "New token string is distinct from old token");
  const rotatedTokensInDb = sqlite.prepare("SELECT * FROM qr_tokens WHERE table_id = 'dev-table-3'").all() as any[];
  assert.strictEqual(rotatedTokensInDb.length, 2, "Database now holds two tokens (one inactive, one active upon open)");
  console.log("✓ Step K: Admin rotates/replaces the permanent link");

  // Step L: Verify the old token is no longer valid and the new token is valid when table is open
  await worker.fetch(
    new Request("http://localhost:3001/api/staff/tables/dev-table-3/open", {
      method: "POST",
      headers: { Cookie: staffCookie },
    }),
    env,
    {} as any
  );

  // Old token attempt
  const oldTokenAfterRotateRes = await worker.fetch(
    new Request("http://localhost:3000/api/qr/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: table3Token }),
    }),
    env,
    {} as any
  );
  assert.strictEqual(oldTokenAfterRotateRes.status, 401, "Old revoked token is rejected with 401");

  // New rotated token attempt
  const newTokenAfterRotateRes = await worker.fetch(
    new Request("http://localhost:3000/api/qr/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: rotatedQR.token }),
    }),
    env,
    {} as any
  );
  assert.strictEqual(newTokenAfterRotateRes.status, 200, "New rotated token succeeds with 200 OK");
  const newTokenBody: any = await newTokenAfterRotateRes.json();
  assert.strictEqual(newTokenBody.ok, true);
  assert.ok(newTokenBody.token, "New session token issued for rotated link");
  console.log("✓ Step L: Old token is no longer valid and new rotated token is valid when table is open");

  // ============================================================
  // TABLE CREATION & LIFECYCLE TESTS (Add Table Workflow)
  // ============================================================
  console.log("\n-------------------------------------------------");
  console.log("TABLE CREATION & ORDERING LINK LIFECYCLE (Table 4)");
  console.log("-------------------------------------------------");

  // Step M: Validation - Missing fields return 400
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: staffCookie,
        },
        body: JSON.stringify({ id: "", name: "" }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(res.status, 400, "Empty ID/name returns 400 Bad Request");
    console.log("✓ Step M: Table creation rejects missing fields with 400");
  }

  // Step N: Staff creates Table 4 with initial permanent ordering token
  let table4Token: string;
  let table4Url: string;
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: staffCookie,
        },
        body: JSON.stringify({ id: "tbl-4", name: "Table 4" }),
      }),
      env,
      {} as any
    );

    assert.strictEqual(res.status, 201, "POST /api/staff/tables returns 201 Created");
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.table.id, "tbl-4");
    assert.strictEqual(body.table.name, "Table 4");
    assert.strictEqual(body.table.activeSession, null, "New table starts with no active session");
    assert.ok(body.table.qr, "Initial QR token is returned");
    assert.strictEqual(body.table.qr.active, false, "Initial QR token is inactive because table is closed");
    assert.ok(body.table.qr.url, "Initial permanent ordering URL is present");
    table4Url = body.table.qr.url;
    assert.strictEqual(body.table.orderingUrl, table4Url);

    // Extract token from URL
    const urlObj = new URL(table4Url);
    table4Token = urlObj.searchParams.get("token")!;
    assert.ok(table4Token, "Token extracted from permanent URL");

    // Verify DB has exactly ONE token for tbl-4
    const tokensInDb = sqlite.prepare("SELECT * FROM qr_tokens WHERE table_id = 'tbl-4'").all() as any[];
    assert.strictEqual(tokensInDb.length, 1, "Exactly one initial permanent token created in DB");
    assert.strictEqual(tokensInDb[0].active, 0, "Token in DB starts inactive (active=0)");
    assert.strictEqual(tokensInDb[0].raw_token, table4Token, "raw_token matches the URL token");
    console.log("✓ Step N: Staff creates Table 4 with exactly one initial permanent ordering token");
  }

  // Step O: Duplicate table ID returns 409 Conflict
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: staffCookie,
        },
        body: JSON.stringify({ id: "tbl-4", name: "Table 4 Duplicate" }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(res.status, 409, "Duplicate table ID returns 409 Conflict");
    console.log("✓ Step O: Duplicate table creation rejected with 409 Conflict");
  }

  // Step P: Customer scanning inactive Table 4 link is rejected (401)
  {
    const res = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: table4Token }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(res.status, 401, "Customer cannot join while Table 4 is closed");
    console.log("✓ Step P: Customer scanning Table 4 link before opening is rejected (401)");
  }

  // Step Q: Staff opens Table 4 -> Activates the SAME permanent token
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-4/open", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );
    assert.strictEqual(res.status, 200, "Staff opens Table 4 successfully");
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    assert.ok(body.session, "Table session created");
    assert.strictEqual(body.qr.active, true, "QR token activated");

    // Verify DB still has exactly ONE token
    const tokensInDb = sqlite.prepare("SELECT * FROM qr_tokens WHERE table_id = 'tbl-4'").all() as any[];
    assert.strictEqual(tokensInDb.length, 1, "Opening table MUST NOT generate a new token");
    assert.strictEqual(tokensInDb[0].active, 1, "Token active is now 1");
    console.log("✓ Step Q: Staff opens Table 4, activating SAME token without generating new token");
  }

  // Step R: Customer joins Table 4 successfully with the permanent URL token
  {
    const res = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: table4Token }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(res.status, 200, "Customer joins Table 4 successfully");
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.session.tableId, "tbl-4");
    assert.strictEqual(body.session.tableName, "Table 4");
    console.log("✓ Step R: Customer joins Table 4 successfully while table is open");
  }

  // Step S: Staff closes Table 4 -> Deactivates permanent token
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-4/close", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );
    assert.strictEqual(res.status, 200, "Staff closes Table 4");
    const body: any = await res.json();
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.qr.active, false, "QR token deactivated");

    // Customer join rejected
    const joinRes = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: table4Token }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(joinRes.status, 401, "Customer rejected after Table 4 closed");
    console.log("✓ Step S: Staff closes Table 4; token deactivated; customer rejected");
  }

  // Step T: Staff reopens Table 4 -> SAME token works again
  {
    const openRes = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-4/open", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );
    assert.strictEqual(openRes.status, 200);

    const joinRes = await worker.fetch(
      new Request("http://localhost:3000/api/qr/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: table4Token }),
      }),
      env,
      {} as any
    );
    assert.strictEqual(joinRes.status, 200, "Customer joins reopened Table 4 with SAME permanent token");
    console.log("✓ Step T: Reopening Table 4 reactivates SAME permanent token");
  }

  // Step U: Staff cannot replace/rotate Table 4 ordering link (404)
  {
    const res = await worker.fetch(
      new Request("http://localhost:3001/api/staff/tables/tbl-4/qr", {
        method: "POST",
        headers: { Cookie: staffCookie },
      }),
      env,
      {} as any
    );
    assert.strictEqual(res.status, 404, "Staff cannot call link replacement endpoint (404 Not Found)");
    console.log("✓ Step U: Staff cannot replace/rotate existing Table 4 ordering link");
  }

  console.log("\n=================================================");
  console.log("ALL TABLE ORDERING LINK ACCESS-CONTROL TESTS PASSED!");
  console.log("=================================================\n");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

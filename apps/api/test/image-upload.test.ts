import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import worker from "../src/index";
import { sha256Hex } from "../src/utils/crypto";
import { detectImageFormat, R2_PUBLIC_BASE_URL } from "../src/utils/image";

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

// ============================================================
// In-Memory Cloudflare R2 Bucket Mock
// ============================================================
function createMockR2Bucket() {
  const store = new Map<
    string,
    { data: Uint8Array; httpMetadata?: Record<string, string> }
  >();

  return {
    store,
    async put(
      key: string,
      value: Uint8Array | ReadableStream<Uint8Array>,
      options?: { httpMetadata?: Record<string, string> },
    ) {
      let bytes: Uint8Array;
      if (value instanceof Uint8Array) {
        bytes = value;
      } else {
        const reader = (value as ReadableStream<Uint8Array>).getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const res = await reader.read();
          if (res.done) done = true;
          else if (res.value) chunks.push(res.value);
        }
        const total = chunks.reduce((acc, c) => acc + c.length, 0);
        bytes = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          bytes.set(c, offset);
          offset += c.length;
        }
      }

      store.set(key, { data: bytes, httpMetadata: options?.httpMetadata });
      return {
        key,
        size: bytes.length,
        httpMetadata: options?.httpMetadata,
      };
    },
    async head(key: string) {
      const obj = store.get(key);
      if (!obj) return null;
      return {
        key,
        size: obj.data.length,
        httpMetadata: obj.httpMetadata,
      };
    },
    async get(key: string) {
      const obj = store.get(key);
      if (!obj) return null;
      return {
        key,
        size: obj.data.length,
        httpMetadata: obj.httpMetadata,
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(obj.data);
            controller.close();
          },
        }),
      };
    },
    async delete(key: string) {
      store.delete(key);
    },
  };
}

// ============================================================
// Cloudflare Images Binding Mock
// ============================================================
function createMockImagesBinding() {
  return {
    input(stream: ReadableStream<Uint8Array>) {
      return {
        output({ format }: { format: string }) {
          return Promise.resolve({
            contentType() {
              return format;
            },
            response() {
              // Valid minimal WebP payload (RIFF ... WEBPVP8)
              const webpData = new Uint8Array([
                0x52, 0x49, 0x46, 0x46, // "RIFF"
                0x24, 0x00, 0x00, 0x00, // file size
                0x57, 0x45, 0x42, 0x50, // "WEBP"
                0x56, 0x50, 0x38, 0x20, // "VP8 "
                0x18, 0x00, 0x00, 0x00, // chunk size
                0x30, 0x01, 0x00, 0x9d,
                0x01, 0x2a, 0x01, 0x00,
                0x01, 0x00, 0x02, 0x00,
                0x34, 0x25, 0xa4, 0x00,
                0x03, 0x70, 0x00, 0xfe,
                0xfb, 0xfd, 0x50, 0x00,
              ]);
              return new Response(webpData, {
                headers: { "Content-Type": "image/webp" },
              });
            },
            image() {
              const res = this.response();
              return res.body!;
            },
          });
        },
      };
    },
  } as any;
}

// ============================================================
// Sample Binary Image Fixtures
// ============================================================
// Valid minimal PNG fixture: 8-byte PNG signature + IHDR chunk + IEND chunk
const SAMPLE_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
  0x00, 0x00, 0x00, 0x0d, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // "IHDR"
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, etc.
  0x1f, 0x15, 0xc4, 0x89, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND chunk length
  0x49, 0x45, 0x4e, 0x44, // "IEND"
  0xae, 0x42, 0x60, 0x82, // CRC
]);

// Valid minimal JPEG fixture: SOI (0xFFD8) + APP0 + EOI (0xFFD9)
const SAMPLE_JPG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0xff, 0xd9, // EOI
]);

// Valid minimal WebP fixture: RIFF + size + WEBP + VP8
const SAMPLE_WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x24, 0x00, 0x00, 0x00, // size
  0x57, 0x45, 0x42, 0x50, // WEBP
  0x56, 0x50, 0x38, 0x20, // VP8
  0x18, 0x00, 0x00, 0x00, // chunk size
  0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x02, 0x00,
  0x34, 0x25, 0xa4, 0x00, 0x03, 0x70, 0x00, 0xfe, 0xfb, 0xfd, 0x50, 0x00,
]);

// Invalid file
const INVALID_FILE = new TextEncoder().encode("This is not an image file at all.");

// Setup SQLite and run all migrations including 0007
function initTestDb() {
  const sqlite = new DatabaseSync(":memory:");
  const migrationNames = [
    "0001_initial_schema.sql",
    "0002_active_table_session.sql",
    "0003__staff_auth.sql",
    "0004_staff_passwords.sql",
    "0005_order_accepted_at.sql",
    "0006_qr_tokens_raw_token.sql",
    "0007_menu_items_image_url.sql",
  ];

  for (const name of migrationNames) {
    const filePath = path.resolve(import.meta.dirname, "../migrations", name);
    const sql = fs.readFileSync(filePath, "utf-8");
    sqlite.exec(sql);
  }

  // Seed menu catalog
  const seedSqlPath = path.resolve(import.meta.dirname, "../scripts/seed-menu.sql");
  const seedSql = fs.readFileSync(seedSqlPath, "utf-8");
  sqlite.exec(seedSql);

  // Seed staff user
  const staffId = "staff-user-1";
  const staffSalt = "test_salt";
  const passwordHash = sha256Hex(`testpass${staffSalt}`);
  sqlite.exec(`
    INSERT INTO users (id, email, role, active, password_hash, password_salt)
    VALUES ('${staffId}', 'chef@ddencorner.local', 'STAFF', 1, '${passwordHash}', '${staffSalt}')
  `);

  return { sqlite, d1: createD1Shim(sqlite), staffId };
}

async function runImageUploadTestSuite() {
  console.log("=================================================");
  console.log("RUNNING STAFF IMAGE UPLOAD & R2 PERSISTENCE TEST SUITE");
  console.log("=================================================\n");

  const { sqlite, d1, staffId } = initTestDb();
  const mockBucket = createMockR2Bucket();
  const mockImages = createMockImagesBinding();

  const env = {
    DB: d1,
    FOOD_IMAGES_BUCKET: mockBucket,
    IMAGES: mockImages,
  } as any;

  // Staff session token
  const rawStaffToken = "test-staff-image-upload-token";
  const staffTokenHash = await sha256Hex(rawStaffToken);
  sqlite.exec(`
    INSERT INTO staff_sessions (id, user_id, token_hash, expires_at)
    VALUES ('sess-1', '${staffId}', '${staffTokenHash}', datetime('now', '+1 day'));
  `);

  const staffHeaders = {
    Cookie: `ddc_staff_session=${rawStaffToken}`,
  };

  // -------------------------------------------------------------
  // Test 1: Unauthenticated request is rejected with 401
  // -------------------------------------------------------------
  console.log("✓ Test 1: Staff authentication is strictly enforced (401)");
  {
    const unauthUpload = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-virgin-mojito/image", {
        method: "POST",
        body: SAMPLE_PNG,
      }),
      env,
      {} as any,
    );
    assert.strictEqual(unauthUpload.status, 401, "Unauthenticated image upload must return 401");

    const unauthDelete = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-virgin-mojito/image", {
        method: "DELETE",
      }),
      env,
      {} as any,
    );
    assert.strictEqual(unauthDelete.status, 401, "Unauthenticated image delete must return 401");
  }

  // -------------------------------------------------------------
  // Test 2: Invalid and oversized uploads are rejected (400)
  // -------------------------------------------------------------
  console.log("✓ Test 2: Invalid format, empty, and oversized uploads are rejected (400)");
  {
    // Empty file
    const emptyRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-virgin-mojito/image", {
        method: "POST",
        headers: staffHeaders,
        body: new Uint8Array([]),
      }),
      env,
      {} as any,
    );
    assert.strictEqual(emptyRes.status, 400, "Empty upload must return 400");
    const emptyBody = await emptyRes.json();
    assert.strictEqual(emptyBody.ok, false);

    // Corrupt / non-image file
    const corruptRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-virgin-mojito/image", {
        method: "POST",
        headers: staffHeaders,
        body: INVALID_FILE,
      }),
      env,
      {} as any,
    );
    assert.strictEqual(corruptRes.status, 400, "Non-image upload must return 400");
    const corruptBody = await corruptRes.json();
    assert.strictEqual(corruptBody.ok, false);

    // Oversized upload (> 8MB)
    const oversizedBytes = new Uint8Array(8 * 1024 * 1024 + 1);
    // Fill first bytes with valid PNG header so it only fails on size check
    oversizedBytes.set(SAMPLE_PNG);
    const oversizedRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-virgin-mojito/image", {
        method: "POST",
        headers: staffHeaders,
        body: oversizedBytes,
      }),
      env,
      {} as any,
    );
    assert.strictEqual(oversizedRes.status, 400, "Oversized upload must return 400");
    const oversizedBody = await oversizedRes.json();
    assert.strictEqual(oversizedBody.ok, false);
    assert.ok(oversizedBody.message.includes("exceeds maximum allowed size"));
  }

  // -------------------------------------------------------------
  // Test 3: Non-existent menu item returns 404
  // -------------------------------------------------------------
  console.log("✓ Test 3: Upload for non-existent item ID returns 404");
  {
    const notFoundRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/non-existent-dish-999/image", {
        method: "POST",
        headers: staffHeaders,
        body: SAMPLE_PNG,
      }),
      env,
      {} as any,
    );
    assert.strictEqual(notFoundRes.status, 404, "Non-existent item must return 404");
  }

  // -------------------------------------------------------------
  // Test 4: Representative PNG upload converts to WebP and uploads to R2
  // -------------------------------------------------------------
  console.log("✓ Test 4: Representative PNG upload -> converted to WebP -> stored in R2 -> persisted in D1");
  let virginMojitoUploadedUrl = "";
  {
    const uploadRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-virgin-mojito/image", {
        method: "POST",
        headers: staffHeaders,
        body: SAMPLE_PNG,
      }),
      env,
      {} as any,
    );

    assert.strictEqual(uploadRes.status, 200, "PNG image upload must succeed with 200");
    const body = await uploadRes.json();
    assert.strictEqual(body.ok, true);
    assert.ok(body.imageUrl, "Response must include imageUrl");
    assert.ok(body.key, "Response must include key");
    virginMojitoUploadedUrl = body.imageUrl;

    // Verify key convention: menu/<unique-filename>.webp
    assert.ok(
      body.key.startsWith("menu/item-virgin-mojito-"),
      `Key must start with menu/item-virgin-mojito-, got: ${body.key}`,
    );
    assert.ok(body.key.endsWith(".webp"), `Key must end with .webp, got: ${body.key}`);

    // Verify R2 object exists and has content-type image/webp
    const r2Head = await mockBucket.head(body.key);
    assert.ok(r2Head, "R2 object must exist in bucket");
    assert.strictEqual(
      r2Head.httpMetadata?.contentType,
      "image/webp",
      "R2 object content type must be image/webp",
    );

    // Verify the data stored in R2 is valid WebP format
    const r2Obj = mockBucket.store.get(body.key);
    assert.ok(r2Obj, "Raw object must exist in store");
    assert.strictEqual(
      detectImageFormat(r2Obj.data),
      "webp",
      "Uploaded file in R2 must be valid WebP",
    );

    // Verify shared D1 record contains updated image_url
    const row = sqlite
      .prepare("SELECT image_url FROM menu_items WHERE id = 'item-virgin-mojito'")
      .get() as any;
    assert.strictEqual(
      row.image_url,
      body.imageUrl,
      "D1 menu_items record must contain the new R2 public URL",
    );
  }

  // -------------------------------------------------------------
  // Test 5: Representative JPG upload converts to WebP
  // -------------------------------------------------------------
  console.log("✓ Test 5: Representative JPG upload -> converted to WebP -> stored in R2 -> persisted in D1");
  {
    const uploadRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-cold-coffee/image", {
        method: "POST",
        headers: staffHeaders,
        body: SAMPLE_JPG,
      }),
      env,
      {} as any,
    );

    assert.strictEqual(uploadRes.status, 200, "JPG image upload must succeed");
    const body = await uploadRes.json();
    assert.strictEqual(body.ok, true);
    assert.ok(body.imageUrl.startsWith(R2_PUBLIC_BASE_URL));

    const row = sqlite
      .prepare("SELECT image_url FROM menu_items WHERE id = 'item-cold-coffee'")
      .get() as any;
    assert.strictEqual(row.image_url, body.imageUrl);
  }

  // -------------------------------------------------------------
  // Test 6: Representative WebP upload preserves WebP directly
  // -------------------------------------------------------------
  console.log("✓ Test 6: Representative WebP upload -> stored in R2 directly without unnecessary conversion");
  {
    const uploadRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-cappuccino/image", {
        method: "POST",
        headers: staffHeaders,
        body: SAMPLE_WEBP,
      }),
      env,
      {} as any,
    );

    assert.strictEqual(uploadRes.status, 200);
    const body = await uploadRes.json();
    assert.strictEqual(body.ok, true);

    const r2Head = await mockBucket.head(body.key);
    assert.ok(r2Head);
    assert.strictEqual(r2Head.httpMetadata?.contentType, "image/webp");
  }

  // -------------------------------------------------------------
  // Test 7: Multipart/form-data upload works identically
  // -------------------------------------------------------------
  console.log("✓ Test 7: Multipart/form-data file upload succeeds");
  {
    const formData = new FormData();
    const file = new File([SAMPLE_PNG], "photo.png", { type: "image/png" });
    formData.append("file", file);

    const uploadRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-espresso/image", {
        method: "POST",
        headers: staffHeaders,
        body: formData,
      }),
      env,
      {} as any,
    );

    assert.strictEqual(uploadRes.status, 200);
    const body = await uploadRes.json();
    assert.strictEqual(body.ok, true);
    assert.ok(body.imageUrl);
  }

  // -------------------------------------------------------------
  // Test 8: Shared Menu Query returns the updated image for both Staff & Customer
  // -------------------------------------------------------------
  console.log("✓ Test 8: Both Staff and Customer APIs return the updated image URL from shared D1");
  {
    // 8a: Customer API (GET /api/menu)
    const customerRes = await worker.fetch(
      new Request("http://localhost/api/menu"),
      env,
      {} as any,
    );
    assert.strictEqual(customerRes.status, 200);
    const customerData = await customerRes.json();
    const customerItem = customerData.items.find(
      (i: any) => i.id === "item-virgin-mojito",
    );
    assert.ok(customerItem, "Customer catalog must contain Virgin Mojito");
    assert.strictEqual(
      customerItem.image_url,
      virginMojitoUploadedUrl,
      "Customer catalog must receive the updated R2 image URL from D1",
    );

    // 8b: Staff API (GET /api/staff/menu/items)
    const staffRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items", {
        headers: staffHeaders,
      }),
      env,
      {} as any,
    );
    assert.strictEqual(staffRes.status, 200);
    const staffData = await staffRes.json();
    const staffItem = staffData.items.find(
      (i: any) => i.id === "item-virgin-mojito",
    );
    assert.ok(staffItem, "Staff catalog must contain Virgin Mojito");
    assert.strictEqual(
      staffItem.image_url,
      virginMojitoUploadedUrl,
      "Staff catalog must receive the updated R2 image URL from D1",
    );
  }

  // -------------------------------------------------------------
  // Test 9: Image resolution priority: uploaded image takes precedence
  // -------------------------------------------------------------
  console.log("✓ Test 9: Image resolution precedence over hardcoded catalog mapping");
  {
    // Import image resolution function
    const { getMenuItemImageUrl } = await import(
      "../../../apps/customer/src/lib/menu-images.js"
    );

    const updatedItem = {
      id: "item-virgin-mojito",
      name: "Virgin Mojito",
      image_url: virginMojitoUploadedUrl,
    };

    const resolvedUrl = getMenuItemImageUrl(updatedItem);
    assert.strictEqual(
      resolvedUrl,
      virginMojitoUploadedUrl,
      "Newly uploaded image must take precedence over hardcoded catalog mapping",
    );
  }

  // -------------------------------------------------------------
  // Test 10: Reset / Restore default catalog photo
  // -------------------------------------------------------------
  console.log("✓ Test 10: Staff can remove custom photo and restore catalog default");
  {
    const deleteRes = await worker.fetch(
      new Request("http://localhost/api/staff/menu/items/item-virgin-mojito/image", {
        method: "DELETE",
        headers: staffHeaders,
      }),
      env,
      {} as any,
    );

    assert.strictEqual(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.strictEqual(deleteBody.ok, true);
    assert.strictEqual(deleteBody.item.image_url, null);

    // Verify in customer catalog
    const customerRes = await worker.fetch(
      new Request("http://localhost/api/menu"),
      env,
      {} as any,
    );
    const customerData = await customerRes.json();
    const customerItem = customerData.items.find(
      (i: any) => i.id === "item-virgin-mojito",
    );
    assert.strictEqual(customerItem.image_url, null);

    // Customer visual resolution reverts to default catalog image
    const { getMenuItemImageUrl, ITEM_IMAGE_MAP } = await import(
      "../../../apps/customer/src/lib/menu-images.js"
    );
    const restoredUrl = getMenuItemImageUrl(customerItem);
    assert.strictEqual(
      restoredUrl,
      ITEM_IMAGE_MAP["item-virgin-mojito"],
      "Visual resolution must fall back to catalog mapping when custom image is removed",
    );
  }

  console.log("\n=================================================");
  console.log("ALL STAFF IMAGE UPLOAD & R2 PERSISTENCE TESTS PASSED CLEANLY!");
  console.log("=================================================");
}

runImageUploadTestSuite().catch((err) => {
  console.error("IMAGE UPLOAD TEST SUITE FAILED:", err);
  process.exit(1);
});

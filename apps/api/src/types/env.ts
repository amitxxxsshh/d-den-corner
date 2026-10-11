import type { D1Database, R2Bucket, ImagesBinding } from "@cloudflare/workers-types";

export type Bindings = {
  DB: D1Database;
  FOOD_IMAGES_BUCKET: R2Bucket;
  IMAGES?: ImagesBinding;
  CUSTOMER_ORIGIN?: string;
  STAFF_ORIGIN?: string;
};
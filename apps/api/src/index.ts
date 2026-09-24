import { Hono } from 'hono';
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'd-den-corner-api',
  });
});

export default app;
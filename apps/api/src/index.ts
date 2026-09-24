import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'd-den-corner-api',
  });
});

export default app;
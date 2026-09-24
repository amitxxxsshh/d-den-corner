# D Den Corner

Production restaurant ordering platform.

## Applications

- `apps/customer` — customer-facing Next.js application
- `apps/staff` — staff/admin Next.js application
- `apps/api` — Hono + Cloudflare Workers API

## Packages

- `packages/shared` — shared application contracts/utilities
- `packages/config` — shared configuration

## Infrastructure

- Cloudflare Pages — customer
- Cloudflare Pages — staff
- Cloudflare Workers — API
- Cloudflare D1 — database
- Cloudflare Durable Objects — real-time coordination
- WebSockets — real-time communication

## Development

Install dependencies:

```bash
pnpm install
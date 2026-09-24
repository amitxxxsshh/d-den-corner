# D Den Corner Database

The persistent source of truth is Cloudflare D1.

The database is managed through versioned SQL migrations.

## Core relationships

Location
→ Table
→ Table Session
→ Customer Session
→ Orders
→ Order Items
→ Order Status History

Menu Category
→ Menu Item

Festival
→ Special Menu
→ Special Menu Items

Users
→ Audit Logs
→ Order Status History
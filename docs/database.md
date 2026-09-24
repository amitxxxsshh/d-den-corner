# D Den Corner Database

## Overview

D Den Corner uses Cloudflare D1 as the persistent SQL database.

The API is the only layer that communicates with D1.

Customer and staff frontends do not access D1 directly.

Architecture:

Customer / Staff
        ↓
Hono API
        ↓
Database access layer
        ↓
Cloudflare D1

## Core entities

### users

Stores staff and admin accounts.

Roles:

- STAFF
- ADMIN

Authentication credentials are not stored as plaintext passwords.

### locations

Stores physical restaurant areas.

Examples:

- Indoor
- Rooftop
- Mocktail Counter

### tables

Stores physical tables.

Every table belongs to one location.

The combination of:

location_id + name

must be unique.

### qr_tokens

Stores hashed QR tokens associated with tables.

Raw QR tokens are not stored in the database.

### table_sessions

Represents one active usage period of a physical table.

A table session can be:

- ACTIVE
- CLOSED

Closing a table session invalidates the previous customer session context.

### customer_sessions

Represents an individual customer/device session.

Multiple customer sessions can belong to the same table session.

### menu_categories

Stores menu categories and their display ordering.

### menu_items

Stores regular menu items.

Menu items support:

- price
- availability
- archive state
- category

Prices are stored as integer minor currency units.

Example:

₹120.50 = 12050

### orders

Every submitted order is a separate order record.

Order statuses:

- NEW
- ACCEPTED
- PREPARING
- READY
- SERVED

Orders are never overwritten to represent a later order.

### order_items

Stores the individual items belonging to an order.

Historical item name and price are stored as snapshots.

This protects historical orders from later menu changes.

### order_status_history

Stores every order status transition.

This provides an audit/history trail for order status.

### festivals

Stores festival or campaign definitions.

Categories:

- ODISHA
- INDIAN
- CUSTOM

### special_menus

Stores menus associated with festivals/campaigns.

### special_menu_items

Associates existing menu items with special menus and optionally overrides their price.

### audit_logs

Stores important staff/admin/security actions.

Examples:

- MENU_PRICE_CHANGED
- MENU_ITEM_ARCHIVED
- TABLE_SESSION_CLOSED
- QR_REVOKED
- STAFF_ROLE_CHANGED
- ORDER_MANUAL_ACTION

## Relationships

Location

    ↓

Table

    ↓

Table Session

    ↓

Customer Session

    ↓

Order

    ↓

Order Item


Menu Category

    ↓

Menu Item


Festival

    ↓

Special Menu

    ↓

Special Menu Item

    ↓

Menu Item

## Security principles

The client must never be trusted for:

- prices
- order totals
- roles
- table ownership
- table session ownership
- order ownership
- menu availability
- authorization

The server must validate these values.

QR tokens are opaque random identifiers.

Only token hashes are stored in the database.

## Migration policy

Database schema changes must be made through versioned D1 migration files.

Do not manually modify production tables through the Cloudflare dashboard.

Migration files are stored in:

apps/api/migrations/

Example:

0001_initial_schema.sql

Future schema changes must use additional migrations:

0002_description.sql
0003_description.sql
etc.

## Database access policy

Application code should use the database access layer under:

apps/api/src/db/

Routes should not contain large amounts of raw SQL.

The intended architecture is:

Route
  ↓
Validation
  ↓
Authentication
  ↓
Authorization
  ↓
Service
  ↓
DB access layer
  ↓
D1
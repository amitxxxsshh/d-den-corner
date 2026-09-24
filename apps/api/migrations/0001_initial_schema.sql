PRAGMA foreign_keys = ON;

-- ============================================================
-- D DEN CORNER
-- Phase 3 - Initial Database Schema
-- ============================================================

-- ============================================================
-- USERS
-- Staff and admin accounts.
-- Passwords/authentication secrets are NOT stored here yet.
-- ============================================================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'STAFF'
        CHECK (role IN ('STAFF', 'ADMIN')),
    active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role
    ON users(role);

CREATE INDEX idx_users_active
    ON users(active);


-- ============================================================
-- LOCATIONS
-- Examples:
-- Indoor
-- Rooftop
-- Mocktail Counter
-- ============================================================

CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_active
    ON locations(active);


-- ============================================================
-- TABLES
-- Physical restaurant tables belonging to a location.
-- ============================================================

CREATE TABLE tables (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tables_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_tables_location_name
        UNIQUE (location_id, name)
);

CREATE INDEX idx_tables_location
    ON tables(location_id);

CREATE INDEX idx_tables_active
    ON tables(active);


-- ============================================================
-- QR TOKENS
-- Stores HASHES of QR tokens.
-- Raw QR tokens must not be stored in the database.
-- ============================================================

CREATE TABLE qr_tokens (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TEXT,

    CONSTRAINT fk_qr_tokens_table
        FOREIGN KEY (table_id)
        REFERENCES tables(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_qr_tokens_table
    ON qr_tokens(table_id);

CREATE INDEX idx_qr_tokens_active
    ON qr_tokens(active);


-- ============================================================
-- TABLE SESSIONS
-- One active customer/group session for a physical table.
-- ============================================================

CREATE TABLE table_sessions (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'CLOSED')),
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_table_sessions_table
        FOREIGN KEY (table_id)
        REFERENCES tables(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_table_sessions_closed_time
        CHECK (
            (status = 'ACTIVE' AND closed_at IS NULL)
            OR
            (status = 'CLOSED' AND closed_at IS NOT NULL)
        )
);

CREATE INDEX idx_table_sessions_table_status
    ON table_sessions(table_id, status);

CREATE INDEX idx_table_sessions_status
    ON table_sessions(status);


-- ============================================================
-- CUSTOMER SESSIONS
-- Temporary session belonging to a customer phone/device.
-- Multiple customer sessions can belong to one table session.
-- ============================================================

CREATE TABLE customer_sessions (
    id TEXT PRIMARY KEY,
    table_session_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_sessions_table_session
        FOREIGN KEY (table_session_id)
        REFERENCES table_sessions(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_customer_sessions_table_session
    ON customer_sessions(table_session_id);

CREATE INDEX idx_customer_sessions_expires
    ON customer_sessions(expires_at);


-- ============================================================
-- MENU CATEGORIES
-- ============================================================

CREATE TABLE menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_categories_active_sort
    ON menu_categories(active, sort_order);


-- ============================================================
-- MENU ITEMS
--
-- Money is stored as INTEGER minor units.
-- Example:
-- ₹120.50 -> 12050
--
-- This avoids floating-point money calculations.
-- ============================================================

CREATE TABLE menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_minor INTEGER NOT NULL
        CHECK (price_minor >= 0),
    available INTEGER NOT NULL DEFAULT 1
        CHECK (available IN (0, 1)),
    archived INTEGER NOT NULL DEFAULT 0
        CHECK (archived IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_menu_items_category
        FOREIGN KEY (category_id)
        REFERENCES menu_categories(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_menu_items_category
    ON menu_items(category_id);

CREATE INDEX idx_menu_items_category_available
    ON menu_items(category_id, available);

CREATE INDEX idx_menu_items_archived
    ON menu_items(archived);


-- ============================================================
-- ORDERS
-- Each submitted order is a separate event.
-- ============================================================

CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    table_session_id TEXT NOT NULL,
    customer_session_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW'
        CHECK (
            status IN (
                'NEW',
                'ACCEPTED',
                'PREPARING',
                'READY',
                'SERVED'
            )
        ),
    total_amount_minor INTEGER NOT NULL DEFAULT 0
        CHECK (total_amount_minor >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_table_session
        FOREIGN KEY (table_session_id)
        REFERENCES table_sessions(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_orders_customer_session
        FOREIGN KEY (customer_session_id)
        REFERENCES customer_sessions(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_orders_table_session_created
    ON orders(table_session_id, created_at);

CREATE INDEX idx_orders_status_created
    ON orders(status, created_at);

CREATE INDEX idx_orders_customer_session
    ON orders(customer_session_id);


-- ============================================================
-- ORDER ITEMS
--
-- item_name_snapshot and unit_price_minor preserve historical
-- information even if the menu changes later.
-- ============================================================

CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    item_name_snapshot TEXT NOT NULL,
    unit_price_minor INTEGER NOT NULL
        CHECK (unit_price_minor >= 0),
    quantity INTEGER NOT NULL
        CHECK (quantity > 0),
    line_total_minor INTEGER NOT NULL
        CHECK (line_total_minor >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_menu_item
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_order_items_order
    ON order_items(order_id);

CREATE INDEX idx_order_items_menu_item
    ON order_items(menu_item_id);


-- ============================================================
-- ORDER STATUS HISTORY
-- Keeps the complete status transition history.
-- ============================================================

CREATE TABLE order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL
        CHECK (
            to_status IN (
                'NEW',
                'ACCEPTED',
                'PREPARING',
                'READY',
                'SERVED'
            )
        ),
    changed_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_status_history_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_order_status_history_user
        FOREIGN KEY (changed_by_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_order_status_history_from_status
        CHECK (
            from_status IS NULL
            OR from_status IN (
                'NEW',
                'ACCEPTED',
                'PREPARING',
                'READY',
                'SERVED'
            )
        )
);

CREATE INDEX idx_order_status_history_order_created
    ON order_status_history(order_id, created_at);

CREATE INDEX idx_order_status_history_user
    ON order_status_history(changed_by_user_id);


-- ============================================================
-- FESTIVALS
-- ============================================================

CREATE TABLE festivals (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL
        CHECK (category IN ('ODISHA', 'INDIAN', 'CUSTOM')),
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 0
        CHECK (active IN (0, 1)),
    archived INTEGER NOT NULL DEFAULT 0
        CHECK (archived IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_festivals_date_range
        CHECK (end_date >= start_date)
);

CREATE INDEX idx_festivals_category
    ON festivals(category);

CREATE INDEX idx_festivals_active_dates
    ON festivals(active, start_date, end_date);

CREATE INDEX idx_festivals_archived
    ON festivals(archived);


-- ============================================================
-- SPECIAL MENUS
-- A festival/campaign can have one or more special menus.
-- ============================================================

CREATE TABLE special_menus (
    id TEXT PRIMARY KEY,
    festival_id TEXT NOT NULL,
    name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 0
        CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_special_menus_festival
        FOREIGN KEY (festival_id)
        REFERENCES festivals(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_special_menus_festival
    ON special_menus(festival_id);

CREATE INDEX idx_special_menus_active
    ON special_menus(active);


-- ============================================================
-- SPECIAL MENU ITEMS
-- Links existing menu items to special menus.
-- ============================================================

CREATE TABLE special_menu_items (
    id TEXT PRIMARY KEY,
    special_menu_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    special_price_minor INTEGER
        CHECK (special_price_minor >= 0),
    available INTEGER NOT NULL DEFAULT 1
        CHECK (available IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_special_menu_items_special_menu
        FOREIGN KEY (special_menu_id)
        REFERENCES special_menus(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_special_menu_items_menu_item
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_special_menu_item
        UNIQUE (special_menu_id, menu_item_id)
);

CREATE INDEX idx_special_menu_items_special_menu
    ON special_menu_items(special_menu_id);

CREATE INDEX idx_special_menu_items_menu_item
    ON special_menu_items(menu_item_id);


-- ============================================================
-- AUDIT LOGS
-- Important staff/admin/security actions.
-- ============================================================

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_created
    ON audit_logs(user_id, created_at);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_logs_action_created
    ON audit_logs(action, created_at);
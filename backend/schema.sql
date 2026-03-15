-- ══════════════════════════════════════════
-- NIDHI CREATION — schema.sql
-- Run this once to set up all tables
-- Command: psql -U postgres -d NidhiCreation -f backend/schema.sql
-- ══════════════════════════════════════════


-- ── 1. VISITORS ──────────────────────────
-- Stores users who log in from the login page
-- Fields match Login.html: name, phone, business

CREATE TABLE IF NOT EXISTS visitors (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    phone       VARCHAR(15)   NOT NULL,
    business    VARCHAR(150)  NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- ── 2. ADMINS ────────────────────────────
-- Stores admin credentials for AdminLogin.html
-- Password is stored as a bcrypt hash, never plain text

CREATE TABLE IF NOT EXISTS admins (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- ── 3. CATEGORIES ────────────────────────
-- One row per sign type shown in the navbar dropdown
-- slug is used in the URL: /category/neon

CREATE TABLE IF NOT EXISTS categories (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(50)   NOT NULL UNIQUE,  -- e.g. "neon", "3d", "led"
    name         VARCHAR(100)  NOT NULL,          -- e.g. "Neon Signs"
    description  TEXT          NOT NULL,          -- shown on category page
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- ── 4. PROJECTS ──────────────────────────
-- Each past work/project shown on the category page
-- image_data  stores the raw image bytes (BYTEA)
-- image_mime  stores type e.g. "image/jpeg", "image/png", "image/webp"
-- Image is served via:  GET /api/project/<id>/image
-- The JS sets:  <img src="/api/project/proj_001/image">

CREATE TABLE IF NOT EXISTS projects (
    id             VARCHAR(20)  PRIMARY KEY,       -- e.g. "proj_001"
    title          VARCHAR(150) NOT NULL,           -- e.g. "Café Lumière"
    category_slug  VARCHAR(50)  NOT NULL REFERENCES categories(slug),
    image_data     BYTEA        NOT NULL,           -- raw image binary stored here
    image_mime     VARCHAR(20)  NOT NULL DEFAULT 'image/jpeg',  -- mime type of image
    description    TEXT         NOT NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- ── 5. CONTACT MESSAGES ──────────────────
-- Stores messages submitted from ContactUs.html

CREATE TABLE IF NOT EXISTS contact_messages (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL,
    phone       VARCHAR(15),                       -- optional field
    message     TEXT          NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- ══════════════════════════════════════════
-- SEED DATA — categories
-- Insert all 8 categories that match the navbar
-- ══════════════════════════════════════════

INSERT INTO categories (slug, name, description) VALUES
    ('neon', 'Neon Signs', 'Custom LED and glass-tube neon signs in any shape, colour, or text. Perfect for cafes, shops, events, and interiors.')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, description) VALUES
    ('3d', '3D Letter Signs', 'Raised acrylic, foam, and metal 3D letters that give your brand real depth and presence on any wall or storefront.')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, description) VALUES
    ('led', 'LED Display Boards', 'Programmable scrolling LED boards and backlit display panels for shops, offices, and roadside hoardings.')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, description) VALUES
    ('flex', 'Flex & Vinyl Boards', 'Large-format flex printing for shop fronts, banners, hoardings, and events. Fast turnaround, vivid colours.')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, description) VALUES
    ('acrylic', 'Acrylic Signage', 'Frosted, transparent, and UV-printed acrylic boards for offices, clinics, salons, and retail shops.')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, description) VALUES
    ('metal', 'Metal Signs', 'Precision-cut stainless steel, brass, and aluminium signs for a premium, long-lasting look on any building or lobby.')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, description) VALUES
    ('wooden', 'Wooden Boards', 'Carved, routed, and hand-painted wood signage for restaurants, resorts, homes, and boutique shops.')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (slug, name, description) VALUES
    ('glow', 'Glow Signboards', 'Backlit, edge-lit, and halo-effect illuminated sign boards that stay visible day and night.')
    ON CONFLICT (slug) DO NOTHING;


-- ══════════════════════════════════════════
-- SEED DATA — default admin account
-- Username: admin
-- Password: admin123  (change this immediately after setup)
-- To generate a real hash run:
--   python3 -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"
-- Then replace the hash below
-- ══════════════════════════════════════════

INSERT INTO admins (username, password_hash) VALUES
    ('admin', '$2b$12$placeholderHashReplaceThisWithRealHash')
    ON CONFLICT (username) DO NOTHING;
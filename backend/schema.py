# ══════════════════════════════════════════
# NIDHI CREATION — database/schema.py
# Run once to create all tables:
#   python -m database.schema
# ══════════════════════════════════════════

from core.config import get_connection


def create_tables():
    conn = get_connection()
    cur  = conn.cursor()

    # ── Visitors ─────────────────────────────
    # Stores every person who logs in from the public Login page
    cur.execute("""
        CREATE TABLE IF NOT EXISTS visitors (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(120)  NOT NULL,
            phone       VARCHAR(20)   NOT NULL,
            business    VARCHAR(150),
            visited_at  TIMESTAMP     NOT NULL DEFAULT NOW()
        );
    """)

    # ── Admins ───────────────────────────────
    # Stores admin credentials (password stored as bcrypt hash)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id              SERIAL PRIMARY KEY,
            username        VARCHAR(60)  NOT NULL UNIQUE,
            password_hash   TEXT         NOT NULL,
            created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
        );
    """)

    # ── Categories ───────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id          SERIAL PRIMARY KEY,
            slug        VARCHAR(60)   NOT NULL UNIQUE,
            name        VARCHAR(100)  NOT NULL,
            description TEXT,
            display_order INTEGER      NOT NULL DEFAULT 0,
            is_visible  BOOLEAN       NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
        );
    """)

    # ── Projects ─────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id            SERIAL PRIMARY KEY,
            title         VARCHAR(150)  NOT NULL,
            description   TEXT,
            category_slug VARCHAR(60)   NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
            image_data    BYTEA,
            image_mime    VARCHAR(50)   DEFAULT 'image/jpeg',
            display_order INTEGER       NOT NULL DEFAULT 0,
            is_visible    BOOLEAN       NOT NULL DEFAULT TRUE,
            created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
        );
    """)

    # ── Contact Info ─────────────────────────
    # Single-row table — always upsert row with id=1
    cur.execute("""
        CREATE TABLE IF NOT EXISTS contact_info (
            id           INTEGER PRIMARY KEY DEFAULT 1,
            phone        VARCHAR(30),
            email        VARCHAR(120),
            address      TEXT,
            working_hours VARCHAR(100),
            maps_embed_url TEXT,
            updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT single_row CHECK (id = 1)
        );
    """)

    # Insert the default contact row if not present
    cur.execute("""
        INSERT INTO contact_info (id, phone, email, address, working_hours)
        VALUES (1, '+91 98765 43210', 'info@nidhicreation.in',
                '123, Signboard Market, Ahmedabad, Gujarat — 380001',
                'Mon – Sat: 9:00 AM – 7:00 PM')
        ON CONFLICT (id) DO NOTHING;
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✓ All tables created successfully.")


if __name__ == '__main__':
    create_tables()
# ══════════════════════════════════════════
# NIDHI CREATION — database/schema.py
# Run once to create all tables:
#   python -m database.schema
# ══════════════════════════════════════════

from core.config import get_connection


def create_tables():
    conn = get_connection()
    cur  = conn.cursor()

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
            id            SERIAL PRIMARY KEY,
            slug          VARCHAR(60)   NOT NULL UNIQUE,
            name          VARCHAR(100)  NOT NULL,
            description   TEXT,
            display_order INTEGER       NOT NULL DEFAULT 0,
            is_visible    BOOLEAN       NOT NULL DEFAULT TRUE,
            created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
        );
    """)

    # ── Projects ─────────────────────────────
    # No longer holds image_data or a single category_slug.
    # Images live in project_images; categories in project_categories.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id            SERIAL PRIMARY KEY,
            title         VARCHAR(150)  NOT NULL,
            description   TEXT,
            display_order INTEGER       NOT NULL DEFAULT 0,
            is_visible    BOOLEAN       NOT NULL DEFAULT TRUE,
            created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
            review_text   TEXT,
            review_rating SMALLINT      CHECK (review_rating BETWEEN 1 AND 5)
        );
    """)

    # ── Migration: Add columns to existing projects table ──
    try:
        cur.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS review_text TEXT;")
        cur.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS review_rating SMALLINT CHECK (review_rating BETWEEN 1 AND 5);")
    except Exception as e:
        print(f"Migration notice: {e}")
        conn.rollback()
        cur = conn.cursor()

    # ── Project <-> Categories (Many-to-Many) ──
    # A project can belong to multiple categories.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_categories (
            project_id    INTEGER    NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
            category_slug VARCHAR(60) NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
            PRIMARY KEY (project_id, category_slug)
        );
    """)

    # ── Project Images (One-to-Many) ─────────
    # One project can have many images.
    # Exactly ONE image per project should have is_cover = TRUE.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_images (
            id            SERIAL  PRIMARY KEY,
            project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            image_data    BYTEA   NOT NULL,
            image_mime    VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
            is_cover      BOOLEAN NOT NULL DEFAULT FALSE,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at    TIMESTAMP NOT NULL DEFAULT NOW()
        );
    """)

    # ── Project Image Variants ────────────────
    # Stores optimized versions (AVIF, WebP, different sizes)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_image_variants (
            id            SERIAL  PRIMARY KEY,
            image_id      INTEGER NOT NULL REFERENCES project_images(id) ON DELETE CASCADE,
            size_label    VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large', 'original'
            format        VARCHAR(10) NOT NULL, -- 'avif', 'webp', 'jpeg'
            image_data    BYTEA   NOT NULL,
            image_mime    VARCHAR(50) NOT NULL,
            width         INTEGER NOT NULL,
            height        INTEGER NOT NULL,
            created_at    TIMESTAMP NOT NULL DEFAULT NOW()
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_variants_image_id ON project_image_variants(image_id);")

    # ── Contact Info ─────────────────────────
    # Single-row table — always upsert row with id=1
    cur.execute("""
        CREATE TABLE IF NOT EXISTS contact_info (
            id             INTEGER PRIMARY KEY DEFAULT 1,
            phone          VARCHAR(30),
            email          VARCHAR(120),
            address        TEXT,
            working_hours  VARCHAR(100),
            maps_embed_url TEXT,
            updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT single_row CHECK (id = 1)
        );
    """)

    # Insert the default contact row if not present
    cur.execute("""
        INSERT INTO contact_info (id, phone, email, address, working_hours)
        VALUES (1, '+91 98765 43210', 'info@nidhicreation.in',
                '123, Signboard Market, Ahmedabad, Gujarat — 380001',
                'Mon - Sat: 9:00 AM - 7:00 PM')
        ON CONFLICT (id) DO NOTHING;
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("All tables created successfully.")


if __name__ == '__main__':
    create_tables()
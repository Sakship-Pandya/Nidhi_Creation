# ══════════════════════════════════════════
# NIDHI CREATION — backend/database/models.py
# All database query functions used by server.py
# ══════════════════════════════════════════

import bcrypt
import psycopg2
from core.config import get_connection


# ────────────────────────────────────────────
# VISITORS  (Login.html)
# ────────────────────────────────────────────

def add_visitor(name, phone, business):
    """
    Save a new visitor login.
    Called when Login.html form is submitted.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO visitors (name, phone, business)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (name, phone, business)
        )
        visitor_id = cursor.fetchone()[0]
        conn.commit()
        return visitor_id
    finally:
        cursor.close()
        conn.close()


def get_visitor_by_phone(phone):
    """
    Check if a visitor with this phone number already exists.
    Returns the row or None.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, name, phone, business FROM visitors WHERE phone = %s",
            (phone,)
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


# ────────────────────────────────────────────
# ADMINS  (AdminLogin.html)
# ────────────────────────────────────────────

def get_admin_by_username(username):
    """
    Fetch admin row by username.
    Returns (id, username, password_hash) or None.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, username, password_hash FROM admins WHERE username = %s",
            (username,)
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


def verify_admin_password(username, plain_password):
    """
    Check if the given password matches the stored bcrypt hash.
    Returns True if valid, False otherwise.
    """
    admin = get_admin_by_username(username)
    if not admin:
        return False
    stored_hash = admin[2]
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        stored_hash.encode('utf-8')
    )


def create_admin(username, plain_password):
    """
    Create a new admin with a hashed password.
    Use this from a setup script, not exposed as an API.
    """
    password_hash = bcrypt.hashpw(
        plain_password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO admins (username, password_hash) VALUES (%s, %s)",
            (username, password_hash)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()


# ────────────────────────────────────────────
# CATEGORIES  (navbar dropdown + Category.html)
# ────────────────────────────────────────────

def get_all_categories():
    """
    Return all categories for the navbar dropdown.
    Returns list of (slug, name, description).
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT slug, name, description FROM categories ORDER BY name"
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


def get_category_by_slug(slug):
    """
    Return a single category row by its slug.
    Returns (slug, name, description) or None.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT slug, name, description FROM categories WHERE slug = %s",
            (slug,)
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


# ────────────────────────────────────────────
# PROJECTS  (Category.html cards + Home.html past works)
#
# Images are stored as raw bytes in image_data (BYTEA).
# The JS sets:  <img src="/api/project/proj_001/image">
# The server serves the bytes via get_project_image()
# ────────────────────────────────────────────

def get_projects_by_category(slug):
    """
    Return all projects for a category — WITHOUT image bytes.
    image_data is large so we exclude it here and serve it
    separately via /api/project/<id>/image.
    Returns list of dicts, newest first.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, title, category_slug, image_mime, description, created_at
            FROM   projects
            WHERE  category_slug = %s
            ORDER  BY created_at DESC
            """,
            (slug,)
        )
        rows = cursor.fetchall()
        return [
            {
                'id':          row[0],
                'title':       row[1],
                'category':    row[2],
                # image_url points to the image endpoint — JS uses this as <img src>
                'image_url':   f'/api/project/{row[0]}/image',
                'image_mime':  row[3],
                'description': row[4],
                'created_at':  row[5].isoformat() if row[5] else None
            }
            for row in rows
        ]
    finally:
        cursor.close()
        conn.close()


def get_recent_projects(limit=6):
    """
    Return most recent projects across all categories — WITHOUT image bytes.
    Used on Home.html Past Works section.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, title, category_slug, image_mime, description, created_at
            FROM   projects
            ORDER  BY created_at DESC
            LIMIT  %s
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        return [
            {
                'id':          row[0],
                'title':       row[1],
                'category':    row[2],
                'image_url':   f'/api/project/{row[0]}/image',
                'image_mime':  row[3],
                'description': row[4],
                'created_at':  row[5].isoformat() if row[5] else None
            }
            for row in rows
        ]
    finally:
        cursor.close()
        conn.close()


def get_project_image(project_id):
    """
    Return ONLY the image bytes and mime type for one project.
    Called by GET /api/project/<id>/image
    Returns (image_data_bytes, mime_type) or (None, None).
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT image_data, image_mime FROM projects WHERE id = %s",
            (project_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None, None
        # psycopg2 returns BYTEA as memoryview — convert to bytes
        return bytes(row[0]), row[1]
    finally:
        cursor.close()
        conn.close()


def add_project(project_id, title, category_slug, image_bytes, image_mime, description):
    """
    Insert a new project with image stored as binary.
    image_bytes = raw bytes read from the uploaded image file
    image_mime  = e.g. "image/jpeg", "image/png", "image/webp"
    Called from admin panel upload.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO projects (id, title, category_slug, image_data, image_mime, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (project_id, title, category_slug,
             psycopg2.Binary(image_bytes), image_mime, description)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()


# ────────────────────────────────────────────
# CONTACT MESSAGES  (ContactUs.html)
# ────────────────────────────────────────────

def save_contact_message(name, email, message, phone=None):
    """
    Save a contact form submission.
    Called when ContactUs.html form is submitted.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO contact_messages (name, email, phone, message)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (name, email, phone, message)
        )
        msg_id = cursor.fetchone()[0]
        conn.commit()
        return msg_id
    finally:
        cursor.close()
        conn.close()


def get_all_contact_messages():
    """
    Return all contact messages. For admin panel use.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT id, name, email, phone, message, created_at
            FROM   contact_messages
            ORDER  BY created_at DESC
            """
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
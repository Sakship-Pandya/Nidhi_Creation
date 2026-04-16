# ══════════════════════════════════════════
# NIDHI CREATION — database/modal.py
# All database read/write functions
# ══════════════════════════════════════════

import bcrypt
from core.config import get_connection


# ════════════════════════════════
# VISITORS
# ════════════════════════════════

def add_visitor(name: str, phone: str, business: str = None):
    """Save a new visitor login."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "INSERT INTO visitors (name, phone, business) VALUES (%s, %s, %s)",
        (name, phone, business)
    )
    conn.commit()
    cur.close()
    conn.close()


def search_visitors_by_name(name: str) -> list[dict]:
    """
    Return all visitors whose name contains the search string (case-insensitive).
    Ordered by most recent first.
    """
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        SELECT id, name, phone, business, visited_at
        FROM   visitors
        WHERE  name ILIKE %s
        ORDER  BY visited_at DESC
        """,
        (f'%{name}%',)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            'id':         r[0],
            'name':       r[1],
            'phone':      r[2],
            'business':   r[3],
            'visited_at': r[4].strftime('%d %b %Y, %I:%M %p') if r[4] else None,
        }
        for r in rows
    ]


# ════════════════════════════════
# ADMINS
# ════════════════════════════════

def create_admin(username: str, password: str):
    """
    Create a new admin account.
    Password is hashed with bcrypt before storing.
    Run once via seed_admin.py — not exposed as an API route.
    """
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "INSERT INTO admins (username, password_hash) VALUES (%s, %s)",
        (username, password_hash)
    )
    conn.commit()
    cur.close()
    conn.close()


def verify_admin_password(username: str, password: str) -> bool:
    """Return True if username exists and password matches the stored hash."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "SELECT password_hash FROM admins WHERE username = %s",
        (username,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return False
    return bcrypt.checkpw(password.encode(), row[0].encode())


# ════════════════════════════════
# CATEGORIES
# ════════════════════════════════

def get_all_categories(visible_only: bool = False) -> list[dict]:
    """Return all categories ordered by display_order."""
    conn = get_connection()
    cur  = conn.cursor()

    query = """
        SELECT id, slug, name, description, display_order, is_visible, created_at
        FROM   categories
        {}
        ORDER  BY display_order ASC, id ASC
    """.format("WHERE is_visible = TRUE" if visible_only else "")

    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            'id':            r[0],
            'slug':          r[1],
            'name':          r[2],
            'description':   r[3],
            'display_order': r[4],
            'is_visible':    r[5],
            'created_at':    r[6].strftime('%d %b %Y') if r[6] else None,
        }
        for r in rows
    ]


def get_category_by_slug(slug: str) -> dict | None:
    """Return a single category by its slug, or None if not found."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        SELECT id, slug, name, description, display_order, is_visible
        FROM   categories
        WHERE  slug = %s
        """,
        (slug,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return None
    return {
        'id':            row[0],
        'slug':          row[1],
        'name':          row[2],
        'description':   row[3],
        'display_order': row[4],
        'is_visible':    row[5],
    }


def add_category(slug: str, name: str, description: str = None,
                 display_order: int = 0, is_visible: bool = True) -> int:
    """Insert a new category. Returns the new row id."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        INSERT INTO categories (slug, name, description, display_order, is_visible)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (slug, name, description, display_order, is_visible)
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return new_id


def update_category(category_id: int, slug: str, name: str,
                    description: str = None, display_order: int = 0,
                    is_visible: bool = True):
    """Update an existing category."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        UPDATE categories
        SET    slug = %s, name = %s, description = %s,
               display_order = %s, is_visible = %s
        WHERE  id = %s
        """,
        (slug, name, description, display_order, is_visible, category_id)
    )
    conn.commit()
    cur.close()
    conn.close()


def delete_category(category_id: int):
    """Delete a category. Will fail if projects still reference it."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("DELETE FROM categories WHERE id = %s", (category_id,))
    conn.commit()
    cur.close()
    conn.close()


def reorder_categories(ordered_ids: list[int]):
    """
    Update display_order for a list of category ids.
    ordered_ids = [id_first, id_second, …] — position = index.
    """
    conn = get_connection()
    cur  = conn.cursor()
    for position, cat_id in enumerate(ordered_ids):
        cur.execute(
            "UPDATE categories SET display_order = %s WHERE id = %s",
            (position, cat_id)
        )
    conn.commit()
    cur.close()
    conn.close()


# ════════════════════════════════
# PROJECTS
# ════════════════════════════════

def get_all_projects(visible_only: bool = False) -> list[dict]:
    """Return all projects with their categories. Ordered by display_order."""
    conn = get_connection()
    cur  = conn.cursor()

    visibility_clause = "WHERE p.is_visible = TRUE" if visible_only else ""
    query = f"""
        SELECT 
            p.id, p.title, p.description, p.display_order, p.is_visible, p.created_at,
            (SELECT array_agg(category_slug) FROM project_categories WHERE project_id = p.id) as categories,
            (SELECT id FROM project_images WHERE project_id = p.id AND is_cover = TRUE LIMIT 1) as cover_image_id,
            (SELECT COUNT(*) FROM project_images WHERE project_id = p.id) as image_count
        FROM projects p
        {visibility_clause}
        ORDER BY p.display_order ASC, p.id ASC
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            'id':            r[0],
            'title':         r[1],
            'description':   r[2],
            'display_order': r[3],
            'is_visible':    r[4],
            'created_at':    r[5].strftime('%d %b %Y') if r[5] else None,
            'categories':    r[6] or [],
            'has_cover':     bool(r[7]),
            'cover_url':     f'/api/project/{r[0]}/cover' if r[7] else None,
            'image_count':   r[8]
        }
        for r in rows
    ]


def get_projects_by_category(category_slug: str,
                              visible_only: bool = True) -> list[dict]:
    """Return all projects that are linked to a given category slug."""
    conn = get_connection()
    cur  = conn.cursor()

    visibility_clause = "AND p.is_visible = TRUE" if visible_only else ""
    cur.execute(
        f"""
        SELECT 
            p.id, p.title, p.description, p.display_order, p.is_visible, p.created_at,
            (SELECT array_agg(category_slug) FROM project_categories WHERE project_id = p.id) as categories,
            (SELECT id FROM project_images WHERE project_id = p.id AND is_cover = TRUE LIMIT 1) as cover_image_id
        FROM projects p
        JOIN project_categories pc ON p.id = pc.project_id
        WHERE pc.category_slug = %s {visibility_clause}
        ORDER BY p.display_order ASC, p.id ASC
        """,
        (category_slug,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            'id':            r[0],
            'title':         r[1],
            'description':   r[2],
            'display_order': r[3],
            'is_visible':    r[4],
            'created_at':    r[5].strftime('%d %b %Y') if r[5] else None,
            'categories':    r[6] or [],
            'has_cover':     bool(r[7]),
            'cover_url':     f'/api/project/{r[0]}/cover' if r[7] else None,
        }
        for r in rows
    ]


def get_recent_projects(limit: int = 6) -> list[dict]:
    """Return the most recently added visible projects."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        SELECT 
            p.id, p.title, p.description, p.display_order, p.is_visible, p.created_at,
            (SELECT array_agg(category_slug) FROM project_categories WHERE project_id = p.id) as categories,
            (SELECT id FROM project_images WHERE project_id = p.id AND is_cover = TRUE LIMIT 1) as cover_image_id
        FROM projects p
        WHERE p.is_visible = TRUE
        ORDER BY p.created_at DESC
        LIMIT %s
        """,    
        (limit,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            'id':            r[0],
            'title':         r[1],
            'description':   r[2],
            'display_order': r[3],
            'is_visible':    r[4],
            'created_at':    r[5].strftime('%d %b %Y') if r[5] else None,
            'categories':    r[6] or [],
            'has_cover':     bool(r[7]),
            'cover_url':     f'/api/project/{r[0]}/cover' if r[7] else None,
        }
        for r in rows
    ]


def add_project(title: str, description: str = None,
                display_order: int = 0, is_visible: bool = True, categories: list[str] = None) -> int:
    """Insert a new project and link its categories. Returns the new row id."""
    if categories is None: categories = []
    
    conn = get_connection()
    cur  = conn.cursor()
    
    # Insert project
    cur.execute(
        """
        INSERT INTO projects (title, description, display_order, is_visible)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (title, description, display_order, is_visible)
    )
    new_id = cur.fetchone()[0]
    
    # Insert categories
    for slug in categories:
        cur.execute(
            "INSERT INTO project_categories (project_id, category_slug) VALUES (%s, %s)",
            (new_id, slug)
        )
        
    conn.commit()
    cur.close()
    conn.close()
    return new_id


def update_project(project_id: int, title: str, description: str = None, 
                   display_order: int = 0, is_visible: bool = True, categories: list[str] = None):
    """Update an existing project and its categories."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute(
        """
        UPDATE projects
        SET    title = %s, description = %s, display_order = %s, is_visible = %s, updated_at = NOW()
        WHERE  id = %s
        """,
        (title, description, display_order, is_visible, project_id)
    )
    
    if categories is not None:
        # Re-link categories
        cur.execute("DELETE FROM project_categories WHERE project_id = %s", (project_id,))
        for slug in categories:
            cur.execute(
                "INSERT INTO project_categories (project_id, category_slug) VALUES (%s, %s)",
                (project_id, slug)
            )

    conn.commit()
    cur.close()
    conn.close()


def delete_project(project_id: int):
    """Delete a project. ON DELETE CASCADE will handle project_images and project_categories."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("DELETE FROM projects WHERE id = %s", (project_id,))
    conn.commit()
    cur.close()
    conn.close()


def reorder_projects(ordered_ids: list[int]):
    """Update display_order for a list of project ids."""
    conn = get_connection()
    cur  = conn.cursor()
    for position, proj_id in enumerate(ordered_ids):
        cur.execute(
            "UPDATE projects SET display_order = %s WHERE id = %s",
            (position, proj_id)
        )
    conn.commit()
    cur.close()
    conn.close()


# ════════════════════════════════
# PROJECT IMAGES
# ════════════════════════════════

def get_project_cover_image(project_id: int) -> tuple[bytes | None, str]:
    """Return (image_bytes, mime_type) for the project's cover image."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "SELECT image_data, image_mime FROM project_images WHERE project_id = %s AND is_cover = TRUE LIMIT 1",
        (project_id,)
    )
    row = cur.fetchone()
    # Fallback to any image if no cover is set
    if not row:
        cur.execute(
            "SELECT image_data, image_mime FROM project_images WHERE project_id = %s ORDER BY display_order ASC LIMIT 1",
            (project_id,)
        )
        row = cur.fetchone()
        
    cur.close()
    conn.close()

    if not row or row[0] is None:
        return None, ''
    return bytes(row[0]), row[1] or 'image/jpeg'


def get_image_data(image_id: int) -> tuple[bytes | None, str]:
    """Return raw bytes for a specific image by ID."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("SELECT image_data, image_mime FROM project_images WHERE id = %s", (image_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row or row[0] is None:
        return None, ''
    return bytes(row[0]), row[1] or 'image/jpeg'


def get_project_images_meta(project_id: int) -> list[dict]:
    """Return metadata for all images of a project, used for sliders and dashboard grids."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "SELECT id, is_cover, display_order FROM project_images WHERE project_id = %s ORDER BY display_order ASC, id ASC",
        (project_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    return [
        {
            'id': r[0],
            'url': f'/api/images/{r[0]}',
            'is_cover': r[1],
            'display_order': r[2]
        }
        for r in rows
    ]


def add_project_image(project_id: int, image_data: bytes, image_mime: str, is_cover: bool = False):
    """Add an image to a project. If is_cover is True, unset others."""
    conn = get_connection()
    cur  = conn.cursor()
    
    if is_cover:
        cur.execute("UPDATE project_images SET is_cover = FALSE WHERE project_id = %s", (project_id,))
    else:
        # Make it cover if it's the first image
        cur.execute("SELECT COUNT(*) FROM project_images WHERE project_id = %s", (project_id,))
        if cur.fetchone()[0] == 0:
            is_cover = True
            
    # get max display_order
    cur.execute("SELECT COALESCE(MAX(display_order), -1) + 1 FROM project_images WHERE project_id = %s", (project_id,))
    next_order = cur.fetchone()[0]

    cur.execute(
        """
        INSERT INTO project_images (project_id, image_data, image_mime, is_cover, display_order)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (project_id, image_data, image_mime, is_cover, next_order)
    )
    conn.commit()
    cur.close()
    conn.close()


def set_cover_image(project_id: int, image_id: int):
    """Set the specified image as the cover image for the project."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("UPDATE project_images SET is_cover = FALSE WHERE project_id = %s", (project_id,))
    cur.execute("UPDATE project_images SET is_cover = TRUE WHERE id = %s AND project_id = %s", (image_id, project_id))
    conn.commit()
    cur.close()
    conn.close()


def delete_project_image(image_id: int):
    """Delete a specific image by ID."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("DELETE FROM project_images WHERE id = %s", (image_id,))
    conn.commit()
    cur.close()
    conn.close()


# ════════════════════════════════
# CONTACT INFO
# ════════════════════════════════

def get_contact_info() -> dict:
    """Return the single contact info row."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        SELECT phone, email, address, working_hours, maps_embed_url
        FROM   contact_info
        WHERE  id = 1
        """
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {}
    return {
        'phone':          row[0],
        'email':          row[1],
        'address':        row[2],
        'working_hours':  row[3],
        'maps_embed_url': row[4],
    }


def update_contact_info(phone: str = None, email: str = None,
                        address: str = None, working_hours: str = None,
                        maps_embed_url: str = None):
    """Upsert the single contact info row."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        INSERT INTO contact_info
            (id, phone, email, address, working_hours, maps_embed_url, updated_at)
        VALUES (1, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (id) DO UPDATE SET
            phone          = EXCLUDED.phone,
            email          = EXCLUDED.email,
            address        = EXCLUDED.address,
            working_hours  = EXCLUDED.working_hours,
            maps_embed_url = EXCLUDED.maps_embed_url,
            updated_at     = NOW()
        """,
        (phone, email, address, working_hours, maps_embed_url)
    )
    conn.commit()
    cur.close()
    conn.close()


# ════════════════════════════════
# CONTACT MESSAGES  (kept for future use)
# ════════════════════════════════

def save_contact_message(name: str, email: str,
                         message: str, phone: str = None):
    """Save a message submitted via the Contact page."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        INSERT INTO contact_messages (name, email, phone, message)
        VALUES (%s, %s, %s, %s)
        """,
        (name, email, phone, message)
    )
    conn.commit()
    cur.close()
    conn.close()
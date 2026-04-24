# ══════════════════════════════════════════
# NIDHI CREATION — database/modal.py
# All database read/write functions
# ══════════════════════════════════════════

import bcrypt
from core.config import get_connection

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
            (SELECT COUNT(*) FROM project_images WHERE project_id = p.id) as image_count,
            p.review_text, p.review_rating
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
            'cover_url':     f'/api/project/{r[0]}/cover?v={r[7]}' if r[7] else None,
            'image_count':   r[8],
            'review_text':   r[9],
            'review_rating': r[10]
        }
        for r in rows
    ]


def get_projects_with_reviews(limit: int = 7) -> list[dict]:
    """Return projects that have a review, in random order."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        f"""
        SELECT 
            p.id, p.title, p.description, p.display_order, p.is_visible, p.created_at,
            (SELECT array_agg(category_slug) FROM project_categories WHERE project_id = p.id) as categories,
            (SELECT id FROM project_images WHERE project_id = p.id AND is_cover = TRUE LIMIT 1) as cover_image_id,
            p.review_text, p.review_rating
        FROM projects p
        WHERE p.is_visible = TRUE AND p.review_text IS NOT NULL AND p.review_text != ''
        ORDER BY RANDOM()
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
            'cover_url':     f'/api/project/{r[0]}/cover?v={r[7]}' if r[7] else None,
            'review_text':   r[8],
            'review_rating': r[9]
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
            (SELECT id FROM project_images WHERE project_id = p.id AND is_cover = TRUE LIMIT 1) as cover_image_id,
            p.review_text, p.review_rating
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
            'cover_url':     f'/api/project/{r[0]}/cover?v={r[7]}' if r[7] else None,
            'review_text':   r[8],
            'review_rating': r[9]
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
            (SELECT id FROM project_images WHERE project_id = p.id AND is_cover = TRUE LIMIT 1) as cover_image_id,
            p.review_text, p.review_rating
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
            'cover_url':     f'/api/project/{r[0]}/cover?v={r[7]}' if r[7] else None,
            'review_text':   r[8],
            'review_rating': r[9]
        }
        for r in rows
    ]


def add_project(title: str, description: str = None,
                display_order: int = 0, is_visible: bool = True, categories: list[str] = None,
                review_text: str = None, review_rating: int = None) -> int:
    """Insert a new project and link its categories. Returns the new row id."""
    if categories is None: categories = []
    
    conn = get_connection()
    cur  = conn.cursor()
    
    # Insert project
    cur.execute(
        """
        INSERT INTO projects (title, description, display_order, is_visible, review_text, review_rating)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (title, description, display_order, is_visible, review_text, review_rating)
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
                   display_order: int = 0, is_visible: bool = True, categories: list[str] = None,
                   review_text: str = None, review_rating: int = None):
    """Update an existing project and its categories."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute(
        """
        UPDATE projects
        SET    title = %s, description = %s, display_order = %s, is_visible = %s,
               review_text = %s, review_rating = %s, updated_at = NOW()
        WHERE  id = %s
        """,
        (title, description, display_order, is_visible, review_text, review_rating, project_id)
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

def get_project_cover_image(project_id: int, size: str = 'original', fmt: str = None) -> tuple[bytes | None, str]:
    """
    Return (image_bytes, mime_type) for the project's cover image.
    Tries to find the requested size and format in variants first.
    """
    conn = get_connection()
    cur  = conn.cursor()
    
    # 1. Find the cover image ID
    cur.execute(
        "SELECT id FROM project_images WHERE project_id = %s AND is_cover = TRUE LIMIT 1",
        (project_id,)
    )
    row = cur.fetchone()
    if not row:
        # Fallback to first image
        cur.execute(
            "SELECT id FROM project_images WHERE project_id = %s ORDER BY display_order ASC LIMIT 1",
            (project_id,)
        )
        row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return None, ''
        
    image_id = row[0]
    cur.close()
    conn.close()
    
    return get_image_data(image_id, size, fmt)


def get_image_data(image_id: int, size: str = 'original', fmt: str = None) -> tuple[bytes | None, str]:
    """
    Return raw bytes for a specific image variant.
    If fmt is provided (e.g. 'avif'), it tries to find that. 
    Otherwise it looks for the requested size and returns the best format found.
    """
    conn = get_connection()
    cur  = conn.cursor()
    
    # If size is 'original' and no format is specified, we can return the master image
    if size == 'original' and not fmt:
        cur.execute("SELECT image_data, image_mime FROM project_images WHERE id = %s", (image_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row: return None, ''
        return bytes(row[0]), row[1]

    # Try to find specific variant
    query = "SELECT image_data, image_mime FROM project_image_variants WHERE image_id = %s AND size_label = %s"
    params = [image_id, size]
    
    if fmt:
        query += " AND format = %s"
        params.append(fmt.lower())
    else:
        # Prefer AVIF, then WebP, then JPEG
        query += " ORDER BY CASE format WHEN 'avif' THEN 1 WHEN 'webp' THEN 2 ELSE 3 END ASC"
    
    query += " LIMIT 1"
    
    cur.execute(query, tuple(params))
    row = cur.fetchone()
    
    if not row and size != 'original':
        # Fallback to original if requested size not found
        cur.close()
        conn.close()
        return get_image_data(image_id, 'original', fmt)
        
    if not row:
        # Final fallback to master image if no variants found at all
        cur.execute("SELECT image_data, image_mime FROM project_images WHERE id = %s", (image_id,))
        row = cur.fetchone()

    cur.close()
    conn.close()
    
    if not row: return None, ''
    return bytes(row[0]), row[1]


def get_project_images_meta(project_id: int) -> list[dict]:
    """Return metadata for all images of a project, used for sliders and dashboard grids."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute(
        "SELECT id, is_cover, display_order FROM project_images WHERE project_id = %s ORDER BY is_cover DESC, display_order ASC, id ASC",
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


def add_project_image(project_id: int, image_data: bytes, image_mime: str, is_cover: bool = False, variants: list[dict] = None):
    """Add an image to a project and its optimized variants."""
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
        RETURNING id
        """,
        (project_id, image_data, image_mime, is_cover, next_order)
    )
    new_id = cur.fetchone()[0]

    # Insert variants
    if variants:
        for v in variants:
            cur.execute(
                """
                INSERT INTO project_image_variants (image_id, size_label, format, image_data, image_mime, width, height)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (new_id, v['size'], v['format'], v['data'], v['mime'], v['width'], v['height'])
            )

    conn.commit()
    cur.close()
    conn.close()
    return new_id


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
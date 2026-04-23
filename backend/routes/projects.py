# ══════════════════════════════════════════
# NIDHI CREATION — routes/projects.py
# Admin project management + public image API
#
# GET    /api/project/<id>/cover       ← public cover image
# GET    /api/images/<id>              ← public single image
# GET    /api/project/<id>/images      ← public list of images for slider
# GET    /api/admin/projects           ← admin: list all
# POST   /api/admin/projects           ← admin: add
# PUT    /api/admin/projects/<id>      ← admin: edit
# DELETE /api/admin/projects/<id>      ← admin: delete
# POST   /api/admin/projects/reorder   ← admin: save new order
# POST   /api/admin/projects/<id>/images ← admin: add image
# DELETE /api/admin/images/<id>        ← admin: delete image
# POST   /api/admin/projects/<id>/cover  ← admin: set cover image
# ══════════════════════════════════════════

import json
from core.auth    import get_token_from_headers, validate_session
from database.modal import (
    get_all_projects, add_project, update_project,
    delete_project, reorder_projects, get_project_cover_image,
    get_project_images_meta, get_image_data, add_project_image,
    delete_project_image, set_cover_image, get_projects_with_reviews
)
from core.image_utils import process_image


def handle(method: str, path: str, body: dict, headers, respond):
    
    # GET /api/project-reviews (Public)
    if method == 'GET' and path == '/api/project-reviews':
        _list_reviews(respond)
        return

    # ── Public: serve project images ──────────

    # ── Public: serve project images ──────────
    # GET /api/project/<id>/cover
    if method == 'GET' and path.startswith('/api/project/') and path.endswith('/cover'):
        parts = path.split('/')
        if len(parts) >= 4:
            try:
                project_id = int(parts[3])
                _serve_cover(project_id, respond)
            except ValueError:
                respond(400, 'application/json', {'error': 'Invalid project id.'})
        else:
            respond(400, 'application/json', {'error': 'Invalid URL.'})
        return
        
    # GET /api/images/<id>
    if method == 'GET' and path.startswith('/api/images/'):
        try:
            image_id = _parse_id(path, '/api/images/')
            if image_id is not None:
                _serve_image(image_id, respond)
            else:
                respond(400, 'application/json', {'error': 'Invalid image id.'})
        except ValueError:
            respond(400, 'application/json', {'error': 'Invalid URL.'})
        return

    # GET /api/project/<id>/images
    if method == 'GET' and path.startswith('/api/project/') and path.endswith('/images'):
        parts = path.split('/')
        if len(parts) >= 4:
            try:
                project_id = int(parts[3])
                images = get_project_images_meta(project_id)
                respond(200, 'application/json', {'images': images})
            except ValueError:
                respond(400, 'application/json', {'error': 'Invalid project id.'})
        else:
            respond(400, 'application/json', {'error': 'Invalid URL.'})
        return

    # All other routes require admin auth
    if not path.startswith('/api/admin/'):
        return False

    if not path.startswith('/api/admin/projects') and not path.startswith('/api/admin/images/'):
        return False

    if not _is_admin(headers):
        respond(401, 'application/json', {'error': 'Unauthorised.'})
        return

    # GET /api/admin/projects
    if method == 'GET' and path == '/api/admin/projects':
        _list_projects(respond)

    # POST /api/admin/projects/reorder
    elif method == 'POST' and path == '/api/admin/projects/reorder':
        _reorder(body, respond)

    # POST /api/admin/projects/<id>/images
    elif method == 'POST' and path.startswith('/api/admin/projects/') and path.endswith('/images'):
        parts = path.split('/')
        if len(parts) >= 6:
            project_id = int(parts[4])
            _add_image(project_id, body, respond)
        else:
            respond(400, 'application/json', {'error': 'Invalid URL.'})

    # POST /api/admin/projects/<id>/cover
    elif method == 'POST' and path.startswith('/api/admin/projects/') and path.endswith('/cover'):
        parts = path.split('/')
        if len(parts) >= 6:
            project_id = int(parts[4])
            _set_cover(project_id, body, respond)
        else:
            respond(400, 'application/json', {'error': 'Invalid URL.'})

    # DELETE /api/admin/images/<id>
    elif method == 'DELETE' and path.startswith('/api/admin/images/'):
        image_id = _parse_id(path, '/api/admin/images/')
        if image_id is None:
            respond(400, 'application/json', {'error': 'Invalid image id.'})
            return
        _delete_image(image_id, respond)

    # POST /api/admin/projects
    elif method == 'POST' and path == '/api/admin/projects':
        _add(body, respond)

    # PUT /api/admin/projects/<id>
    elif method == 'PUT' and path.startswith('/api/admin/projects/'):
        project_id = _parse_id(path, '/api/admin/projects/')
        if project_id is None:
            respond(400, 'application/json', {'error': 'Invalid project id.'})
            return
        _edit(project_id, body, respond)

    # DELETE /api/admin/projects/<id>
    elif method == 'DELETE' and path.startswith('/api/admin/projects/'):
        project_id = _parse_id(path, '/api/admin/projects/')
        if project_id is None:
            respond(400, 'application/json', {'error': 'Invalid project id.'})
            return
        _delete(project_id, respond)

    else:
        respond(404, 'application/json', {'error': 'Route not found.'})


# ── Handlers ─────────────────────────────

def _serve_cover(project_id: int, respond):
    image_bytes, mime = get_project_cover_image(project_id)
    if image_bytes is None:
        respond(404, 'application/json', {'error': 'Image not found.'})
        return
    respond(200, mime, image_bytes, extra_headers={'Cache-Control': 'public, max-age=3600'})


def _serve_image(image_id: int, respond):
    image_bytes, mime = get_image_data(image_id)
    if image_bytes is None:
        respond(404, 'application/json', {'error': 'Image not found.'})
        return
    respond(200, mime, image_bytes, extra_headers={'Cache-Control': 'public, max-age=3600'})


def _list_projects(respond):
    try:
        projects = get_all_projects(visible_only=False)
        respond(200, 'application/json', {'projects': projects})
    except Exception as e:
        print(f'[projects] list error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch projects.'})


def _list_reviews(respond):
    try:
        projects = get_projects_with_reviews(limit=7)
        respond(200, 'application/json', {'projects': projects})
    except Exception as e:
        print(f'[projects] list reviews error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch reviews.'})


def _add(body: dict, respond):
    def _get_val(key, default=''):
        val = body.get(key, default)
        if isinstance(val, list) and len(val) > 0: return val[0]
        return val

    title         = _get_val('title').strip()
    categories_str= _get_val('categories').strip()
    description   = _get_val('description').strip() or None
    is_visible    = str(_get_val('is_visible', 'true')).lower() == 'true'
    display_order = int(_get_val('display_order', '0'))
    review_text   = _get_val('review_text').strip() or None
    raw_rating    = str(_get_val('review_rating', '')).strip()
    review_rating = int(raw_rating) if raw_rating and raw_rating.isdigit() else None
    
    categories = [c.strip() for c in categories_str.split(',') if c.strip()] if categories_str else []

    if not title:
        respond(400, 'application/json', {'error': 'Title is required.'})
        return

    try:
        new_id = add_project(
            title         = title,
            categories    = categories,
            description   = description,
            display_order = display_order,
            is_visible    = is_visible,
            review_text   = review_text,
            review_rating = review_rating
        )
        # Check if single or multiple images were uploaded
        image_idx = 0
        while True:
            img_key = f'image_data_{image_idx}' if image_idx > 0 else 'image_data'
            mime_key = f'image_mime_{image_idx}' if image_idx > 0 else 'image_mime'
            if img_key not in body:
                break
            image_data = body[img_key][0]
            image_mime = body.get(mime_key, ['image/jpeg'])[0]
            
            if image_data:
                # Limit raw upload size to 10MB to avoid memory issues
                if len(image_data) > 10 * 1024 * 1024:
                    print(f"[projects] image {img_key} too large: {len(image_data)} bytes")
                    continue

                # Process image (resize/compress)
                try:
                    processed_data, processed_mime = process_image(image_data)
                    add_project_image(new_id, processed_data, processed_mime, is_cover=(image_idx == 0))
                except Exception as img_err:
                    print(f"[projects] image processing error: {img_err}")
                    # Fallback to original if processing fails (or skip?)
                    add_project_image(new_id, image_data, image_mime, is_cover=(image_idx == 0))
            image_idx += 1

        respond(200, 'application/json', {'status': 'ok', 'id': new_id})
    except Exception as e:
        print(f'[projects] add error: {e}')
        respond(500, 'application/json', {'error': 'Could not add project.'})


def _edit(project_id: int, body: dict, respond):
    def _get_val(key, default=''):
        val = body.get(key, default)
        if isinstance(val, list) and len(val) > 0: return val[0]
        return val

    title         = _get_val('title').strip()
    categories_str= _get_val('categories').strip()
    description   = _get_val('description').strip() or None
    is_visible    = str(_get_val('is_visible', 'true')).lower() == 'true'
    display_order = int(_get_val('display_order', '0'))
    review_text   = _get_val('review_text').strip() or None
    raw_rating    = str(_get_val('review_rating', '')).strip()
    review_rating = int(raw_rating) if raw_rating and raw_rating.isdigit() else None
    
    categories = [c.strip() for c in categories_str.split(',') if c.strip()] if categories_str else []

    if not title:
        respond(400, 'application/json', {'error': 'Title is required.'})
        return

    try:
        update_project(
            project_id    = project_id,
            title         = title,
            categories    = categories,
            description   = description,
            display_order = display_order,
            is_visible    = is_visible,
            review_text   = review_text,
            review_rating = review_rating
        )
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[projects] edit error: {e}')
        respond(500, 'application/json', {'error': 'Could not update project.'})


def _delete(project_id: int, respond):
    try:
        delete_project(project_id)
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[projects] delete error: {e}')
        respond(500, 'application/json', {'error': 'Could not delete project.'})


def _reorder(body: dict, respond):
    raw = body.get('ids', [''])[0]
    try:
        ids = json.loads(raw)
        reorder_projects([int(i) for i in ids])
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[projects] reorder error: {e}')
        respond(400, 'application/json', {'error': 'Invalid reorder data.'})


def _add_image(project_id: int, body: dict, respond):
    image_data = body.get('image_data', [None])[0]
    image_mime = body.get('image_mime', ['image/jpeg'])[0]
    if not image_data:
        respond(400, 'application/json', {'error': 'No image provided.'})
        return
        
    if len(image_data) > 10 * 1024 * 1024:
        respond(400, 'application/json', {'error': 'Image is too large (max 10MB).'})
        return

    try:
        # Process image
        processed_data, processed_mime = process_image(image_data)
        new_id = add_project_image(project_id, processed_data, processed_mime)
        respond(200, 'application/json', {'status': 'ok', 'image_id': new_id})
    except Exception as e:
        print(f'[projects] add image error: {e}')
        # Fallback to original if processing fails
        try:
            new_id = add_project_image(project_id, image_data, image_mime)
            respond(200, 'application/json', {'status': 'ok', 'image_id': new_id})
        except Exception as e2:
            respond(500, 'application/json', {'error': 'Could not add image.'})
    except Exception as e:
        print(f'[projects] add image error: {e}')
        respond(500, 'application/json', {'error': 'Could not add image.'})


def _delete_image(image_id: int, respond):
    try:
        delete_project_image(image_id)
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[projects] delete image error: {e}')
        respond(500, 'application/json', {'error': 'Could not delete image.'})


def _set_cover(project_id: int, body: dict, respond):
    raw = body.get('image_id', [''])[0]
    try:
        image_id = int(json.loads(raw) if raw.startswith('"') else raw)
        set_cover_image(project_id, image_id)
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[projects] set cover error: {e}')
        respond(400, 'application/json', {'error': 'Invalid image ID.'})


# ── Helpers ──────────────────────────────

def _is_admin(headers) -> bool:
    token = get_token_from_headers(headers)
    return validate_session(token) is not None


def _parse_id(path: str, prefix: str) -> int | None:
    try:
        return int(path.replace(prefix, '').strip('/'))
    except ValueError:
        return None
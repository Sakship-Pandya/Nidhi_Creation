# ══════════════════════════════════════════
# NIDHI CREATION — routes/projects.py
# Admin project management + public image API
#
# GET    /api/project/<id>/image       ← public (used by <img> tags)
# GET    /api/admin/projects           ← admin: list all
# POST   /api/admin/projects           ← admin: add
# PUT    /api/admin/projects/<id>      ← admin: edit
# DELETE /api/admin/projects/<id>      ← admin: delete
# POST   /api/admin/projects/reorder   ← admin: save new order
# ══════════════════════════════════════════

import json
from core.auth    import get_token_from_headers, validate_session
from database.modal import (
    get_all_projects, add_project, update_project,
    delete_project, reorder_projects, get_project_image,
)


def handle(method: str, path: str, body: dict, headers, respond):

    # ── Public: serve project image ──────────
    # GET /api/project/<id>/image
    if method == 'GET' and path.startswith('/api/project/') and path.endswith('/image'):
        parts = path.split('/')
        if len(parts) >= 4:
            try:
                project_id = int(parts[3])
            except ValueError:
                respond(400, 'application/json', {'error': 'Invalid project id.'})
                return
            _serve_image(project_id, respond)
        else:
            respond(400, 'application/json', {'error': 'Invalid URL.'})
        return

    # All other routes require admin auth
    if not path.startswith('/api/admin/projects'):
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

def _serve_image(project_id: int, respond):
    image_bytes, mime = get_project_image(project_id)
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


def _add(body: dict, respond):
    title         = body.get('title',         [''])[0].strip()
    category_slug = body.get('category_slug', [''])[0].strip()
    description   = body.get('description',   [''])[0].strip() or None
    is_visible    = body.get('is_visible',     ['true'])[0].lower() == 'true'
    display_order = int(body.get('display_order', ['0'])[0])
    image_data    = body.get('image_data',    [None])[0]   # raw bytes passed from router
    image_mime    = body.get('image_mime',    ['image/jpeg'])[0]

    if not title or not category_slug:
        respond(400, 'application/json', {'error': 'Title and category are required.'})
        return

    try:
        new_id = add_project(
            title         = title,
            category_slug = category_slug,
            description   = description,
            image_data    = image_data,
            image_mime    = image_mime,
            display_order = display_order,
            is_visible    = is_visible,
        )
        respond(200, 'application/json', {'status': 'ok', 'id': new_id})
    except Exception as e:
        print(f'[projects] add error: {e}')
        respond(500, 'application/json', {'error': 'Could not add project.'})


def _edit(project_id: int, body: dict, respond):
    title         = body.get('title',         [''])[0].strip()
    category_slug = body.get('category_slug', [''])[0].strip()
    description   = body.get('description',   [''])[0].strip() or None
    is_visible    = body.get('is_visible',     ['true'])[0].lower() == 'true'
    display_order = int(body.get('display_order', ['0'])[0])
    image_data    = body.get('image_data',    [None])[0]
    image_mime    = body.get('image_mime',    ['image/jpeg'])[0]

    if not title or not category_slug:
        respond(400, 'application/json', {'error': 'Title and category are required.'})
        return

    try:
        update_project(
            project_id    = project_id,
            title         = title,
            category_slug = category_slug,
            description   = description,
            image_data    = image_data,
            image_mime    = image_mime,
            display_order = display_order,
            is_visible    = is_visible,
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


# ── Helpers ──────────────────────────────

def _is_admin(headers) -> bool:
    token = get_token_from_headers(headers)
    return validate_session(token) is not None


def _parse_id(path: str, prefix: str) -> int | None:
    try:
        return int(path.replace(prefix, '').strip('/'))
    except ValueError:
        return None
# ══════════════════════════════════════════
# NIDHI CREATION — routes/categories.py
# Public + admin category routes
#
# GET  /api/categories                 ← public: all visible categories
# GET  /api/category/<slug>            ← public: single category + its projects
# GET  /api/recent-projects            ← public: recent projects for home page
# GET  /api/admin/categories           ← admin: all categories (incl. hidden)
# POST /api/admin/categories           ← admin: add
# PUT  /api/admin/categories/<id>      ← admin: edit
# DELETE /api/admin/categories/<id>    ← admin: delete
# POST /api/admin/categories/reorder   ← admin: save new order
# ══════════════════════════════════════════

import json
from core.auth      import get_token_from_headers, validate_session
from database.modal import (
    get_all_categories, get_category_by_slug,
    get_projects_by_category, get_recent_projects,
    add_category, update_category,
    delete_category, reorder_categories,
)


def handle(method: str, path: str, body: dict, headers, respond):

    # ── Public routes ────────────────────
    if method == 'GET' and path == '/api/categories':
        _list_public(respond)
        return

    if method == 'GET' and path == '/api/recent-projects':
        _recent_projects(respond)
        return

    if method == 'GET' and path.startswith('/api/category/'):
        slug = path.split('/api/category/')[-1].strip('/')
        _get_single(slug, respond)
        return

    # ── Admin routes ─────────────────────
    if not path.startswith('/api/admin/categories'):
        return False

    if not _is_admin(headers):
        respond(401, 'application/json', {'error': 'Unauthorised.'})
        return

    if method == 'GET' and path == '/api/admin/categories':
        _list_admin(respond)

    elif method == 'POST' and path == '/api/admin/categories/reorder':
        _reorder(body, respond)

    elif method == 'POST' and path == '/api/admin/categories':
        _add(body, respond)

    elif method == 'PUT' and path.startswith('/api/admin/categories/'):
        cat_id = _parse_id(path, '/api/admin/categories/')
        if cat_id is None:
            respond(400, 'application/json', {'error': 'Invalid category id.'})
            return
        _edit(cat_id, body, respond)

    elif method == 'DELETE' and path.startswith('/api/admin/categories/'):
        cat_id = _parse_id(path, '/api/admin/categories/')
        if cat_id is None:
            respond(400, 'application/json', {'error': 'Invalid category id.'})
            return
        _delete(cat_id, respond)

    else:
        respond(404, 'application/json', {'error': 'Route not found.'})


# ── Handlers ─────────────────────────────

def _list_public(respond):
    try:
        categories = get_all_categories(visible_only=True)
        respond(200, 'application/json', {'categories': categories})
    except Exception as e:
        print(f'[categories] list error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch categories.'})


def _recent_projects(respond):
    try:
        projects = get_recent_projects(limit=6)
        respond(200, 'application/json', {'projects': projects})
    except Exception as e:
        print(f'[categories] recent projects error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch recent projects.'})


def _get_single(slug: str, respond):
    try:
        category = get_category_by_slug(slug)
        if not category:
            respond(404, 'application/json', {'error': f'Category "{slug}" not found.'})
            return
        projects = get_projects_by_category(slug, visible_only=True)
        respond(200, 'application/json', {'category': category, 'projects': projects})
    except Exception as e:
        print(f'[categories] get single error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch category.'})


def _list_admin(respond):
    try:
        categories = get_all_categories(visible_only=False)
        respond(200, 'application/json', {'categories': categories})
    except Exception as e:
        print(f'[categories] admin list error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch categories.'})


def _add(body: dict, respond):
    def _get_val(key, default=''):
        val = body.get(key, default)
        if isinstance(val, list) and len(val) > 0: return val[0]
        return val

    slug          = _get_val('slug').strip()
    name          = _get_val('name').strip()
    description   = _get_val('description').strip() or None
    display_order = int(_get_val('display_order', '0'))
    is_visible    = str(_get_val('is_visible', 'true')).lower() == 'true'

    if not slug or not name:
        respond(400, 'application/json', {'error': 'Slug and name are required.'})
        return

    try:
        new_id = add_category(slug, name, description, display_order, is_visible)
        respond(200, 'application/json', {'status': 'ok', 'id': new_id})
    except Exception as e:
        print(f'[categories] add error: {e}')
        if 'unique' in str(e).lower():
            respond(400, 'application/json', {'error': f'Slug "{slug}" already exists.'})
        else:
            respond(500, 'application/json', {'error': 'Could not add category.'})


def _edit(cat_id: int, body: dict, respond):
    def _get_val(key, default=''):
        val = body.get(key, default)
        if isinstance(val, list) and len(val) > 0: return val[0]
        return val

    slug          = _get_val('slug').strip()
    name          = _get_val('name').strip()
    description   = _get_val('description').strip() or None
    display_order = int(_get_val('display_order', '0'))
    is_visible    = str(_get_val('is_visible', 'true')).lower() == 'true'

    if not slug or not name:
        respond(400, 'application/json', {'error': 'Slug and name are required.'})
        return

    try:
        update_category(cat_id, slug, name, description, display_order, is_visible)
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[categories] edit error: {e}')
        respond(500, 'application/json', {'error': 'Could not update category.'})


def _delete(cat_id: int, respond):
    try:
        delete_category(cat_id)
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[categories] delete error: {e}')
        if 'foreign key' in str(e).lower():
            respond(400, 'application/json', {
                'error': 'Cannot delete — projects still exist in this category.'
            })
        else:
            respond(500, 'application/json', {'error': 'Could not delete category.'})


def _reorder(body: dict, respond):
    raw = body.get('ids', '')
    if isinstance(raw, list) and len(raw) > 0:
        raw = raw[0]
    try:
        ids = json.loads(raw)
        reorder_categories([int(i) for i in ids])
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[categories] reorder error: {e}')
        respond(400, 'application/json', {'error': 'Invalid reorder data.'})


# ── Helpers ──────────────────────────────

def _is_admin(headers) -> bool:
    token = get_token_from_headers(headers)
    is_valid = validate_session(token) is not None
    if not is_valid:
        print(f'[categories] admin check failed. token: {token[:8] if token else "None"}')
    else:
        print(f'[categories] admin check passed for token: {token[:8]}...')
    return is_valid


def _parse_id(path: str, prefix: str) -> int | None:
    try:
        return int(path.replace(prefix, '').strip('/'))
    except ValueError:
        return None
# ══════════════════════════════════════════
# NIDHI CREATION — routes/admin_visitors.py
# Admin visitor search
#
# GET /api/admin/visitors?name=<query>
# ══════════════════════════════════════════

from urllib.parse   import parse_qs, urlparse
from core.auth      import get_token_from_headers, validate_session
from database.modal import search_visitors_by_name


def handle(method: str, path: str, body: dict, headers, respond, raw_path: str = ''):
    # raw_path includes query string e.g. /api/admin/visitors?name=rahul
    if not raw_path.startswith('/api/admin/visitors'):
        return False

    if not _is_admin(headers):
        respond(401, 'application/json', {'error': 'Unauthorised.'})
        return

    if method != 'GET':
        respond(405, 'application/json', {'error': 'Method not allowed.'})
        return

    # Parse ?name= from query string
    parsed = urlparse(raw_path)
    params = parse_qs(parsed.query)
    name   = params.get('name', [''])[0].strip()

    if not name:
        respond(400, 'application/json', {'error': 'Query parameter "name" is required.'})
        return

    try:
        visitors = search_visitors_by_name(name)
        respond(200, 'application/json', {'visitors': visitors})
    except Exception as e:
        print(f'[admin_visitors] search error: {e}')
        respond(500, 'application/json', {'error': 'Could not search visitors.'})


# ── Helpers ──────────────────────────────

def _is_admin(headers) -> bool:
    token = get_token_from_headers(headers)
    return validate_session(token) is not None
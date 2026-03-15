# ══════════════════════════════════════════
# NIDHI CREATION — routes/contact.py
#
# GET  /api/contact                    ← public: fetch contact info
# GET  /api/admin/contact              ← admin: same but includes maps URL
# POST /api/admin/contact              ← admin: update contact info
# ══════════════════════════════════════════

from core.auth      import get_token_from_headers, validate_session
from database.modal import get_contact_info, update_contact_info


def handle(method: str, path: str, body: dict, headers, respond):

    # ── Public: get contact info ─────────
    if method == 'GET' and path == '/api/contact':
        _get_public(respond)
        return

    # ── Admin routes ─────────────────────
    if not path.startswith('/api/admin/contact'):
        return False

    if not _is_admin(headers):
        respond(401, 'application/json', {'error': 'Unauthorised.'})
        return

    if method == 'GET' and path == '/api/admin/contact':
        _get_admin(respond)

    elif method == 'POST' and path == '/api/admin/contact':
        _update(body, respond)

    else:
        respond(404, 'application/json', {'error': 'Route not found.'})


# ── Handlers ─────────────────────────────

def _get_public(respond):
    """Returns contact info without the maps embed URL for public use."""
    try:
        info = get_contact_info()
        # Don't expose maps_embed_url on the public API — it's injected server-side
        public_info = {k: v for k, v in info.items() if k != 'maps_embed_url'}
        respond(200, 'application/json', {'contact': public_info})
    except Exception as e:
        print(f'[contact] get public error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch contact info.'})


def _get_admin(respond):
    """Returns full contact info including maps embed URL."""
    try:
        info = get_contact_info()
        respond(200, 'application/json', {'contact': info})
    except Exception as e:
        print(f'[contact] get admin error: {e}')
        respond(500, 'application/json', {'error': 'Could not fetch contact info.'})


def _update(body: dict, respond):
    phone          = body.get('phone',          [''])[0].strip() or None
    email          = body.get('email',          [''])[0].strip() or None
    address        = body.get('address',        [''])[0].strip() or None
    working_hours  = body.get('working_hours',  [''])[0].strip() or None
    maps_embed_url = body.get('maps_embed_url', [''])[0].strip() or None

    try:
        update_contact_info(
            phone          = phone,
            email          = email,
            address        = address,
            working_hours  = working_hours,
            maps_embed_url = maps_embed_url,
        )
        respond(200, 'application/json', {'status': 'ok'})
    except Exception as e:
        print(f'[contact] update error: {e}')
        respond(500, 'application/json', {'error': 'Could not update contact info.'})


# ── Helpers ──────────────────────────────

def _is_admin(headers) -> bool:
    token = get_token_from_headers(headers)
    return validate_session(token) is not None
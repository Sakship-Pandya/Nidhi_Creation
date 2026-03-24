# ══════════════════════════════════════════
# NIDHI CREATION — routes/admin_auth.py
# Admin login / logout
# POST /api/admin/login
# POST /api/admin/logout
# ══════════════════════════════════════════

from database.modal import verify_admin_password
from core.auth      import (
    create_session, delete_session,
    get_token_from_headers, make_cookie, clear_cookie
)


def handle(method: str, path: str, body: dict, headers, respond):
    if path == '/api/admin/login' and method == 'POST':
        _login(body, respond)

    elif path == '/api/admin/logout' and method == 'POST':
        _logout(headers, respond)

    else:
        return False


def _login(body: dict, respond):
    username = body.get('username', [''])[0].strip()
    password = body.get('password', [''])[0]

    if not username or not password:
        respond(400, 'application/json', {'error': 'Username and password are required.'})
        return

    if not verify_admin_password(username, password):
        respond(401, 'application/json', {'error': 'Incorrect username or password.'})
        return

    token = create_session(username)
    respond(
        200,
        'application/json',
        {'status': 'ok', 'message': 'Login successful'},
        extra_headers={'Set-Cookie': make_cookie(token)}
    )


def _logout(headers, respond):
    token = get_token_from_headers(headers)
    if token:
        delete_session(token)
    respond(
        200,
        'application/json',
        {'status': 'ok'},
        extra_headers={'Set-Cookie': clear_cookie()}
    )
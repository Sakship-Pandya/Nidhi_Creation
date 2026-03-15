# ══════════════════════════════════════════
# NIDHI CREATION — routes/pages.py
# Serves all frontend HTML pages
# ══════════════════════════════════════════

import os
from core.auth import get_token_from_headers, validate_session

FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', '..', 'frontend'
)


def _redirect(respond, location: str):
    """Send a 302 redirect response."""
    respond(302, 'text/html', b'', extra_headers={'Location': location})


def handle(method: str, path: str, body: dict, headers, respond):
    if method != 'GET':
        respond(405, 'application/json', {'error': 'Method not allowed'})
        return

    # ── Session check ─────────────────────
    token        = get_token_from_headers(headers)
    is_admin     = validate_session(token) is not None

    # Already logged in admin trying to visit /admin/login → send to dashboard
    if path == '/admin/login' and is_admin:
        _redirect(respond, '/admin/dashboard')
        return

    # Unauthenticated user trying to visit /admin/dashboard → send to login
    if path == '/admin/dashboard' and not is_admin:
        _redirect(respond, '/admin/login')
        return

    # ── Page routing ───────────────────────
    routes = {
        '':                  'html/Login.html',
        '/':                 'html/Login.html',
        '/home':             'html/Home.html',
        '/contact':          'html/ContactUs.html',
        '/admin/login':      'html/AdminLogin.html',
        '/admin/dashboard':  'html/Admin.html',
    }

    html_file = routes.get(path)

    # Category pages — one HTML file handles all slugs
    if html_file is None and path.startswith('/category/'):
        html_file = 'html/Category.html'

    if html_file is None:
        return False   # signal: not handled here, try next handler

    filepath = os.path.join(FRONTEND_DIR, html_file)

    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        respond(200, 'text/html', content)
    except FileNotFoundError:
        respond(404, 'application/json', {'error': f'Page not found: {html_file}'})
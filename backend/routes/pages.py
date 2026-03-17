# ══════════════════════════════════════════
# NIDHI CREATION — routes/pages.py
# Serves the React app (dist/index.html) for
# all page routes. React Router handles client
# side navigation.
# ══════════════════════════════════════════

import os
from core.auth import get_token_from_headers, validate_session

# React build output directory
DIST_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', '..', 'frontend', 'react-app', 'dist'
)

# The single HTML shell served for every page route
INDEX_HTML = os.path.join(DIST_DIR, 'index.html')

# Routes that are considered page routes
PAGE_PATHS = {
    '', '/',
    '/home',
    '/contact',
    '/admin/login',
    '/admin/dashboard',
}


def _redirect(respond, location: str):
    respond(302, 'text/html', b'', extra_headers={'Location': location})


def handle(method: str, path: str, body: dict, headers, respond):
    if method != 'GET':
        respond(405, 'application/json', {'error': 'Method not allowed'})
        return

    # ── Session check for admin routes ────
    token    = get_token_from_headers(headers)
    is_admin = validate_session(token) is not None

    if path == '/admin/login' and is_admin:
        _redirect(respond, '/admin/dashboard')
        return

    if path == '/admin/dashboard' and not is_admin:
        _redirect(respond, '/admin/login')
        return

    # ── Determine if this is a page route ─
    is_page = (
        path in PAGE_PATHS or
        path.startswith('/category/')
    )

    if not is_page:
        return False   # not a page route — let other handlers try

    # ── Serve React index.html ─────────────
    try:
        with open(INDEX_HTML, 'rb') as f:
            content = f.read()
        respond(200, 'text/html', content)
    except FileNotFoundError:
        respond(503, 'application/json', {
            'error': 'Frontend not built. Run: cd frontend/react-app && npm run build'
        })
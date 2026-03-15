# ══════════════════════════════════════════
# NIDHI CREATION — routes/static.py
# Serves frontend static files (CSS, JS, favicon)
# ══════════════════════════════════════════

import os

FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', '..', 'frontend'
)

MIME_TYPES = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.ico':  'image/x-icon',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg':  'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
}


def handle(method: str, path: str, body: dict, headers, respond):
    # Only handle /css/, /js/, /favicon.ico
    if not (path.startswith('/css/') or
            path.startswith('/js/')  or
            path == '/favicon.ico'):
        return False   # not handled here

    if method != 'GET':
        respond(405, 'application/json', {'error': 'Method not allowed'})
        return

    filepath = os.path.join(FRONTEND_DIR, path.lstrip('/'))
    ext      = os.path.splitext(filepath)[1].lower()
    mime     = MIME_TYPES.get(ext, 'application/octet-stream')

    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        respond(200, mime, content)
    except FileNotFoundError:
        respond(404, 'application/json', {'error': f'Static file not found: {path}'})
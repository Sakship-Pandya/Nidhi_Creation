# ══════════════════════════════════════════
# NIDHI CREATION — routes/static.py
# Serves static files from React dist/assets/
# and legacy /css/ /js/ paths
# ══════════════════════════════════════════

import os

DIST_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', '..', 'frontend', 'react-app', 'dist'
)

MIME_TYPES = {
    '.html':  'text/html',
    '.css':   'text/css',
    '.js':    'application/javascript',
    '.jsx':   'application/javascript',
    '.mjs':   'application/javascript',
    '.json':  'application/json',
    '.ico':   'image/x-icon',
    '.png':   'image/png',
    '.jpg':   'image/jpeg',
    '.jpeg':  'image/jpeg',
    '.svg':   'image/svg+xml',
    '.woff':  'font/woff',
    '.woff2': 'font/woff2',
    '.ttf':   'font/ttf',
    '.map':   'application/json',
}


def handle(method: str, path: str, body: dict, headers, respond):
    # Serve React build assets (/assets/...) and favicon
    if not (path.startswith('/assets/') or path == '/favicon.ico'):
        return False   # not handled here

    if method != 'GET':
        respond(405, 'application/json', {'error': 'Method not allowed'})
        return

    filepath = os.path.join(DIST_DIR, path.lstrip('/'))
    ext      = os.path.splitext(filepath)[1].lower()
    mime     = MIME_TYPES.get(ext, 'application/octet-stream')

    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        # Cache assets aggressively — Vite hashes filenames
        respond(200, mime, content, extra_headers={
            'Cache-Control': 'public, max-age=31536000, immutable'
        })
    except FileNotFoundError:
        respond(404, 'application/json', {'error': f'Static file not found: {path}'})
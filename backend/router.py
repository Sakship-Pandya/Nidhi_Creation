# ══════════════════════════════════════════
# NIDHI CREATION — router.py
# Dispatches incoming requests to the
# correct route handler.
# ══════════════════════════════════════════

import os
import mimetypes
from pathlib import Path

from routes import (
    static,
    admin_auth,
    projects,
    categories,
    contact,
)

# Path to React build folder
BUILD_DIR = Path(__file__).parent.parent / 'build'


from urllib.parse import parse_qs, urlparse

def dispatch(method: str, raw_path: str, body: dict, headers, respond):
    """
    Try each route handler in order.
    Each handler returns False if it doesn't own the path,
    or handles the request (calls respond) and returns None.
    """
    parsed_url = urlparse(raw_path)
    path = parsed_url.path.rstrip('/')
    query_params = parse_qs(parsed_url.query)
    
    # Simplify query_params: {'size': ['small']} -> {'size': 'small'}
    params = {k: v[0] for k, v in query_params.items()}

    handlers = [
        lambda: admin_auth.handle(method, path, body, headers, respond),
        lambda: projects.handle(method, path, body, headers, respond, params=params),
        lambda: categories.handle(method, path, body, headers, respond),
        lambda: contact.handle(method, path, body, headers, respond),
        lambda: static.handle(method, path, body, headers, respond),

        # ===== SERVE REACT APP (only if build folder exists) =====
        lambda: serve_react(path, respond) if os.path.exists(BUILD_DIR) else False,
    ]

    for handler in handlers:
        result = handler()
        if result is not False:
            return   # handler took ownership

    # Nothing matched — in development mode, show helpful message
    respond(404, 'application/json', {
        'error': f'Route not found: {method} {path}'
    })


def serve_react(path: str, respond):
    """
    Serve React build files. For any route that's not a file,
    serve index.html (for React Router to handle).
    """
    # Root path → serve index.html
    if path == '' or path == '/':
        file_path = BUILD_DIR / 'index.html'
    else:
        file_path = BUILD_DIR / path.lstrip('/')
    
    # If file doesn't exist or is a directory, serve index.html
    # (This allows React Router to handle the route)
    if not file_path.exists() or file_path.is_dir():
        file_path = BUILD_DIR / 'index.html'
    
    # Read and serve the file
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Determine content type
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if mime_type is None:
            mime_type = 'application/octet-stream'
        
        respond(200, mime_type, content)
        return None  # Indicate we handled the request
    
    except Exception as e:
        respond(500, 'text/html', f'<h1>500 Error</h1><p>{str(e)}</p>')
        return None
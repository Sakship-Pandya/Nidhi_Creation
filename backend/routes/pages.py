# ══════════════════════════════════════════
# NIDHI CREATION — routes/pages.py
# Serves all frontend HTML pages
# ══════════════════════════════════════════

import os

FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', '..', 'frontend'
)


def handle(method: str, path: str, body: dict, headers, respond):
    """
    respond(status, content_type, data, extra_headers)
    data can be bytes or str.
    """
    if method != 'GET':
        respond(405, 'application/json', {'error': 'Method not allowed'})
        return

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
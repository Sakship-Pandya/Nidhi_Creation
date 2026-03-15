# ══════════════════════════════════════════
# NIDHI CREATION — backend/server.py
# Pure Python HTTP server, no framework
# Run: python server.py
# ══════════════════════════════════════════

import json
import os
import sys
from http.server    import BaseHTTPRequestHandler, HTTPServer
from urllib.parse   import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.modal import (
    add_visitor,
    verify_admin_password,
    get_all_categories,
    get_category_by_slug,
    get_projects_by_category,
    get_recent_projects,
    get_project_image,
    save_contact_message,
)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')

MIME = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.ico':  'image/x-icon',
}


class Handler(BaseHTTPRequestHandler):

    # ──────────────────────────────────────
    # GET ROUTES
    # ──────────────────────────────────────
    def do_GET(self):
        parsed = urlparse(self.path)
        path   = parsed.path.rstrip('/')

        # ── Pages ──────────────────────────
        if path in ('', '/'):
            self.serve_html('html/Home.html')

        elif path == '/login':
            self.serve_html('html/Login.html')

        elif path == '/admin/login':
            self.serve_html('html/AdminLogin.html')

        elif path == '/contact':
            self.serve_html('html/ContactUs.html')

        elif path.startswith('/category/'):
            # One HTML file handles all categories
            # JS reads slug from URL and calls /api/category/<slug>
            self.serve_html('html/Category.html')

        # ── API: project image ─────────────
        # GET /api/project/<id>/image
        # Returns the raw image bytes stored in the DB
        # JS uses this as:  <img src="/api/project/proj_001/image">
        elif path.startswith('/api/project/') and path.endswith('/image'):
            # extract project id from  /api/project/<id>/image
            parts      = path.split('/')
            project_id = parts[3] if len(parts) >= 5 else None
            self.api_project_image(project_id)

        # ── API: category data ─────────────
        elif path.startswith('/api/category/'):
            slug = path.split('/api/category/')[-1].strip('/')
            self.api_category(slug)

        # ── API: all categories ────────────
        elif path == '/api/categories':
            self.api_all_categories()

        # ── API: recent projects ───────────
        elif path == '/api/recent-projects':
            self.api_recent_projects()

        # ── Static files (css, js) ─────────
        elif path.startswith('/css/') or path.startswith('/js/'):
            self.serve_static(path)

        else:
            self.send_error_json(404, 'Not found')


    # ──────────────────────────────────────
    # POST ROUTES
    # ──────────────────────────────────────
    def do_POST(self):
        parsed = urlparse(self.path)
        path   = parsed.path.rstrip('/')
        body   = self.read_body()

        # ── POST /login ────────────────────
        if path == '/login':
            name     = body.get('name',     [''])[0].strip()
            phone    = body.get('phone',    [''])[0].strip()
            business = body.get('business', [''])[0].strip()

            if not name or not phone or not business:
                self.send_error_json(400, 'All fields are required.')
                return

            add_visitor(name, phone, business)
            self.send_json({'status': 'ok', 'message': 'Login successful'})

        # ── POST /admin/login ──────────────
        elif path == '/admin/login':
            username = body.get('username', [''])[0].strip()
            password = body.get('password', [''])[0]

            if not username or not password:
                self.send_error_json(400, 'Username and password are required.')
                return

            if verify_admin_password(username, password):
                self.send_json({'status': 'ok', 'message': 'Admin login successful'})
            else:
                self.send_error_json(401, 'Incorrect username or password.')

        # ── POST /contact ──────────────────
        elif path == '/contact':
            name    = body.get('name',    [''])[0].strip()
            email   = body.get('email',   [''])[0].strip()
            phone   = body.get('phone',   [''])[0].strip() or None
            message = body.get('message', [''])[0].strip()

            if not name or not email or not message:
                self.send_error_json(400, 'Name, email and message are required.')
                return

            save_contact_message(name, email, message, phone)
            self.send_json({'status': 'ok', 'message': 'Message received'})

        else:
            self.send_error_json(404, 'Route not found')


    # ──────────────────────────────────────
    # API HANDLERS
    # ──────────────────────────────────────

    def api_project_image(self, project_id):
        """
        GET /api/project/<id>/image
        Fetches image_data bytes from DB and sends them directly.
        The browser receives this exactly like a normal image file.
        JS sets:  <img src="/api/project/proj_001/image">
        """
        if not project_id:
            self.send_error_json(400, 'Missing project ID.')
            return

        image_bytes, mime_type = get_project_image(project_id)

        if image_bytes is None:
            self.send_error_json(404, f'Image not found for project "{project_id}".')
            return

        self.send_response(200)
        self.send_header('Content-Type',   mime_type)
        self.send_header('Content-Length', str(len(image_bytes)))
        # Cache image for 1 hour in the browser — images don't change often
        self.send_header('Cache-Control',  'public, max-age=3600')
        self.end_headers()
        self.wfile.write(image_bytes)

    def api_category(self, slug):
        """
        GET /api/category/<slug>
        Called by Category.js — returns category info + project list.
        image_url in each project points to /api/project/<id>/image
        """
        category_row = get_category_by_slug(slug)
        if not category_row:
            self.send_error_json(404, f'Category "{slug}" not found.')
            return

        projects = get_projects_by_category(slug)
        self.send_json({
            'category': {
                'slug':        category_row[0],
                'name':        category_row[1],
                'description': category_row[2],
            },
            'projects': projects
        })

    def api_all_categories(self):
        """
        GET /api/categories
        Returns all categories for navbar dropdown.
        """
        rows       = get_all_categories()
        categories = [
            {'slug': r[0], 'name': r[1], 'description': r[2]}
            for r in rows
        ]
        self.send_json({'categories': categories})

    def api_recent_projects(self):
        """
        GET /api/recent-projects
        Returns 6 most recent projects for Home.html Past Works section.
        """
        projects = get_recent_projects(limit=6)
        self.send_json({'projects': projects})


    # ──────────────────────────────────────
    # HELPERS
    # ──────────────────────────────────────

    def serve_html(self, relative_path):
        filepath = os.path.join(FRONTEND_DIR, relative_path)
        self.serve_file(filepath, 'text/html')

    def serve_static(self, url_path):
        filepath = os.path.join(FRONTEND_DIR, url_path.lstrip('/'))
        ext      = os.path.splitext(filepath)[1].lower()
        mime     = MIME.get(ext, 'application/octet-stream')
        self.serve_file(filepath, mime)

    def serve_file(self, filepath, content_type):
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type',   content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error_json(404, f'File not found: {filepath}')

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        raw    = self.rfile.read(length).decode('utf-8')
        return parse_qs(raw)

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type',   'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, status, message):
        self.send_json({'status': 'error', 'message': message}, status=status)

    def log_message(self, format, *args):
        print(f'  {self.command} {self.path}  ->  {args[1]}')


# ══════════════════════════════════════════
# START
# ══════════════════════════════════════════
if __name__ == '__main__':
    PORT   = int(os.getenv('PORT', 8000))
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f'\n  Nidhi Creation server running')
    print(f'  http://localhost:{PORT}\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
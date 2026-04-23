# ══════════════════════════════════════════
# NIDHI CREATION — server.py
# Entry point. Starts the HTTP server.
# Run: python server.py
# ══════════════════════════════════════════

import json
import os
import sys
from http.server  import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from router import dispatch


class Handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self._handle('GET')

    def do_POST(self):
        self._handle('POST')

    def do_PUT(self):
        self._handle('PUT')

    def do_DELETE(self):
        self._handle('DELETE')

    def _handle(self, method: str):
        body = self._read_body()
        dispatch(method, self.path, body, self.headers, self._respond)

    def _read_body(self) -> dict:
        content_type   = self.headers.get('Content-Type', '')
        content_length = int(self.headers.get('Content-Length', 0))

        if content_length == 0:
            return {}

        raw = self.rfile.read(content_length)

        # ✅ JSON
        if 'application/json' in content_type:
            try:
                return json.loads(raw.decode('utf-8'))
            except Exception:
                return {}

        # ✅ Multipart
        if 'multipart/form-data' in content_type:
            boundary = content_type.split('boundary=')[-1].encode()
            return _parse_multipart(raw, boundary)

        # ✅ URL encoded
        try:
            return parse_qs(raw.decode('utf-8'))
        except Exception:
            return {}

    def _respond(self, status: int, content_type: str, data,
             extra_headers: dict = None):

        if isinstance(data, (dict, list)):
            body = json.dumps(data).encode('utf-8')
        elif isinstance(data, bytes):
            body = data
        else:
            body = str(data).encode('utf-8')

        # ✅ FIRST send status
        self.send_response(status)

        # ✅ THEN headers
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        
        # Prevent API caching by default, unless overridden by extra_headers
        if 'application/json' in content_type:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')

        if extra_headers:
            for key, value in extra_headers.items():
                self.send_header(key, value)

        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:5173')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else '?'
        print(f'  {self.command:<8} {self.path:<45}  {status}')


# ── Multipart parser ─────────────────────
def _parse_multipart(raw: bytes, boundary: bytes) -> dict:
    """
    Minimal multipart/form-data parser.
    Returns a dict where each field is a list.
    File fields have bytes values; text fields have str values.
    Also stores image_mime for the first file field found.
    """
    result     = {}
    delimiter  = b'--' + boundary
    parts      = raw.split(delimiter)

    for part in parts[1:]:           # skip preamble
        if part in (b'', b'--\r\n', b'--'):
            continue

        # Split headers from body
        if b'\r\n\r\n' in part:
            headers_raw, body = part.split(b'\r\n\r\n', 1)
        else:
            continue

        body = body.rstrip(b'\r\n--')

        headers_text = headers_raw.decode('utf-8', errors='ignore')
        name         = None
        is_file      = False
        mime         = 'application/octet-stream'

        for line in headers_text.splitlines():
            if 'Content-Disposition' in line:
                for token in line.split(';'):
                    token = token.strip()
                    if token.startswith('name='):
                        name = token.split('=', 1)[1].strip('"')
                    if token.startswith('filename='):
                        is_file = True
            if 'Content-Type' in line:
                mime = line.split(':', 1)[1].strip()

        if name is None:
            continue

        if is_file:
            result[name]        = [body]
            result['image_mime'] = [mime]
        else:
            result[name] = [body.decode('utf-8', errors='ignore')]

    return result


# ══════════════════════════════════════════
# START
# ══════════════════════════════════════════
if __name__ == '__main__':
    PORT   = int(os.getenv('PORT', 8000))
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f'\n  Nidhi Creation server running')
    print(f'  http://localhost:{PORT}\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
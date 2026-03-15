# ══════════════════════════════════════════
# NIDHI CREATION — routes/visitors.py
# Public visitor login — POST /login
# ══════════════════════════════════════════

from database.modal import add_visitor


def handle(method: str, path: str, body: dict, headers, respond):
    if path != '/login':
        return False

    if method != 'POST':
        respond(405, 'application/json', {'error': 'Method not allowed'})
        return

    name     = body.get('name',     [''])[0].strip()
    phone    = body.get('phone',    [''])[0].strip()
    business = body.get('business', [''])[0].strip() or None

    if not name or not phone:
        respond(400, 'application/json', {'error': 'Name and phone are required.'})
        return

    try:
        add_visitor(name, phone, business)
        respond(200, 'application/json', {'status': 'ok', 'message': 'Login successful'})
    except Exception as e:
        print(f'[visitors] DB error: {e}')
        respond(500, 'application/json', {'error': 'Could not save visitor.'})
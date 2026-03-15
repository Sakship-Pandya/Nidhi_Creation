# ══════════════════════════════════════════
# NIDHI CREATION — router.py
# Dispatches incoming requests to the
# correct route handler.
# ══════════════════════════════════════════

from routes import (
    pages,
    static,
    visitors,
    admin_auth,
    projects,
    categories,
    contact,
    admin_visitors,
)


def dispatch(method: str, raw_path: str, body: dict, headers, respond):
    """
    Try each route handler in order.
    Each handler returns False if it doesn't own the path,
    or handles the request (calls respond) and returns None.
    """
    # Strip query string for path matching
    path = raw_path.split('?')[0].rstrip('/')

    handlers = [
        # admin_visitors needs raw_path for query string
        lambda: admin_visitors.handle(method, path, body, headers, respond, raw_path),

        lambda: admin_auth.handle(method, path, body, headers, respond),
        lambda: visitors.handle(method, path, body, headers, respond),
        lambda: projects.handle(method, path, body, headers, respond),
        lambda: categories.handle(method, path, body, headers, respond),
        lambda: contact.handle(method, path, body, headers, respond),
        lambda: static.handle(method, path, body, headers, respond),

        # Pages last — acts as fallback for HTML routes
        lambda: pages.handle(method, path, body, headers, respond),
    ]

    for handler in handlers:
        result = handler()
        if result is not False:
            return   # handler took ownership

    # Nothing matched
    respond(404, 'application/json', {'error': f'Route not found: {method} {path}'})
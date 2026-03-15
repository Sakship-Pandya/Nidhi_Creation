# ══════════════════════════════════════════
# NIDHI CREATION — core/auth.py
# Simple in-memory session token management
# ══════════════════════════════════════════

import secrets
import time

# { token: { 'username': str, 'expires_at': float } }
_sessions: dict = {}

SESSION_DURATION = 60 * 60 * 8   # 8 hours in seconds
COOKIE_NAME      = 'nc_admin_session'


def create_session(username: str) -> str:
    """Generate a secure token and store it. Returns the token."""
    token = secrets.token_hex(32)
    _sessions[token] = {
        'username':   username,
        'expires_at': time.time() + SESSION_DURATION,
    }
    return token


def validate_session(token: str | None) -> str | None:
    """
    Return the username if the token is valid and not expired.
    Returns None if invalid or expired.
    """
    if not token:
        return None

    session = _sessions.get(token)
    if not session:
        return None

    if time.time() > session['expires_at']:
        del _sessions[token]
        return None

    return session['username']


def delete_session(token: str):
    """Remove a session (logout)."""
    _sessions.pop(token, None)


def get_token_from_headers(headers) -> str | None:
    """Parse the session token out of the Cookie header."""
    cookie_header = headers.get('Cookie', '')
    for part in cookie_header.split(';'):
        part = part.strip()
        if part.startswith(f'{COOKIE_NAME}='):
            return part[len(f'{COOKIE_NAME}='):]
    return None


def make_cookie(token: str) -> str:
    """Build the Set-Cookie header value for login."""
    return (
        f'{COOKIE_NAME}={token}; '
        f'HttpOnly; Path=/; Max-Age={SESSION_DURATION}; SameSite=Strict'
    )


def clear_cookie() -> str:
    """Build the Set-Cookie header value for logout (expires immediately)."""
    return f'{COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
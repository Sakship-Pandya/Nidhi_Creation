import secrets
import time
import json
import os

# { token: { 'username': str, 'expires_at': float } }
_sessions: dict = {}

SESSION_DURATION = 60 * 60 * 2   # 2 hours in seconds
COOKIE_NAME      = 'nc_admin_session'
SESSIONS_FILE    = 'sessions.json'

def _load_sessions():
    global _sessions
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, 'r') as f:
                _sessions = json.load(f)
        except:
            _sessions = {}

def _save_sessions():
    try:
        with open(SESSIONS_FILE, 'w') as f:
            json.dump(_sessions, f)
    except:
        pass

# Initial load
_load_sessions()


def create_session(username: str) -> str:
    """Generate a secure token and store it. Returns the token."""
    token = secrets.token_hex(32)
    _sessions[token] = {
        'username':   username,
        'expires_at': time.time() + SESSION_DURATION,
    }
    _save_sessions()
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
        print(f'[auth] session not found for token: {token[:8]}...')
        return None

    if time.time() > session['expires_at']:
        print(f'[auth] session expired for token: {token[:8]}...')
        del _sessions[token]
        _save_sessions()
        return None

    print(f'[auth] session valid for user: {session["username"]}')
    return session['username']


def delete_session(token: str):
    """Remove a session (logout)."""
    _sessions.pop(token, None)
    _save_sessions()





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
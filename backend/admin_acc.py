# ══════════════════════════════════════════
# NIDHI CREATION — database/seed_admin.py
# Run once to create the admin account:
#   python -m database.seed_admin
# ══════════════════════════════════════════

from database.modal import create_admin

USERNAME = "admin"
PASSWORD = "NidhiAdmin@3110"   # ← change this before running

if __name__ == '__main__':
    create_admin(USERNAME, PASSWORD)
    print(f"✓ Admin account created — username: '{USERNAME}'")
    print("  Remember to change the password in this file before running.")
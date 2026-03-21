# import bcrypt
# hashed = bcrypt.hashpw("your_password".encode(), bcrypt.gensalt()).decode()
# print(hashed)

# $2b$12$gCvRcn1piUCzo.ufdUFLUes6hzsppPCB9vbo15F7gfLrMnHroXan2

# from core.config import get_connection

# conn = get_connection()
# cur = conn.cursor()
# cur.execute("SELECT username FROM admins")
# print(cur.fetchall())
# conn.close()

# import bcrypt
# from core.config import get_connection

# conn = get_connection()
# cur = conn.cursor()
# cur.execute("SELECT password_hash FROM admins WHERE username = 'admin'")
# row = cur.fetchone()
# conn.close()

# stored_hash = row[0]
# print("Hash from DB:", stored_hash)

# password_to_test = "sakshi123"  # whatever password you set
# result = bcrypt.checkpw(password_to_test.encode(), stored_hash.encode())
# print("Password match:", result)

# import bcrypt
# from core.config import get_connection

# password = "sakshi1234"  # set whatever password you want
# hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
# print("Generated hash:", hashed)

# conn = get_connection()
# cur = conn.cursor()
# cur.execute("UPDATE admins SET password_hash = %s WHERE username = 'admin'", (hashed,))
# conn.commit()
# cur.close()
# conn.close()
# print("Password updated!")

import bcrypt
from core.config import get_connection

conn = get_connection()
cur = conn.cursor()
cur.execute("SELECT password_hash FROM admins WHERE username = 'admin'")
row = cur.fetchone()
conn.close()

stored_hash = row[0]
print("Hash length:", len(stored_hash))
print("Hash:", repr(stored_hash))  # repr will show hidden characters

password = "sakshi1234"
print("Password:", repr(password))

result = bcrypt.checkpw(password.encode(), stored_hash.encode())
print("Match:", result)

# import bcrypt
# from core.config import get_connection

# password = "sakshi1234"
# hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# conn = get_connection()
# cur = conn.cursor()

# cur.execute("UPDATE admins SET password_hash = %s WHERE username = 'admin'", (hashed,))
# conn.commit()

# # immediately read it back
# cur.execute("SELECT password_hash FROM admins WHERE username = 'admin'")
# row = cur.fetchone()
# stored = row[0]

# print("Hashed:  ", repr(hashed))
# print("Stored:  ", repr(stored))
# print("Same?    ", hashed == stored)
# print("Match?   ", bcrypt.checkpw(password.encode(), stored.encode()))

# cur.close()
# conn.close()
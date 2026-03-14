from config import get_connection


def add_visitor(name, phone):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO visitors (name, phone) VALUES (%s,%s)",
        (name, phone)
    )
    conn.commit()
    cursor.close()
    conn.close()
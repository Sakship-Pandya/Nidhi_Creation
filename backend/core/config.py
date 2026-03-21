import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    conn = psycopg2.connect(DATABASE_URL)
    sslmode="require"
    return conn

# if __name__ == "__main__":
#     conn = get_connection()
#     print("Connected successfully!")
#     conn.close()
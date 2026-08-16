import sqlite3

conn = sqlite3.connect('storesync.db')
print("Connected to StoreSync database")

cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cursor.fetchall())

conn.close()

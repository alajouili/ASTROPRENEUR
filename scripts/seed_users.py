# scripts/seed_users.py
import asyncio
from app.core.security import get_password_hash

# This simulates inserting into the database
def get_seed_data():
    return [
        {"email": "recruiter@demo.com", "password": "password123", "role": "recruiter"},
        {"email": "admin@demo.com", "password": "password123", "role": "hr_admin"},
        {"email": "employee@demo.com", "password": "password123", "role": "employee"},
    ]

async def seed():
    print("Seeding users...")
    for user in get_seed_data():
        hashed = get_password_hash(user["password"])
        print(f"Role: {user['role']} | Email: {user['email']} | Hashed: {hashed[:20]}...")
    print("Done.")

if __name__ == "__main__":
    asyncio.run(seed())
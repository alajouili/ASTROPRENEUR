# app/core/blacklist.py
# In a real app, use Redis. For the hackathon, an in-memory set is fine.
REVOKED_TOKENS = set()

def revoke_token(token: str):
    REVOKED_TOKENS.add(token)

def is_token_revoked(token: str) -> bool:
    return token in REVOKED_TOKENS
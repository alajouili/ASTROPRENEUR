# guard.py
# THIS IS A STUB FOR H1. Member 1 can code against this signature.
# Member 2 will replace the inside of these functions with the real logic at H4.
def scan(text: str) -> bool:
    """
    Scans a chunk of text for prompt injection.
    Returns True if malicious, False if safe.
    """
    # TODO: Implement actual prompt injection scanning (Task 6)
    print(f"[STUB] Scanning text: {text[:30]}...")
    return False 

def create_proposal(action_type: str, payload: dict) -> str:
    """
    Creates a proposal in the database for human approval.
    Returns the proposal ID.
    """
    # TODO: Implement actual database insertion (Task 8)
    print(f"[STUB] Creating proposal for {action_type}")
    return "mock-proposal-id-123"


import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from app.github import push_file_data, pull_file_data

def verify(data: bytes, passphrase: str) -> bool:
    """Verify that the passphrase can successfully decrypt the data."""
    salt = data[:16]           # First 16 bytes = salt
    encrypted = data[16:]      # The rest = actual encrypted data
    key = base64.urlsafe_b64encode(
        hashlib.pbkdf2_hmac("sha256", passphrase.encode(), salt, 100_000, dklen=32)
    )
    f = Fernet(key)

    try:
        f.decrypt(encrypted)  # Will raise InvalidToken if passphrase is wrong
        return True
    except InvalidToken:
        return False
    
async def verify_passphrase(passphrase: str) -> bool:
    retrieved_b64 = pull_file_data("passphrase")
    retrieved_data = base64.b64decode(retrieved_b64)
    return verify(retrieved_data, passphrase)
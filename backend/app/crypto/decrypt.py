import base64
import hashlib
from cryptography.fernet import Fernet

def decrypt_data(data: bytes, passphrase: str) -> bytes:
    """Decrypt data using a passphrase."""
    salt = data[:16]           # First 16 bytes = salt
    encrypted = data[16:]      # The rest = actual encrypted data
    key = base64.urlsafe_b64encode(
        hashlib.pbkdf2_hmac("sha256", passphrase.encode(), salt, 100_000, dklen=32)
    )
    f = Fernet(key)
    return f.decrypt(encrypted)

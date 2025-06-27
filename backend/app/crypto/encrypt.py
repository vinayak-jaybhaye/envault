import os
from cryptography.fernet import Fernet
import base64
import hashlib

def encrypt_data(data: bytes, passphrase: str) -> bytes:
    """Encrypt data using a passphrase."""
    salt = os.urandom(16)  # 16 random bytes
    key = base64.urlsafe_b64encode(
        hashlib.pbkdf2_hmac("sha256", passphrase.encode(), salt, 100_000, dklen=32)
    )
    f = Fernet(key)
    encrypted = f.encrypt(data)
    return salt + encrypted  # ➕ Prefix the salt

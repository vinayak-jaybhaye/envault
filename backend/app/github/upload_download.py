import base64
from app.github.github import pull_file_data, push_file_data
from app.crypto import encrypt_data, decrypt_data


# Accepts a project name, passphrase, and raw data (bytes)
def encrypt_upload(project_name, passphrase, raw_data) -> bool:
    encrypted_data = encrypt_data(raw_data, passphrase)
    encrypted_b64 = base64.b64encode(encrypted_data).decode("utf-8")
    push_file_data(encrypted_b64, project_name)
    return True

# Accepts a project name and passphrase
def decrypt_download(project_name, passphrase) -> bytes:     
    retrieved_b64 = pull_file_data(project_name)
    retrieved_data = base64.b64decode(retrieved_b64)
    decrypted_data = decrypt_data(retrieved_data, passphrase)
    return decrypted_data
    
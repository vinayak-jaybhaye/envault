import base64
from app.crypto import encrypt_data, decrypt_data
from app.github import push_file_data, pull_file_data, list_files_in_dir

def decrypt_and_encrypt_data(data: bytes, old_passphrase: str, new_passphrase: str) -> bytes:
    """Decrypt with old passphrase, encrypt with new passphrase."""
    decrypted_data = decrypt_data(data, old_passphrase)
    return encrypt_data(decrypted_data, new_passphrase)


def re_encrypt_all_files(old_passphrase: str, new_passphrase: str) -> None:
    """Re-encrypt all files in 'encrypted_files' directory, all-or-nothing approach."""
    files = list_files_in_dir("encrypted_files")
    updated_files = {}

    # 🥇 STEP 1: Decrypt and re-encrypt in memory
    for file in files:
        file_data_b64 = pull_file_data(file)
        encrypted_data = base64.b64decode(file_data_b64)

        try:
            new_encrypted_data = decrypt_and_encrypt_data(encrypted_data, old_passphrase, new_passphrase)
            updated_files[file] = base64.b64encode(new_encrypted_data).decode("utf-8")
        except Exception as e:
            # If any error occurs, abort the process
            raise RuntimeError(f"Error re-encrypting {file}: {e}")

    # ✅ STEP 2: Push all updated files only if all succeeded
    for file_name, encrypted_data_b64 in updated_files.items():
        push_file_data(encrypted_data_b64, file_name)
        print(f"✅ Re-encrypted and pushed {file_name}")

    print("🎉 All files have been re-encrypted successfully.")

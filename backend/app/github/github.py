import os
from github import Github
from app.config import settings
import pprint
from app.crypto import encrypt_data
import base64

GH_TOKEN = settings.GH_TOKEN
GH_REPO = settings.GH_REPO

g = Github(GH_TOKEN)

def get_repo():
    """Get the configured repo. If it doesn't exist, create it."""
    try:
        return g.get_repo(GH_REPO)
    except Exception:
        print(f"Repository {GH_REPO} not found.")

def get_passphrase_file() -> str | None:
    """Fetch the passphrase file from the repo, if it exists."""
    try:
        decrypted_data = pull_file_data("passphrase")
        print("passphrase.env.enc file found.")
        return decrypted_data
    except Exception:
        print("No passphrase.env.enc found in the repo.")
        return None

def create_passphrase_file(passphrase: str) -> bool:
    """Create an encrypted passphrase file in the repo.
    Returns:
        bool: True if created successfully, False otherwise.
    """
    sample_content = "This is a sample passphrase file."
    encrypted_data = encrypt_data(sample_content.encode("utf-8"), passphrase)
    encrypted_b64 = base64.b64encode(encrypted_data).decode("utf-8")

    try:
        push_file_data(encrypted_b64, "passphrase")
        print("Created passphrase.env.enc in the repo.")
        return True
    except Exception as e:
        print(f"Failed to create passphrase.env.enc: {e}")
        return False


def passphrase_exists() -> bool:
    """Check if the passphrase file exists in the repo."""
    return get_passphrase_file() is not None

def push_file_data(data: str, project_name: str):
    """Push a Base64-encoded string data to the GitHub repo."""
    repo = get_repo()
    path_in_repo = f"encrypted_files/{project_name}.env.enc"

    try:
        contents = repo.get_contents(path_in_repo)
        repo.update_file(
            contents.path,
            f"Update {project_name}.env.enc",
            data,
            contents.sha
        )
        print(f"Updated {project_name}.env.enc.")
    except Exception as e:
        repo.create_file(
            path_in_repo,
            f"Add {project_name}.env.enc",
            data
        )
        print(f"Created {project_name}.env.enc.")


def delete_file(project_name: str) -> bool:
    """Delete an encrypted .env file from the GitHub repo."""
    repo = get_repo()
    path_in_repo = f"encrypted_files/{project_name}.env.enc"

    try:
        # Get the contents
        contents = repo.get_contents(path_in_repo)

        # Delete the file
        repo.delete_file(
            contents.path,
            f"Delete {project_name}.env.enc",
            contents.sha
        )
        print(f"Deleted {project_name}.env.enc from the repository.")
        return True
    except Exception as e:
        print(f"Failed to delete {project_name}.env.enc: {e}")
        return False


def pull_file_data(project_name: str) -> str | None:
    """Pull a Base64-encoded string data from the GitHub repo."""
    repo = get_repo()
    path_in_repo = f"encrypted_files/{project_name}.env.enc"
    
    try:
        contents = repo.get_contents(path_in_repo)
        print(f"Retrieved {project_name}.env.enc.")
        return contents.decoded_content.decode("utf-8")
    except Exception as e:
        print(f"No {project_name}.env.enc found in the repo.")
        return None
    
def list_projects_in_dir(directory: str) -> list:
    """List all file names in a specific directory of the GitHub repo."""
    repo = get_repo()
    try:
        contents = repo.get_contents(directory)
    except Exception as e:
        print(f"Error accessing directory {directory}: {e}")
        return []
    
    projects = []
    # pprint.pprint(contents[0].__dict__)
    passphrase = {}
    for item in contents:
        if item.type == "file" and item.name.endswith('.env.enc'):
            name = item.name.split('.env')[0] 
            url = "https://github.com/" + GH_REPO.split('/')[0] + '/' + name
            project = { "name": name, "url": url, "size" : item.size }
            if name == "passphrase":
                passphrase = project
            else:
                projects.append(project)
    if passphrase:
        projects.insert(0, passphrase)  # Insert passphrase at the top of the list
    return projects

def list_files_in_dir(directory: str = "encrypted_files") -> list:
    """List all file names in a specific directory of the GitHub repo."""
    repo = get_repo()
    contents = repo.get_contents(directory)
    filenames = []
    for item in contents:
        if item.type == "file" and item.name.endswith('.env.enc'):
            filenames.append(item.name.split('.env')[0])
            
    return filenames

def project_exists(project_name: str) -> bool:
    """Check if a project (i.e., .env file) exists in the GitHub repo."""
    filenames = list_files_in_dir()
    return project_name in filenames
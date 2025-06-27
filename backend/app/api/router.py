from fastapi import APIRouter, File, Form, UploadFile, Response, Depends, status
from fastapi.responses import JSONResponse
from fastapi import HTTPException

from app.crypto import encrypt_data, decrypt_data, verify_passphrase, re_encrypt_all_files
import base64
from app.github import push_file_data,project_exists, pull_file_data, list_projects_in_dir, delete_file,passphrase_exists, create_passphrase_file
from app.config import settings
from app.auth.auth import verify_access_token
from pydantic import BaseModel

class UploadDataRequest(BaseModel):
    passphrase: str
    project_name: str
    data: str
    update: bool = False  

class DownloadFileRequest(BaseModel):
    passphrase: str
    project_name: str

router = APIRouter()

@router.post("/upload")
async def upload_env_file(
    is_valid: bool = Depends(verify_access_token), 
                          passphrase: str = Form(...), project_name: str = Form(...), file: UploadFile = File(...)):
    """Upload, encrypt, and save .env file to the GitHub repo (in-memory)."""
    try:
        isvalid = await verify_passphrase(passphrase)
        if not isvalid:
            return JSONResponse({"error": "Invalid passphrase"}, status_code=401)

        if project_name == "" or project_name == "passphrase":
            return JSONResponse({"error": "Project name cannot be empty"}, status_code=400)
        if project_exists(project_name):
            return JSONResponse({"error": "Project already exists"}, status_code=400)

        data = await file.read()

        # Encrypt in-memory
        encrypted_data = encrypt_data(data, passphrase)

        # Push encrypted data to GitHub
        encrypted_b64 = base64.b64encode(encrypted_data).decode("utf-8")
        push_file_data(encrypted_b64, project_name)

        return {"status": "ok", "project_name": project_name}
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse({"error": "Failed to upload file"}, status_code=500)

@router.post("/upload-data")
async def upload_data(payload: UploadDataRequest, token_valid: bool = Depends(verify_access_token)):
    """Upload plain text data, encrypt, and save it to the GitHub repo."""
    try:
        is_valid = await verify_passphrase(payload.passphrase)
        if not is_valid:
            return JSONResponse({"error": "Invalid passphrase"}, status_code=401)

        if payload.project_name == "" or payload.data == "" or payload.project_name == "passphrase" :
            return JSONResponse({"error": "Project name and data cannot be empty"}, status_code=400)
        
        if (not payload.update) and project_exists(payload.project_name):
            return JSONResponse({"error": "Project already exists"}, status_code=400)
        
        # Get raw data
        raw_data = payload.data.encode("utf-8")

        # Encrypt in-memory
        encrypted_data = encrypt_data(raw_data, payload.passphrase)

        # Push encrypted data to GitHub
        encrypted_b64 = base64.b64encode(encrypted_data).decode("utf-8")
        push_file_data(encrypted_b64, payload.project_name)

        return {"status": "ok", "project_name": payload.project_name}
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse({"error": "Failed to upload data"}, status_code=500)


@router.post("/download")
async def download_env_file(is_valid: bool = Depends(verify_access_token) ,passphrase: str = Form(...), project_name: str = Form(...)):
    """Download, decrypt, and return the .env file."""
    isvalid = await verify_passphrase(passphrase)
    if not isvalid:
        return JSONResponse({"error": "Invalid passphrase"}, status_code=401)
    try:
        # contents = repo.get_contents(path_in_repo)
        retrieved_b64 = pull_file_data(project_name)
        retrieved_data = base64.b64decode(retrieved_b64)
        decrypted_data = decrypt_data(retrieved_data, passphrase)

        # Return as downloadable file
        return Response(
            decrypted_data,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={project_name}.env"},
        )
    except Exception as e:
        print(f"Error: {e}")
        return {"error": "File not found"}
    
@router.post("/download-data")
async def download_data(is_valid: bool = Depends(verify_access_token), passphrase: str = Form(...), project_name: str = Form(...)):
    """Download, decrypt, and return the .env data (instead of a file)."""
    is_valid = await verify_passphrase(passphrase)
    if not is_valid:
        return JSONResponse({"error": "Invalid passphrase"}, status_code=401)

    try:
        retrieved_b64 = pull_file_data(project_name)
        retrieved_data = base64.b64decode(retrieved_b64)
        decrypted_data = decrypt_data(retrieved_data, passphrase)

        # ✅ Return the decrypted data directly
        return JSONResponse({
            "status": "ok",
            "project_name": project_name,
            "data": decrypted_data.decode("utf-8")  # making sure it's a string
        })

    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse({"error": "File not found or decryption failed"}, status_code=404)

    

@router.delete("/delete")
async def delete_env_file(
    project_name: str = Form(...),
    is_valid: bool = Depends(verify_access_token),
    passphrase: str = Form(...)
):
    """Delete an encrypted .env file from the GitHub repo if authorized."""
    if not is_valid:
        return JSONResponse({"error": "Unauthorized"}, status_code=status.HTTP_401_UNAUTHORIZED)

    isvalidPassphrase = await verify_passphrase(passphrase)
    if not isvalidPassphrase:
        return JSONResponse({"error": "Invalid passphrase"}, status_code=401)

    deleted = delete_file(project_name)

    if deleted:
        return JSONResponse({"status": "ok", "project_name": project_name})
    else:
        return JSONResponse({"error": "File not found or delete failed"}, status_code=status.HTTP_404_NOT_FOUND)



@router.get("/projects")
async def get_all_projects(is_valid: bool = Depends(verify_access_token)):
    """List all projects (i.e., .env files) in the GitHub repo."""
    return list_projects_in_dir("encrypted_files")


from fastapi import Form
from fastapi.responses import JSONResponse
from app.auth.auth import create_access_token


@router.post("/login")
async def login(password: str = Form(...)):
    """Login and set an access token as an HttpOnly cookie."""
    if password == settings.PASSWORD:
        access_token = create_access_token({"sub": "user"})
        response = JSONResponse({"status": "ok"})
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,           # True in production
            samesite="lax",
            max_age=900            # 15 minutes
        )
        return response
    return {"error": "Invalid password"}


@router.post("/logout")
def logout(is_valid: bool = Depends(verify_access_token)):
    """Logout by clearing the access_token cookie."""
    response = JSONResponse({"status": "logged out"})
    response.delete_cookie("access_token")  # Removes the cookie
    return response


@router.post("/create-passphrase")
async def create_passphrase(is_valid: bool = Depends(verify_access_token),passphrase: str = Form(...)):
    """Create a passphrase for encrypting/decrypting .env files."""
    if not passphrase:
        return JSONResponse({"error": "Passphrase cannot be empty"}, status_code=400)
    if passphrase_exists():
        return JSONResponse({"error": "Passphrase already exists"}, status_code=400)
    
    return create_passphrase_file(passphrase)

@router.get("/passphrase-exists")
async def check_passphrase_exists(is_valid: bool = Depends(verify_access_token)):
    """Check if a passphrase file exists."""
    exists = passphrase_exists()
    return {"exists": exists}



@router.post("/update-passphrase")
async def update_passphrase(token_valid: bool = Depends(verify_access_token) ,old_passphrase: str = Form(...), new_passphrase: str = Form(...)):
    """Update the passphrase for all files."""
    # ✅ 1. Verify the old passphrase
    print(f"Old passphrase: {old_passphrase}, New passphrase: {new_passphrase}")
    is_valid = await verify_passphrase(old_passphrase)
    if not is_valid:
        return JSONResponse({"error": "Invalid old passphrase"}, status_code=401)

    re_encrypt_all_files(old_passphrase, new_passphrase)
    
    return JSONResponse({"status": "ok", "message": "All files re-encrypted successfully."})


@router.get("/me")
async def get_me(token_valid: bool = Depends(verify_access_token)):
    if token_valid:
        return {"isAuthenticated": True}
    raise HTTPException(status_code=401, detail="Not authenticated")


@router.post("/verify-passphrase")
async def verify_passphrase_endpoint(token_valid: bool = Depends(verify_access_token), passphrase: str = Form(...)):
    """Verify the provided passphrase."""
    is_valid = await verify_passphrase(passphrase)
    if is_valid:
        return JSONResponse({"status": "ok", "message": "Passphrase is valid."})
    else:
        return JSONResponse({"error": "Invalid passphrase"}, status_code=401)
    
@router.post("/verify-project")
async def verify_project_endpoint(token_valid: bool = Depends(verify_access_token), passphrase: str = Form(...) ,project_name: str = Form(...)):
    """Verify if a project exists and the passphrase is valid."""
    is_valid = await verify_passphrase(passphrase)
    if not is_valid:
        return JSONResponse({"error": "Invalid passphrase"}, status_code=401)

    if project_exists(project_name):
        return JSONResponse({"error": "Project already exist"}, status_code=404)

    return JSONResponse({"status": "ok", "message": "Project exists and passphrase is valid."})

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "EnvVault API is running."}



## cli routes

@router.post("/cli-upload")
async def upload_env_file(passphrase: str = Form(...), project_name: str = Form(...), file: UploadFile = File(...)):
    """Upload, encrypt, and save .env file to the GitHub repo (in-memory)."""
    try:
        isvalid = await verify_passphrase(passphrase)
        if not isvalid:
            return JSONResponse({"error": "Invalid passphrase"}, status_code=401)

        if project_name == "" or project_name == "passphrase":
            return JSONResponse({"error": "Project name cannot be empty"}, status_code=400)

        data = await file.read()

        # Encrypt in-memory
        encrypted_data = encrypt_data(data, passphrase)

        # Push encrypted data to GitHub
        encrypted_b64 = base64.b64encode(encrypted_data).decode("utf-8")
        push_file_data(encrypted_b64, project_name)

        return {"status": "ok", "project_name": project_name}
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse({"error": "Failed to upload file"}, status_code=500)
    

@router.post("/cli-download")
async def download_env_file(payload: DownloadFileRequest):
    """Download, decrypt, and return the .env file."""
    isvalid = await verify_passphrase(payload.passphrase)
    if not isvalid:
        return JSONResponse({"error": "Invalid passphrase"}, status_code=401)
    try:
        # contents = repo.get_contents(path_in_repo)
        retrieved_b64 = pull_file_data(payload.project_name)
        retrieved_data = base64.b64decode(retrieved_b64)
        decrypted_data = decrypt_data(retrieved_data, payload.passphrase)

        # Return as downloadable file
        return Response(
            decrypted_data,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={payload.project_name}.env"},
        )
    except Exception as e:
        print(f"Error: {e}")
        return {"error": "File not found"}
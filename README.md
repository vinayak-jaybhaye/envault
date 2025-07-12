
# Envault — Encrypted .env File Vault

Envault is a secure, full-stack platform for storing, managing, and editing your `.env` configuration files using **end-to-end encryption** and **GitHub** as a secure cloud backend.

Built with:

- ✅ FastAPI (Python backend)
- ✅ React  (Frontend + Monaco Editor)
- ✅ GitHub (File storage)
- ✅ AES256 encryption via Fernet
- ✅ JWT-based access tokens
- ✅ Custom CLI tool (`envault`)
---

## Features

- **Encrypt `.env` files** using a strong passphrase
- **Upload/download/edit** files securely from any device
- **No raw `.env` file is ever stored in plaintext**
- Version-controlled by **GitHub repo**
- **CLI** for terminal users
- **Web interface** with secure Monaco editor
- **JWT-based login + HttpOnly cookies**
- **Change passphrase** securely (with rollback safety)
- **Delete files**, rename projects, or update seamlessly

---

## Folder Structure

```
envault/
├── backend/               # FastAPI server
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── github/        # GitHub push/pull functions
│   │   ├── crypto/        # Encryption utils
│   │   └── config.py      # Pydantic-based env loader
│   └── main.py
├── frontend/              # React + Tailwind + CodeMirror
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── utils/
├── cli/                   # CLI tool (optional: PyInstaller)
│   └── envault.py
├── .env                   # Secrets like GH_TOKEN, PASSWORD
└── README.md
```

---
## Running Envault with Docker Compose

### Prerequisites

- Install [Docker](https://docs.docker.com/get-docker/)
- Install [Docker Compose](https://docs.docker.com/compose/install/) (Docker Desktop includes it)

### Steps

1. **Copy the example environment file**

   The project includes a `.env.sample` file in the root directory. Create your own `.env` file by copying it:

   ```bash
   cp .env.sample .env
   ```

2. **Edit .env**

    Open the `.env` file you created and fill in your secrets


3. **Build and start the containers**

    Run this command in the root folder to build images and start the containers:

    ```bash
    docker compose up --build
    ```

4. **Access the services**
    - Backend API (Fastapi) : http://localhost:8000
    - Frontend UI (React) : http://localhost:3000

5. **Stop the Containers**
    ```bash
    docker compose down 
    ```
---

## Running EnVault without Docker Compose
## Backend Setup

### 1. Environment Variables (`.env`)

```env
GH_TOKEN=your_github_token
GH_REPO=username/repo
PASSWORD=your_admin_password
SECRET_KEY=your_jwt_secret
```

### 2. Install Requirements

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run Server

```bash
uvicorn app.main:app --reload
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## End-to-End Encryption

- Fernet (AES-256) is used to **encrypt files before uploading**
- A unique 16-byte salt is prepended to each file
- Only the passphrase can decrypt the file (even repo owner can’t read without it)

---

## Key APIs

| Endpoint             | Method | Description                            |
|----------------------|--------|----------------------------------------|
| `/create-passphrase` | POST   | Initialize vault with a passphrase     |
| `/upload`            | POST   | Upload `.env` file (encrypted)         |
| `/download`          | POST   | Download `.env` file (decrypted)       |
| `/download-data`     | POST   | Get decrypted file data (JSON)         |
| `/delete`            | DELETE | Delete a project `.env` file           |
| `/login`             | POST   | Authenticate with admin password       |
| `/logout`            | POST   | Clear cookie & logout                  |
| `/update-passphrase` | POST   | Re-encrypt all files with new pass     |

---
## TODOs / Improvements

- Password strength validator
- GitHub commit history per file
- File rename feature
- Rate-limiting & security hardening

---

## Author

[**Vinayak Jaybhaye**](https://github.com/vinayak-jaybhaye)

Made with ❤️ to never lose `.env` files again.

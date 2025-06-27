from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EnvVault API", root_path="/")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(router)

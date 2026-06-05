from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.system import get_system_metrics

app = FastAPI(title="Homelab Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/system")
def read_system_metrics():
    return get_system_metrics()

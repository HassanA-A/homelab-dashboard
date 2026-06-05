from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.docker import router as docker_router
from routers.ollama import router as ollama_router
from routers.services import router as services_router
from services.system import (
    get_cpu_metrics,
    get_gpu_metrics,
    get_network_metrics,
    get_ram_metrics,
    get_storage_metrics,
    get_system_info,
    get_system_metrics,
    get_tailscale_metrics,
)

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

app.include_router(docker_router)
app.include_router(ollama_router)
app.include_router(services_router)


@app.get("/api/system")
def read_system_metrics():
    return get_system_metrics()


@app.get("/api/system/cpu")
def read_cpu_metrics():
    return get_cpu_metrics()


@app.get("/api/system/ram")
def read_ram_metrics():
    return get_ram_metrics()


@app.get("/api/system/gpu")
def read_gpu_metrics():
    return get_gpu_metrics()


@app.get("/api/system/storage")
def read_storage_metrics():
    return get_storage_metrics()


@app.get("/api/system/network")
def read_network_metrics():
    return get_network_metrics()


@app.get("/api/system/tailscale")
def read_tailscale_metrics():
    return get_tailscale_metrics()


@app.get("/api/system/info")
def read_system_info():
    return get_system_info()

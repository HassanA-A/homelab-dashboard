import json
import socket
import subprocess
from typing import Any

import docker
import requests
from docker.errors import DockerException, NotFound
from fastapi import HTTPException


def _docker_client():
    try:
        return docker.from_env()
    except DockerException as exc:
        raise HTTPException(status_code=503, detail=f"Docker is unavailable: {exc}") from exc


def _run_command(command: list[str]) -> str:
    try:
        result = subprocess.run(command, capture_output=True, check=True, text=True, timeout=5)
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return ""
    return result.stdout.strip()


def _tailscale_ip() -> str:
    output = _run_command(["tailscale", "status", "--json"])
    if not output:
        return ""

    try:
        status = json.loads(output)
    except json.JSONDecodeError:
        return ""

    self_info = status.get("Self") or {}
    tailscale_ips = self_info.get("TailscaleIPs") or []
    return tailscale_ips[0] if tailscale_ips else ""


def _local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("1.1.1.1", 80))
            return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def _access_host() -> str:
    return _tailscale_ip() or _local_ip()


def _container_status(container_name: str) -> str:
    try:
        container = _docker_client().containers.get(container_name)
    except NotFound:
        return "missing"
    except HTTPException:
        return "unknown"
    except DockerException:
        return "unknown"

    return "healthy" if container.status == "running" else container.status


def _ollama_status() -> tuple[str, int]:
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=3)
        response.raise_for_status()
    except requests.RequestException:
        return "offline", 0

    data = response.json()
    return "running", len(data.get("models") or [])


def list_services() -> dict[str, list[dict[str, Any]]]:
    host = _access_host()
    ollama_status, model_count = _ollama_status()

    return {
        "services": [
            {
                "id": "open-webui",
                "name": "Open WebUI",
                "status": _container_status("open-webui"),
                "url": f"http://{host}:3000",
                "container_name": "open-webui",
                "port": 3000,
                "kind": "container",
                "actions": ["open", "restart", "logs"],
            },
            {
                "id": "ollama",
                "name": "Ollama",
                "status": ollama_status,
                "url": f"http://{host}:11434",
                "port": 11434,
                "kind": "api",
                "models_count": model_count,
                "actions": ["open", "refresh"],
            },
            {
                "id": "dashboard-backend",
                "name": "Homelab Dashboard Backend",
                "status": "running",
                "url": f"http://{host}:8000",
                "port": 8000,
                "kind": "api",
                "actions": ["open"],
            },
        ]
    }


def restart_open_webui() -> dict[str, str]:
    try:
        container = _docker_client().containers.get("open-webui")
        container.restart()
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="open-webui container not found") from exc
    except DockerException as exc:
        raise HTTPException(status_code=503, detail=f"Unable to restart open-webui: {exc}") from exc

    return {"message": "Restarted open-webui"}


def get_open_webui_logs() -> dict[str, list[str]]:
    try:
        container = _docker_client().containers.get("open-webui")
        logs = container.logs(tail=200, timestamps=False).decode("utf-8", errors="replace")
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="open-webui container not found") from exc
    except DockerException as exc:
        raise HTTPException(status_code=503, detail=f"Unable to read open-webui logs: {exc}") from exc

    return {"logs": logs.splitlines()}

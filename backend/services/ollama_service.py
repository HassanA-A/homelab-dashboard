import subprocess
from typing import Any

import requests
from fastapi import HTTPException

OLLAMA_BASE_URL = "http://localhost:11434"


def _format_size(size_bytes: int) -> str:
    gb = size_bytes / 1024 / 1024 / 1024
    if gb >= 1:
        return f"{gb:.1f} GB"
    mb = size_bytes / 1024 / 1024
    return f"{mb:.0f} MB"


def _ollama_get(path: str) -> dict[str, Any]:
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}{path}", timeout=5)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=503, detail=f"Ollama is unavailable: {exc}") from exc

    return response.json()


def _ollama_post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    try:
        response = requests.post(f"{OLLAMA_BASE_URL}{path}", json=payload, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=503, detail=f"Ollama request failed: {exc}") from exc

    return response.json()


def _show_model(model_name: str) -> dict[str, Any]:
    try:
        return _ollama_post("/api/show", {"model": model_name})
    except HTTPException:
        return {}


def _context_length(model_info: dict[str, Any]) -> int:
    for key, value in model_info.items():
        if key.endswith(".context_length") and isinstance(value, int):
            return value
    return 0


def _normalize_model(model: dict[str, Any]) -> dict[str, Any]:
    name = model.get("name") or model.get("model") or "unknown"
    details = model.get("details") or {}
    show = _show_model(name)
    model_info = show.get("model_info") or {}
    capabilities = show.get("capabilities") or []
    size_bytes = int(model.get("size") or 0)

    return {
        "name": name,
        "size_bytes": size_bytes,
        "size_display": _format_size(size_bytes),
        "modified_at": model.get("modified_at") or "",
        "parameter_size": details.get("parameter_size") or "Unknown",
        "quantization": details.get("quantization_level") or "Unknown",
        "family": details.get("family") or "Unknown",
        "context_length": _context_length(model_info),
        "capabilities": capabilities,
    }


def list_models() -> dict[str, list[dict[str, Any]]]:
    data = _ollama_get("/api/tags")
    models = data.get("models") or []
    return {"models": [_normalize_model(model) for model in models]}


def pull_model(model_name: str) -> dict[str, str]:
    if not model_name.strip():
        raise HTTPException(status_code=400, detail="Model name is required")

    try:
        result = subprocess.run(
            ["ollama", "pull", model_name.strip()],
            capture_output=True,
            check=True,
            text=True,
            timeout=1800,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="ollama CLI is not installed") from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail=f"Timed out pulling {model_name}") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or exc.stdout.strip() or f"Failed to pull {model_name}"
        raise HTTPException(status_code=500, detail=detail) from exc

    return {"message": result.stdout.strip() or f"Pulled {model_name}"}


def delete_model(model_name: str) -> dict[str, str]:
    if not model_name.strip():
        raise HTTPException(status_code=400, detail="Model name is required")

    try:
        result = subprocess.run(
            ["ollama", "rm", model_name.strip()],
            capture_output=True,
            check=True,
            text=True,
            timeout=120,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail="ollama CLI is not installed") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or exc.stdout.strip() or f"Failed to delete {model_name}"
        raise HTTPException(status_code=500, detail=detail) from exc

    return {"message": result.stdout.strip() or f"Deleted {model_name}"}

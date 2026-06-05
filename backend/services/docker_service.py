from datetime import datetime

import docker
from docker.errors import APIError, DockerException, NotFound
from fastapi import HTTPException


def _client():
    try:
        return docker.from_env()
    except DockerException as exc:
        raise HTTPException(status_code=503, detail=f"Docker is unavailable: {exc}") from exc


def _container_image(container) -> str:
    tags = container.image.tags
    if tags:
        return tags[0]
    return container.image.short_id


def _format_created(value: str) -> str:
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return value.split("T", 1)[0]


def _format_ports(container) -> list[str]:
    ports = container.attrs.get("NetworkSettings", {}).get("Ports") or {}
    formatted: list[str] = []

    for container_port, bindings in ports.items():
        port = container_port.split("/", 1)[0]
        if not bindings:
            formatted.append(port)
            continue

        for binding in bindings:
            host_port = binding.get("HostPort")
            if host_port:
                formatted.append(f"{host_port}:{port}")
            else:
                formatted.append(port)

    return list(dict.fromkeys(formatted))


def list_containers() -> list[dict[str, str | list[str]]]:
    try:
        containers = _client().containers.list(all=True)
    except DockerException as exc:
        raise HTTPException(status_code=503, detail=f"Unable to list Docker containers: {exc}") from exc

    return [
        {
            "id": container.short_id,
            "name": container.name,
            "image": _container_image(container),
            "status": container.status,
            "created": _format_created(container.attrs.get("Created", "")),
            "ports": _format_ports(container),
        }
        for container in containers
    ]


def _cpu_percent(stats: dict) -> float:
    cpu_stats = stats.get("cpu_stats", {})
    precpu_stats = stats.get("precpu_stats", {})

    cpu_delta = (
        cpu_stats.get("cpu_usage", {}).get("total_usage", 0)
        - precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
    )
    system_delta = cpu_stats.get("system_cpu_usage", 0) - precpu_stats.get("system_cpu_usage", 0)
    online_cpus = cpu_stats.get("online_cpus") or len(cpu_stats.get("cpu_usage", {}).get("percpu_usage", [])) or 1

    if cpu_delta <= 0 or system_delta <= 0:
        return 0.0

    return round((cpu_delta / system_delta) * online_cpus * 100, 1)


def _memory_used_mb(stats: dict) -> float:
    memory_stats = stats.get("memory_stats", {})
    usage = memory_stats.get("usage", 0)
    cache = memory_stats.get("stats", {}).get("cache", 0)
    return round(max(usage - cache, 0) / 1024 / 1024, 1)


def get_container_stats() -> list[dict[str, float | str]]:
    try:
        containers = _client().containers.list(filters={"status": "running"})
    except DockerException as exc:
        raise HTTPException(status_code=503, detail=f"Unable to read Docker stats: {exc}") from exc

    results: list[dict[str, float | str]] = []
    for container in containers:
        try:
            stats = container.stats(stream=False)
        except APIError:
            continue

        memory_limit = stats.get("memory_stats", {}).get("limit", 0)
        results.append({
            "container_id": container.short_id,
            "cpu_percent": _cpu_percent(stats),
            "memory_used_mb": _memory_used_mb(stats),
            "memory_limit_mb": round(memory_limit / 1024 / 1024, 1),
        })

    return results


def _get_container(container_id: str):
    try:
        return _client().containers.get(container_id)
    except NotFound as exc:
        raise HTTPException(status_code=404, detail="Container not found") from exc
    except DockerException as exc:
        raise HTTPException(status_code=503, detail=f"Docker is unavailable: {exc}") from exc


def start_container(container_id: str) -> dict[str, str]:
    container = _get_container(container_id)
    container.start()
    return {"message": f"Started {container.name}"}


def stop_container(container_id: str) -> dict[str, str]:
    container = _get_container(container_id)
    container.stop()
    return {"message": f"Stopped {container.name}"}


def restart_container(container_id: str) -> dict[str, str]:
    container = _get_container(container_id)
    container.restart()
    return {"message": f"Restarted {container.name}"}


def get_container_logs(container_id: str) -> dict[str, list[str]]:
    container = _get_container(container_id)
    raw_logs = container.logs(tail=200, timestamps=False).decode("utf-8", errors="replace")
    return {"logs": raw_logs.splitlines()}

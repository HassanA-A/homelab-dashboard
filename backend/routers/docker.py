from fastapi import APIRouter

from services.docker_service import (
    get_container_logs,
    get_container_stats,
    list_containers,
    restart_container,
    start_container,
    stop_container,
)

router = APIRouter(prefix="/api/docker", tags=["docker"])


@router.get("/containers")
def read_containers():
    return list_containers()


@router.get("/stats")
def read_container_stats():
    return get_container_stats()


@router.post("/{container_id}/start")
def start(container_id: str):
    return start_container(container_id)


@router.post("/{container_id}/stop")
def stop(container_id: str):
    return stop_container(container_id)


@router.post("/{container_id}/restart")
def restart(container_id: str):
    return restart_container(container_id)


@router.get("/{container_id}/logs")
def logs(container_id: str):
    return get_container_logs(container_id)

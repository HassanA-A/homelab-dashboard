from fastapi import APIRouter

from services.services_service import get_open_webui_logs, list_services, restart_open_webui

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("")
def read_services():
    return list_services()


@router.post("/open-webui/restart")
def restart():
    return restart_open_webui()


@router.get("/open-webui/logs")
def logs():
    return get_open_webui_logs()

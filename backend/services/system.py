import socket
import time

import psutil


def format_uptime(seconds: float) -> str:
    total_seconds = int(seconds)
    days = total_seconds // 86400
    hours = (total_seconds % 86400) // 3600
    minutes = (total_seconds % 3600) // 60

    if days > 0:
        return f"{days}d {hours}h"
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def get_system_metrics() -> dict[str, int | str]:
    boot_time = psutil.boot_time()
    uptime_seconds = time.time() - boot_time

    return {
        "cpu": round(psutil.cpu_percent(interval=0.2)),
        "ram": round(psutil.virtual_memory().percent),
        "disk": round(psutil.disk_usage("/").percent),
        "uptime": format_uptime(uptime_seconds),
        "hostname": socket.gethostname(),
    }

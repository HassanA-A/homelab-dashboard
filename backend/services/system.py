import json
import platform
import socket
import subprocess
import time

import psutil

GB = 1024 ** 3

_last_net_sample: tuple[float, int, int] | None = None


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


def _run_command(command: list[str]) -> str:
    try:
        result = subprocess.run(command, capture_output=True, check=True, text=True, timeout=3)
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return ""
    return result.stdout.strip()


def _round_gb(bytes_value: int | float) -> float:
    return round(bytes_value / GB, 1)


def _get_cpu_model() -> str:
    lscpu_output = _run_command(["lscpu"])
    for line in lscpu_output.splitlines():
        if line.startswith("Model name:"):
            return line.split(":", 1)[1].strip()

    try:
        with open("/proc/cpuinfo", "r", encoding="utf-8") as cpuinfo:
            for line in cpuinfo:
                if line.startswith("model name"):
                    return line.split(":", 1)[1].strip()
    except OSError:
        pass

    return platform.processor() or "Unknown CPU"


def get_cpu_metrics() -> dict[str, int | str]:
    return {
        "model": _get_cpu_model(),
        "usage": round(psutil.cpu_percent(interval=0.2)),
        "cores": psutil.cpu_count(logical=False) or 0,
        "threads": psutil.cpu_count(logical=True) or 0,
    }


def get_ram_metrics() -> dict[str, float | int]:
    memory = psutil.virtual_memory()
    return {
        "used_gb": _round_gb(memory.used),
        "total_gb": _round_gb(memory.total),
        "usage": round(memory.percent),
    }


def get_gpu_metrics() -> dict[str, float | int | str]:
    output = _run_command([
        "nvidia-smi",
        "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu",
        "--format=csv,noheader,nounits",
    ])

    if not output:
        return {
            "name": "Unavailable",
            "usage": 0,
            "vram_used_gb": 0,
            "vram_total_gb": 0,
            "temperature": 0,
        }

    name, usage, vram_used_mb, vram_total_mb, temperature = [part.strip() for part in output.splitlines()[0].split(",")]
    return {
        "name": name,
        "usage": round(float(usage)),
        "vram_used_gb": round(float(vram_used_mb) / 1024, 1),
        "vram_total_gb": round(float(vram_total_mb) / 1024, 1),
        "temperature": round(float(temperature)),
    }


def get_storage_metrics() -> dict[str, float | int]:
    usage = psutil.disk_usage("/")
    return {
        "used_gb": _round_gb(usage.used),
        "total_gb": _round_gb(usage.total),
        "usage": round(usage.percent),
    }


def _get_local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("1.1.1.1", 80))
            return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def get_network_metrics() -> dict[str, float | str]:
    global _last_net_sample

    now = time.time()
    counters = psutil.net_io_counters()

    if _last_net_sample is None:
        _last_net_sample = (now, counters.bytes_recv, counters.bytes_sent)
        download_mbps = 0.0
        upload_mbps = 0.0
    else:
        previous_time, previous_recv, previous_sent = _last_net_sample
        elapsed = max(now - previous_time, 0.001)
        download_mbps = ((counters.bytes_recv - previous_recv) * 8) / elapsed / 1_000_000
        upload_mbps = ((counters.bytes_sent - previous_sent) * 8) / elapsed / 1_000_000
        _last_net_sample = (now, counters.bytes_recv, counters.bytes_sent)

    return {
        "download_mbps": round(max(download_mbps, 0), 1),
        "upload_mbps": round(max(upload_mbps, 0), 1),
        "local_ip": _get_local_ip(),
    }


def get_tailscale_metrics() -> dict[str, bool | int | str]:
    output = _run_command(["tailscale", "status", "--json"])

    if not output:
        return {
            "connected": False,
            "tailscale_ip": "Unavailable",
            "peer_count": 0,
        }

    try:
        status = json.loads(output)
    except json.JSONDecodeError:
        return {
            "connected": False,
            "tailscale_ip": "Unavailable",
            "peer_count": 0,
        }

    self_info = status.get("Self") or {}
    tailscale_ips = self_info.get("TailscaleIPs") or []
    peers = status.get("Peer") or {}

    return {
        "connected": bool(self_info.get("Online")),
        "tailscale_ip": tailscale_ips[0] if tailscale_ips else "Unavailable",
        "peer_count": len(peers),
    }


def _get_os_name() -> str:
    try:
        with open("/etc/os-release", "r", encoding="utf-8") as os_release:
            values = {}
            for line in os_release:
                key, _, value = line.partition("=")
                values[key] = value.strip().strip('"')
            return values.get("PRETTY_NAME") or values.get("NAME") or platform.system()
    except OSError:
        return platform.system()


def get_system_info() -> dict[str, float | str]:
    cpu = get_cpu_metrics()
    ram = get_ram_metrics()
    gpu = get_gpu_metrics()
    storage = get_storage_metrics()

    return {
        "hostname": socket.gethostname(),
        "os": _get_os_name(),
        "kernel": platform.release(),
        "architecture": platform.machine(),
        "cpu_model": str(cpu["model"]),
        "total_ram_gb": float(ram["total_gb"]),
        "gpu_model": str(gpu["name"]),
        "storage_total_gb": float(storage["total_gb"]),
        "uptime": format_uptime(time.time() - psutil.boot_time()),
    }


def get_system_metrics() -> dict[str, int | str]:
    cpu = get_cpu_metrics()
    ram = get_ram_metrics()
    storage = get_storage_metrics()
    info = get_system_info()

    return {
        "cpu": int(cpu["usage"]),
        "ram": int(ram["usage"]),
        "disk": int(storage["usage"]),
        "uptime": str(info["uptime"]),
        "hostname": str(info["hostname"]),
    }

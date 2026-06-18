#!/bin/bash
# Release host TCP ports 80/443 for elt-frontend-proxy.
# Jenkins-in-Docker deploys cannot assume compose down sees the previous
# workspace path; other stacks (e.g. etl-deployment elt-proxy) may hold 80/443.

set -euo pipefail

free_docker_host_port() {
  local port="$1"
  local ids
  ids="$(docker ps -q --filter "publish=${port}" 2>/dev/null || true)"
  if [ -n "$ids" ]; then
    echo "Releasing host port ${port} (containers: ${ids})"
    # shellcheck disable=SC2086
    docker rm -f $ids >/dev/null 2>&1 || true
  fi
}

diagnose_host_port() {
  local port="$1"
  echo "Port ${port} is still in use:" >&2
  docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null | head -1 >&2 || true
  docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null | grep -E ":${port}->" >&2 || true
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :${port}" 2>/dev/null >&2 || true
  fi
  echo "If you see the default 'Welcome to nginx!' page in a browser, stop host nginx:" >&2
  echo "  sudo systemctl stop nginx && sudo systemctl disable nginx" >&2
}

port_is_listening() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :${port}" 2>/dev/null | grep -q ":${port}"
    return
  fi
  return 1
}

stop_host_nginx() {
  if ! command -v systemctl >/dev/null 2>&1; then
    return 0
  fi
  if ! systemctl is-active --quiet nginx 2>/dev/null; then
    return 0
  fi

  echo "Stopping host nginx (default welcome page blocks elt-frontend-proxy)"
  if systemctl stop nginx 2>/dev/null; then
    systemctl disable nginx 2>/dev/null || true
    return 0
  fi
  if sudo -n systemctl stop nginx 2>/dev/null; then
    sudo -n systemctl disable nginx 2>/dev/null || true
    return 0
  fi

  echo "ERROR: host nginx is active but deploy could not stop it (run: sudo systemctl stop nginx)" >&2
  return 1
}

release_edge_ports() {
  echo "=== Releasing host ports 80/443 ==="
  # Legacy full-stack edge proxy from etl-deployment (same ports).
  docker rm -f elt-proxy 2>/dev/null || true
  free_docker_host_port 80
  free_docker_host_port 443
  stop_host_nginx

  local port
  for port in 80 443; do
    if docker ps -q --filter "publish=${port}" 2>/dev/null | grep -q .; then
      diagnose_host_port "$port"
      return 1
    fi
    if port_is_listening "$port"; then
      diagnose_host_port "$port"
      return 1
    fi
  done
}

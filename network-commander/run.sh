#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${CAPTIVE_PORT:-80}"
HOST="${CAPTIVE_HOST:-0.0.0.0}"
SECRET="${CAPTIVE_COMMANDER_SECRET:-dev-captive-secret}"

sudo CAPTIVE_COMMANDER_SECRET="$SECRET" \
  CAPTIVE_INTERFACE="${CAPTIVE_INTERFACE:-wlp2s0}" \
  CAPTIVE_GATEWAY="${CAPTIVE_GATEWAY:-192.168.77.1}" \
  CAPTIVE_SSID="${CAPTIVE_SSID:-Mark-Attendence}" \
  CAPTIVE_BACKEND_URL="${CAPTIVE_BACKEND_URL:-http://127.0.0.1:8090}" \
  "$PWD/.venv/bin/uvicorn" main:app --host "$HOST" --port "$PORT"

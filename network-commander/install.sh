#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

sudo apt update
sudo apt install -y hostapd dnsmasq-base net-tools python3-pip python3-venv
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

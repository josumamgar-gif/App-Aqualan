#!/bin/bash
# Arranca el backend escuchando en toda la red (0.0.0.0) para que el móvil en la misma WiFi pueda conectarse.
# Luego en frontend/.env pon: EXPO_PUBLIC_BACKEND_URL=http://TU_IP:8000

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
  echo "Creando venv..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

echo "Backend en http://0.0.0.0:8000 (móvil: usa la IP de este PC en frontend/.env)"
uvicorn server:app --host 0.0.0.0 --port 8000

@echo off
REM Arranca el backend en 0.0.0.0 para que el movil en la misma WiFi pueda conectarse.
REM En frontend\.env pon: EXPO_PUBLIC_BACKEND_URL=http://TU_IP:8000

cd /d "%~dp0"
if not exist "venv" (
  echo Creando venv...
  python -m venv venv
)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo Backend en http://0.0.0.0:8000 - Usa la IP de este PC en frontend\.env
uvicorn server:app --host 0.0.0.0 --port 8000

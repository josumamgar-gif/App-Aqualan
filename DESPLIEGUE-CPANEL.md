# Despliegue AQUALAN con cPanel

Tu servidor tiene la IP **178.211.133.79** y el dominio **aqualan.es** apunta a ese mismo servidor. Lo más lógico es **usar ese servidor (esa IP) para el backend**: que el backend corra en 178.211.133.79 y que la web en **https://aqualan.es/app** llame a **https://aqualan.es/api** (todo en el mismo dominio y mismo servidor). Una sola IP, un solo dominio.

No uses la IP en el navegador como URL del backend (`http://178.211.133.79:8000`): daría mixed content (https→http) y sin SSL. La IP es el servidor; la URL pública debe ser **https://aqualan.es**.

---

## Cómo subir la app web (frontend) a cPanel

Cuando hagas cambios en la app y quieras actualizar **https://aqualan.es/app**:

1. **En tu PC**, en la carpeta del proyecto:
   ```bash
   cd frontend
   EXPO_PUBLIC_BACKEND_URL=https://aqualan-api.onrender.com npx expo export -p web
   ```
2. **Crea un ZIP** con todo el contenido de `frontend/dist` (los archivos de dentro, no la carpeta).
3. **cPanel** → Archivos → entra en la carpeta de la app (ej. `public_html/app`).
4. **Sube el ZIP**, descomprímelo ahí (sobrescribe si ya había archivos).
5. Prueba **https://aqualan.es/app**.

---

## Opción recomendada: API en el mismo dominio (https://aqualan.es/api)

Backend en el servidor 178.211.133.79, accesible como **https://aqualan.es/api**. El frontend usa `EXPO_PUBLIC_BACKEND_URL=https://aqualan.es`.

### Paso 1: Subir el backend al servidor

1. cPanel → **Archivos** → **Administrador de archivos**.
2. Crea una carpeta para el backend (ej. en tu home: `backend` → `/home/tu_usuario/backend`).
3. Sube todo el contenido de tu carpeta **backend/** del proyecto: `server.py`, `requirements.txt`, `.env`, carpeta `static/` si existe. En `.env` pon `BASE_URL=https://aqualan.es` y el resto (MONGO_URL, SMTP, etc.).

### Paso 2: Instalar y arrancar el backend (SSH o Setup Python App)

**Con SSH** en 178.211.133.79:

```bash
cd ~/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8000
```

Comprueba con `curl http://127.0.0.1:8000/api/health` desde el servidor. Detén (Ctrl+C) y configura el proxy.

**Sin SSH**: usa **“Setup Python App”** en cPanel apuntando a la carpeta del backend, instala `requirements.txt` y, si permite, comando de inicio: `uvicorn server:app --host 127.0.0.1 --port 8000` (o el puerto que asigne el panel).

### Paso 3: Proxy /api hacia el backend (Apache)

En cPanel busca **“Editor de configuración de Apache”** o **“Include Editor”** para el dominio aqualan.es. Añade (puerto 8000 o el que uses):

```apache
ProxyPreserveHost On
ProxyPass /api http://127.0.0.1:8000/api
ProxyPassReverse /api http://127.0.0.1:8000/api
```

Guarda y reinicia Apache. Si tu plan no permite editar Apache, usa la opción con subdominio más abajo.

### Paso 4: Dejar el backend siempre encendido (SSH)

Por SSH puedes crear un servicio systemd. Ejemplo (ajusta `tu_usuario` y rutas):

```bash
sudo nano /etc/systemd/system/aqualan-api.service
```

Contenido:

```ini
[Unit]
Description=AQUALAN API
After=network.target

[Service]
User=tu_usuario
WorkingDirectory=/home/tu_usuario/backend
Environment="PATH=/home/tu_usuario/backend/venv/bin"
ExecStart=/home/tu_usuario/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Luego: `sudo systemctl daemon-reload && sudo systemctl enable aqualan-api && sudo systemctl start aqualan-api`

### Paso 5: Frontend con URL del mismo dominio

En tu PC:

```bash
cd frontend
export EXPO_PUBLIC_BACKEND_URL=https://aqualan.es
npx expo export -p web
```

Sube la salida a la carpeta de **aqualan.es/app** en cPanel. Comprueba **https://aqualan.es/api/health**, **https://aqualan.es/api/products** y que la app cargue los productos.

---

## Opción alternativa: subdominio api.aqualan.es (mismo servidor 178.211.133.79)

Si no puedes configurar el proxy de Apache en cPanel, el backend sigue en el **mismo servidor** pero lo expones con un subdominio:

### Paso 1: Crear el subdominio en cPanel

1. Entra en **cPanel** (https://aqualan.es:2083 o el puerto que uses).
2. **Dominios** → **Subdominios** (o **Subdomains**).
3. Crea el subdominio **api**:
   - Subdominio: `api`
   - Dominio: `aqualan.es`
   - Carpeta del documento: por ejemplo `api.aqualan.es` (cPanel la crea dentro de `public_html` o tu directorio home).
4. Guarda. La ruta típica será: `~/api.aqualan.es` o `~/public_html/api.aqualan.es`.

### Paso 2: Subir el backend con el Administrador de archivos

1. **Archivos** → **Administrador de archivos**.
2. Entra en la carpeta del subdominio (ej. `api.aqualan.es`).
3. Sube **todo el contenido** de tu carpeta `backend/` del proyecto:
   - `server.py`
   - `requirements.txt`
   - `.env` (¡importante! créalo o edítalo en el servidor con tus datos reales)
   - Carpeta `static/` si existe
   - Cualquier otro archivo que use `server.py` (p. ej. `rutas.xlsx` en la carpeta padre si el código lo espera ahí).

Asegúrate de que `.env` existe en esa carpeta y contiene al menos:

```env
MONGO_URL="mongodb+srv://aqualan579_db_user:TU_PASSWORD_REAL@cluster0.itkw7ms.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME="test_database"
SMTP_SERVER=mail.aqualan.es
SMTP_PORT=465
SMTP_USER=pedidos@aqualan.es
SMTP_PASSWORD=Pedidos_aqualan.ABC
BASE_URL=https://aqualan.es
```

### Paso 3: Configurar la aplicación Python en cPanel

1. En cPanel busca **“Setup Python App”** o **“Application Manager”** o **“Configurar aplicación Python”** (según la versión).
2. **Create Application**:
   - **Python version**: 3.10 o 3.11 (la que ofrezca el panel).
   - **Application root**: la ruta de la carpeta del subdominio, ej. `api.aqualan.es` o la ruta absoluta que te indique cPanel (ej. `/home/tu_usuario/api.aqualan.es`).
   - **Application URL**: selecciona el dominio/subdominio **api.aqualan.es** (o la URL que te asigne, ej. `https://api.aqualan.es`).
   - **Application startup file**: deja en blanco o pon `server.py` si te lo pide; si te pide un “callable”, usa `app` (el objeto FastAPI se llama `app` en `server.py`).
3. En la misma pantalla, **Run setup script** o **Install requirements**:
   - Comando típico: `pip install -r requirements.txt`  
   (a veces el panel tiene un botón “Run pip install” y tú solo indicas `requirements.txt`).
4. Guarda y **Start** / **Restart** la aplicación.

Si tu cPanel pide un archivo **WSGI** (por ejemplo `passenger_wsgi.py` o `application`), en la carpeta del subdominio crea el archivo que se indica en la sección **“Si cPanel pide passenger_wsgi.py”** más abajo.

### Paso 4: Comprobar la API

- Abre en el navegador: **https://api.aqualan.es/api/health**  
  Debe responder algo como: `{"status":"ok","message":"AQUALAN API",...}`.
- Luego: **https://api.aqualan.es/api/products**  
  Debe devolver JSON con la lista de productos.

El backend sigue en el servidor **178.211.133.79**; solo cambia la URL pública (subdominio). Si no cargan, revisa los logs de la aplicación Python en cPanel.

### Paso 5: Apuntar el frontend a la API

En tu **PC**, en la carpeta del frontend, genera la web usando la URL del subdominio y vuelve a subir la app a **https://aqualan.es/app**:

```bash
cd frontend
export EXPO_PUBLIC_BACKEND_URL=https://api.aqualan.es
npx expo export -p web
```

Sube la salida de ese build a la carpeta que en cPanel corresponde a **aqualan.es/app** (por ejemplo dentro de `public_html/app` o la ruta que uses para la web).

Después de esto, **https://aqualan.es/app** debería cargar los productos desde **https://api.aqualan.es/api/products**.

---

## Si cPanel pide “passenger_wsgi.py” o un callable WSGI

Algunos cPanels con Passenger exigen un archivo de entrada. FastAPI es **ASGI** y Passenger suele esperar **WSGI**, así que depende de tu hosting:

1. **Si en “Setup Python App” puedes poner un comando de inicio** (por ejemplo “Start command” o “Run script”):  
   Prueba con:  
   `uvicorn server:app --host 127.0.0.1 --port 5000`  
   (el puerto puede ser otro que te asigne cPanel). No hace falta `passenger_wsgi.py` en ese caso.

2. **Si solo permite un archivo tipo passenger_wsgi.py**:  
   Crea en la misma carpeta donde está `server.py` un archivo **passenger_wsgi.py** con este contenido (solo si tu proveedor confirma que soporta aplicaciones ASGI o “custom app”):

```python
import sys
import os

# Ajusta esta ruta si cPanel te da otra para el venv
INTERP = os.path.join(os.path.dirname(__file__), 'venv', 'bin', 'python')
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.insert(0, os.path.dirname(__file__))

from server import app
# Muchos entornos esperan 'application'
application = app
```

Si al arrancar sale un error tipo “ASGI/WSGI”, tu hosting probablemente solo soporta WSGI. En ese caso:
- Pregunta a tu proveedor si tienen **“Setup Python App”** con opción para **Gunicorn + Uvicorn worker** o **Hypercorn**, o
- Usa la **Opción alternativa** (servidor con SSH y Apache proxy) de la guía DESPLIEGUE-SERVIDOR-178.211.133.79.md.

---

## Más información

Para más detalle sobre el proxy de Apache (incl. ejemplos de configuración) y el servicio systemd, ver la guía **DESPLIEGUE-SERVIDOR-178.211.133.79.md**. La lógica es la misma: backend en 178.211.133.79, expuesto como https://aqualan.es/api.

---

## Resumen rápido

| Enfoque | Backend en | URL del backend | EXPO_PUBLIC_BACKEND_URL |
|--------|------------|------------------|--------------------------|
| **Recomendado (mismo dominio)** | Servidor 178.211.133.79 | https://aqualan.es/api | https://aqualan.es |
| **Alternativo (subdominio)** | Mismo servidor 178.211.133.79 | https://api.aqualan.es | https://api.aqualan.es |

En ambos casos el backend utiliza la **IP del servidor que ya tienes** (178.211.133.79). Lo más lógico es exponerlo como **https://aqualan.es/api** si tu cPanel permite el proxy de Apache.


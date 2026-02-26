# Despliegue del backend AQUALAN en el servidor 178.211.133.79

Tu app en https://aqualan.es/app necesita que la API esté disponible en **https://aqualan.es/api**. El servidor tiene IP **178.211.133.79**.

## Resumen de pasos

1. **Subir y ejecutar el backend** en 178.211.133.79 (FastAPI con uvicorn).
2. **Configurar el proxy** en el servidor para que `https://aqualan.es/api` → proceso del backend (puerto 8000).
3. **Recompilar el frontend** con `EXPO_PUBLIC_BACKEND_URL=https://aqualan.es` y volver a subir la web a `/app`.

---

## 1. En tu servidor (178.211.133.79)

Conéctate por SSH:

```bash
ssh usuario@178.211.133.79
```

### 1.1 Instalar dependencias (si no están)

```bash
# Python 3 y pip (ejemplo en Ubuntu/Debian)
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# Crear carpeta de la app
sudo mkdir -p /var/www/aqualan
sudo chown $USER:$USER /var/www/aqualan
cd /var/www/aqualan
```

### 1.2 Subir el backend

Desde tu **PC** (en la carpeta del proyecto):

```bash
# Desde: APLICACION-AQUALAN2.0/
scp -r backend/* usuario@178.211.133.79:/var/www/aqualan/backend/
```

O clona el repo / sube por FTP los archivos de la carpeta `backend/` (incluyendo `server.py`, `requirements.txt`, `.env`, carpeta `static/` si existe).

En el **servidor**:

```bash
cd /var/www/aqualan/backend
python3 -m venv venv
source venv/bin/activate   # en Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 1.3 Archivo .env en el servidor

Asegúrate de que en el servidor exista `backend/.env` con algo como:

```env
MONGO_URL="mongodb+srv://aqualan579_db_user:<db_password>@cluster0.itkw7ms.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME="test_database"
SMTP_SERVER=mail.aqualan.es
SMTP_PORT=465
SMTP_USER=pedidos@aqualan.es
SMTP_PASSWORD=Pedidos_aqualan.ABC
BASE_URL=https://aqualan.es
```

(Sustituye `<db_password>` por la contraseña real de MongoDB.)

### 1.4 Probar el backend en el servidor

```bash
cd /var/www/aqualan/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000
```

En otra terminal (o desde tu PC):

```bash
curl http://178.211.133.79:8000/api/health
curl http://178.211.133.79:8000/api/products
```

Si ves JSON con productos, el backend está bien. Detén uvicorn (Ctrl+C) y sigue.

### 1.5 Dejar el backend corriendo siempre (systemd)

Crea el archivo de servicio:

```bash
sudo nano /etc/systemd/system/aqualan-api.service
```

Contenido:

```ini
[Unit]
Description=AQUALAN FastAPI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/aqualan/backend
Environment="PATH=/var/www/aqualan/backend/venv/bin"
ExecStart=/var/www/aqualan/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

(Ajusta `User`/`Group` si usas otro usuario; y `WorkingDirectory` si tu ruta es distinta.)

Activar y arrancar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable aqualan-api
sudo systemctl start aqualan-api
sudo systemctl status aqualan-api
```

---

## 2. Configurar Nginx para aqualan.es

El dominio **aqualan.es** debe apuntar a la IP **178.211.133.79** (registro A en tu DNS).

En el servidor, configura Nginx para que:

- **https://aqualan.es/app** → sirva los archivos estáticos de la app (tu build actual).
- **https://aqualan.es/api** → rediriga al backend en `http://127.0.0.1:8000`.

Ejemplo de sitio (sustituye `ruta_a_tu_web` por donde tengas la web):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name aqualan.es www.aqualan.es;
    # Redirigir HTTP → HTTPS si usas SSL
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name aqualan.es www.aqualan.es;

    # Certificados SSL (Let's Encrypt, etc.)
    ssl_certificate     /etc/letsencrypt/live/aqualan.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aqualan.es/privkey.pem;

    root /var/www/aqualan/web;
    index index.html;

    # App estática en /app
    location /app {
        alias /var/www/aqualan/web/app;
        try_files $uri $uri/ /app/index.html;
    }

    # API → backend FastAPI
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Raíz: redirigir a /app o servir tu index
    location = / {
        return 302 /app/;
    }
}
```

Ajusta:

- `root` y `location /app` según la ruta real donde subes la web (p. ej. si tu panel pone `/var/www/html`, usa esa).
- Rutas de `ssl_certificate` si usas otro certificado.

Recargar Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Frontend: build con la URL de producción

En tu **PC**, en la carpeta del frontend, configura la URL del backend para producción y vuelve a generar la web:

```bash
cd frontend
export EXPO_PUBLIC_BACKEND_URL=https://aqualan.es
# Si usas npm run build para web, o expo export para web:
npx expo export -p web
# o el comando que uses para generar la carpeta que subes a /app
```

Sube de nuevo la salida de ese build a la ruta que Nginx sirve como `/app` (por ejemplo `alias /var/www/aqualan/web/app`).

---

## 4. Comprobar

- **https://aqualan.es/api/health** → debe devolver `{"status":"ok",...}`.
- **https://aqualan.es/api/products** → debe devolver la lista de productos en JSON.
- **https://aqualan.es/app** → debe cargar la app y en “Productos” deberían aparecer los productos.

Si algo falla, revisa:

- `sudo journalctl -u aqualan-api -f` para ver logs del backend.
- `sudo tail -f /var/log/nginx/error.log` para errores de Nginx.
- En el navegador, F12 → pestaña Red: ver si las peticiones a `/api/products` van a `https://aqualan.es` y qué código de respuesta devuelven.

---

## Resumen de URLs

| Qué              | Dónde                          |
|------------------|---------------------------------|
| Servidor         | 178.211.133.79                 |
| API en el servidor | http://127.0.0.1:8000 (solo local) |
| API pública      | https://aqualan.es/api         |
| App web          | https://aqualan.es/app         |
| Backend .env     | BASE_URL=https://aqualan.es   |
| Frontend build   | EXPO_PUBLIC_BACKEND_URL=https://aqualan.es |

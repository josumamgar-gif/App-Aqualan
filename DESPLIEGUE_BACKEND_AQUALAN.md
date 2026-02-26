# Desplegar el backend (API para la app AQUALAN)

La app móvil usa la URL del backend que pongas en **`frontend/.env`** como `EXPO_PUBLIC_BACKEND_URL`. Si está vacía, en desarrollo usa `http://localhost:8000`. Para usarla en el móvil (Expo Go o instalable), esa URL debe ser pública (tu servidor, MongoDB Atlas API, etc.).

**Importante:** MongoDB es la base de datos. La URL de MongoDB (Atlas o la que uses) solo la necesita el **servidor** (backend), no la app. En el servidor donde corra el backend configuras esa URL en el `.env` del backend.

Puedes alojar el backend en **aqualan.es** (u otro dominio) siguiendo las opciones siguientes.

## Opción 1: API en la raíz (https://aqualan.es)

Si aqualan.es es solo para la API, sirves el backend directamente en el puerto 443 (con Nginx delante).

### En tu servidor (Linux con aqualan.es apuntando a su IP)

1. **Instalar Python 3.10+ y dependencias**
   ```bash
   cd /ruta/donde/esté/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Archivo `.env` en la carpeta `backend`**
   Crea o edita `backend/.env` con algo como:
   ```env
   MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/tu_base
   DB_NAME=tu_base
   SMTP_SERVER=mail.aqualan.es
   SMTP_PORT=587
   SMTP_USER=info@aqualan.es
   SMTP_PASSWORD=tu_password_email
   ```
   (La `MONGO_URL` es la de MongoDB Atlas o tu MongoDB; no se pone en la app, solo aquí.)

3. **Probar que arranca**
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000
   ```
   Desde el servidor: `curl http://localhost:8000/api/health` → debe responder OK.

4. **Nginx como proxy inverso (HTTPS)**
   Instala Nginx y certificado SSL (p. ej. Certbot para Let's Encrypt). Configuración de sitio para `aqualan.es`:
   ```nginx
   server {
       listen 443 ssl;
       server_name aqualan.es;
       ssl_certificate     /etc/letsencrypt/live/aqualan.es/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/aqualan.es/privkey.pem;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. **Servicio para que el backend esté siempre activo**
   Con systemd (crea `/etc/systemd/system/aqualan-api.service`):
   ```ini
   [Unit]
   Description=AQUALAN FastAPI
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/ruta/completa/al/backend
   Environment="PATH=/ruta/completa/al/backend/venv/bin"
   ExecStart=/ruta/completa/al/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Luego:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable aqualan-api
   sudo systemctl start aqualan-api
   ```

## Opción 2: API en un subdominio (https://api.aqualan.es)

Si en aqualan.es ya tienes una web y quieres la API en otro sitio:

- Apunta el DNS de **api.aqualan.es** a la misma IP del servidor.
- En Nginx crea un `server { server_name api.aqualan.es; ... }` que haga `proxy_pass` al puerto 8000.
- En la app (frontend) cambia la URL del backend a **https://api.aqualan.es**: en `frontend/.env` y en `frontend/eas.json` pon `EXPO_PUBLIC_BACKEND_URL=https://api.aqualan.es`.

## Resumen

| Dónde        | Qué configurar |
|-------------|----------------|
| **App (Expo)** | `EXPO_PUBLIC_BACKEND_URL=https://aqualan.es` (ya está puesto). |
| **Servidor aqualan.es** | Python + uvicorn + Nginx + `.env` con `MONGO_URL`, SMTP, etc. |
| **MongoDB** | Solo en el `.env` del backend en el servidor (nunca en la app). |

Cuando el backend esté en https://aqualan.es (o https://api.aqualan.es), la app en Expo Go y los builds usarán esa URL automáticamente.

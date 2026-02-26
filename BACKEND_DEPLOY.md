# Desplegar el backend AQUALAN en tu servidor (aqualan.es)

Tu **web** sigue en **https://aqualan.es** sin cambios. La **API de la app** (pedidos, categorías, ofertas) se sirve en el **mismo dominio** bajo **/api** (ej. `https://aqualan.es/api/health`).

## Qué necesitas para alojar el backend

### 1. En el servidor aqualan.es

- **Python 3.10+** instalado.
- **Carpeta del backend**: sube la carpeta `backend/` (o clona el repo) a tu servidor.
- **Variables de entorno** en `backend/.env` (en el servidor):
  - `MONGO_URL` y `DB_NAME` (MongoDB Atlas).
  - `SMTP_SERVER`, `SMTP_USER`, `SMTP_PASSWORD` para los emails.
  - **`BASE_URL=https://aqualan.es`** (mismo dominio que la web).

### 2. Exponer la API en el mismo dominio (sin cambiar la web)

En tu servidor ya tienes Nginx sirviendo la web en **aqualan.es**. Solo hay que **añadir** un `location /api` que envíe el tráfico al backend (uvicorn en el puerto 8000).

Dentro del `server { ... }` de **aqualan.es** (donde ya tienes `listen 443 ssl` y `server_name aqualan.es`), añade:

```nginx
    # API de la app (backend FastAPI) – no modifica la web
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Opcional: imágenes estáticas de productos (si usas /static en el backend)
    location /static {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
```

Luego recarga Nginx: `sudo nginx -t && sudo systemctl reload nginx`.

**App (frontend)** ya está configurada con:

- `EXPO_PUBLIC_BACKEND_URL=https://aqualan.es`  
La app llama a `https://aqualan.es/api/categories`, `https://aqualan.es/api/products`, etc. La web (páginas, diseño) no cambia.

### 3. Arrancar el backend en el servidor

En la carpeta del backend del servidor:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

Para dejarlo siempre corriendo (reinicio del servidor):

- **systemd**: crea un servicio que ejecute `uvicorn server:app --host 127.0.0.1 --port 8000`.
- O usa **supervisor** / **pm2** si lo prefieres.

### 4. Resumen de URLs

| Dónde           | URL / Variable              | Valor                      |
|-----------------|-----------------------------|----------------------------|
| Web             | https://aqualan.es          | Tu sitio actual (sin cambios) |
| API             | Mismo dominio, bajo /api    | https://aqualan.es/api/... |
| backend/.env    | BASE_URL                    | https://aqualan.es         |
| App (Expo)      | EXPO_PUBLIC_BACKEND_URL     | https://aqualan.es         |

La app en Expo Go solo dejará de mostrar pantalla en blanco y cargará categorías/productos cuando:

1. `EXPO_PUBLIC_BACKEND_URL` esté definida y sea una URL **https** válida (o http en desarrollo).
2. Esa URL sea accesible desde tu móvil (mismo WiFi que el ordenador en local, o dominio público en producción).

### 5. Probar que el backend responde

Desde el navegador o con curl:

```bash
curl https://aqualan.es/api/health
```

Deberías recibir algo como: `{"status":"ok","message":"AQUALAN API",...}`.

---

**Resumen:** Mismo dominio **aqualan.es**: la web igual, solo añades en Nginx `location /api` hacia el puerto 8000. En el servidor: Python, `backend/`, `.env` con `BASE_URL=https://aqualan.es`, y uvicorn en 8000. La app ya usa `EXPO_PUBLIC_BACKEND_URL=https://aqualan.es`.

---

## Pantalla en blanco en Expo Go

Si la app en Expo Go se queda en blanco:

1. **Comprueba `EXPO_PUBLIC_BACKEND_URL`** en `frontend/.env`. Debe ser una URL válida (por ejemplo `https://api.aqualan.es` cuando el backend esté desplegado, o `http://TU_IP:8000` para pruebas en red local). Si está vacía, la app puede fallar al intentar cargar datos.
2. **Tras cambiar `.env`**, reinicia el bundler de Expo (cierra y vuelve a ejecutar `npx expo start`) y recarga la app en el móvil.
3. **Pruebas en local:** Si el backend está en tu ordenador y la app en el móvil, usa la IP local de tu PC (ej. `http://192.168.1.10:8000`), no `localhost`. En el mismo PC puedes usar `http://localhost:8000`.
4. Si sigue en blanco, revisa la consola de Metro/Expo por errores en rojo (JavaScript o red).

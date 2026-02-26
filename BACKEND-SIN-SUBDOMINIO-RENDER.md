# Backend sin subdominio: usar un servicio gratuito (Render)

Si tu cPanel **no te deja crear subdominios**, puedes poner el backend en un servicio gratuito y que la app en aqualan.es/app llame a esa URL.

---

## Opción recomendada: Render (gratis)

[Render](https://render.com) tiene plan gratuito y permite desplegar un backend Python. Te dará una URL tipo **https://aqualan-api.onrender.com**.

### 1. Crear cuenta y proyecto en Render

1. Entra en **https://render.com** y crea cuenta (gratis).
2. **Dashboard** → **New** → **Web Service**.

### 2. Conectar el repositorio del backend

- Si tienes el proyecto en **GitHub**: conecta el repo y elige la carpeta **backend** (o el repo solo del backend).
- Si **no** tienes repo: en la sección "Build & Deploy" puedes usar **Deploy from existing image** o subir por **Render Blueprint**. La opción más simple sin GitHub es usar la opción **Docker** o **Script**: Render permite también **deploy desde un repo público**. Si no usas Git, más abajo tienes la opción con archivos manuales.

**Opción sin GitHub (solo con archivos):** Render suele pedir un repo. Alternativa fácil: crea un repo en GitHub solo con la carpeta backend (solo los archivos necesarios), conéctalo a Render y sigue los pasos.

### 3. Configuración del Web Service en Render

- **Name:** `aqualan-api` (o el que quieras; la URL será `aqualan-api.onrender.com`).
- **Region:** el más cercano (ej. Frankfurt).
- **Branch:** `main` (o la que uses).
- **Root Directory:** si todo el repo es el backend, deja vacío. Si el backend está en una carpeta `backend`, pon **`backend`**.
- **Runtime:** **Python 3**.
- **Build Command:**  
  `pip install -r requirements.txt`
- **Start Command:**  
  `uvicorn server:app --host 0.0.0.0 --port $PORT`  
  (Render asigna el puerto con la variable `PORT`; no cambies el puerto en el código.)

### 4. Variables de entorno en Render

En el servicio, **Environment** / **Environment Variables**, añade:

| Key | Value |
|-----|--------|
| `MONGO_URL` | Tu cadena de conexión de MongoDB (la que te da Atlas). |
| `DB_NAME` | `test_database` (o el nombre de tu base). |
| `BASE_URL` | `https://aqualan.es` |
| `SMTP_SERVER` | `mail.aqualan.es` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `pedidos@aqualan.es` |
| `SMTP_PASSWORD` | Tu contraseña de correo |

Guarda. Render hará un deploy automático.

### 5. Comprobar la API

Cuando termine el deploy, Render te da una URL como:

**https://aqualan-api.onrender.com**

Prueba en el navegador:

- **https://aqualan-api.onrender.com/api/health**
- **https://aqualan-api.onrender.com/api/products**

Si ves JSON, el backend está bien. Anota la URL **base** (sin `/api`), por ejemplo:  
`https://aqualan-api.onrender.com`

### 6. Build de la app con esa URL

En tu **PC**, en la carpeta del frontend, genera la web indicando esa URL y vuelve a subir la app a aqualan.es/app:

```bash
cd frontend
EXPO_PUBLIC_BACKEND_URL=https://aqualan-api.onrender.com npx expo export -p web
```

Luego:

- Haz el zip con el contenido de **dist** (como ya hiciste).
- Súbelo a la carpeta **app** de aqualan.es y descomprímelo.

La app en **https://aqualan.es/app** usará **https://aqualan-api.onrender.com** para productos, pedidos, etc.

---

## Nota sobre el plan gratis de Render

- El servicio se “duerme” tras unos minutos sin visitas; la primera petición puede tardar unos segundos.
- Si quieres que no se duerma, Render tiene planes de pago. Otra opción similar es **Railway** o **Fly.io** (también tienen capa gratuita).

---

## Resumen sin subdominio

| Dónde | Qué |
|-------|-----|
| **Backend** | En Render (u otro): p.ej. https://aqualan-api.onrender.com |
| **MongoDB** | Sigue en Atlas; en Render pones `MONGO_URL` en variables de entorno. |
| **App (aqualan.es/app)** | Se vuelve a generar con `EXPO_PUBLIC_BACKEND_URL=https://aqualan-api.onrender.com` y se sube de nuevo. |

Si quieres, en el siguiente paso podemos dejar listo un **repositorio mínimo** (solo backend) para conectar a Render paso a paso, o revisar la URL exacta que te haya dado Render para dejarla fija en el build.

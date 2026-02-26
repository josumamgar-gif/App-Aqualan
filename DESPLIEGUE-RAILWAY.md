# Despliegue del backend AQUALAN en Railway

En muchos entornos **Railway bloquea los puertos SMTP** (465/587). Si ves "Network is unreachable" al enviar emails, usa **Resend.com** (API por HTTPS, gratis).

---

## 1. Crear el servicio en Railway

1. Entra en [railway.app](https://railway.app) y en tu proyecto crea **New → GitHub Repo**.
2. Conecta el repositorio **App-Aqualan** (o el que uses).
3. Railway detectará el proyecto. Configura:
   - **Root Directory:** `backend` (importante: el backend está dentro de `backend/`).
   - **Build Command:** (vacío o `pip install -r requirements.txt`).
   - **Start Command:**  
     `uvicorn server:app --host 0.0.0.0 --port $PORT`  
     (Railway inyecta `PORT` automáticamente.)
4. En **Settings → Networking** genera un **Public URL** (o añade dominio propio).

---

## 2. Variables de entorno en Railway

En **Variables** del servicio, añade **obligatoriamente**:

| Variable | Valor | Notas |
|----------|--------|--------|
| `MONGO_URL` | `mongodb+srv://usuario:CONTRASEÑA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority` | **Obligatorio.** Sin esto los pedidos solo se guardan en memoria. |
| `DB_NAME` | `test_database` | O el nombre de tu base de datos |
| `BASE_URL` | `https://app-aqualan-production.up.railway.app` | URL pública del backend |

**Email:** En Railway el SMTP suele estar bloqueado ("Network is unreachable"). Configura **Resend** (gratis en [resend.com](https://resend.com)):

| Variable | Valor |
|----------|--------|
| `RESEND_API_KEY` | Tu API key de Resend (Dashboard → API Keys) |
| `EMAIL_FROM` | `AQUALAN <onboarding@resend.dev>` |

Con `RESEND_API_KEY` el backend envía los emails por la API de Resend. No necesitas SMTP.

---

## 3. Imágenes de productos

- Sube las imágenes al servidor donde corre el backend. En Railway el sistema de archivos es efímero, así que cada deploy borra lo anterior.
- Opciones:
  - **Opción A:** Usar **Railway Volumes**: crea un volumen y monta una ruta (ej. `/data/products`). Sube ahí las imágenes y en el código sirve desde esa ruta (habría que ajustar `server.py` para leer desde el volumen).
  - **Opción B:** Servir imágenes desde otro sitio (por ejemplo un bucket S3 o la propia web en cPanel) y que `BASE_URL` o la URL de la imagen apunte ahí.

Si quieres seguir sirviendo desde el mismo backend, la opción más sencilla en Railway es usar un **Volume** y desplegar con las imágenes ya dentro del volumen (o subirlas después con un script).

---

## 4. Frontend (app web)

En tu app web (Expo / cPanel) cambia la URL del API a la nueva URL de Railway:

- `EXPO_PUBLIC_BACKEND_URL=https://TU-URL-RAILWAY.up.railway.app`
- Vuelve a generar el build web y a subir el contenido de `frontend/dist` a cPanel.

---

## 5. Resumen

- **Railway:** backend FastAPI. Variables: `MONGO_URL`, `DB_NAME`, `BASE_URL`, y para email `RESEND_API_KEY` + `EMAIL_FROM` (porque SMTP suele estar bloqueado).
- **cPanel:** app web estática (contenido de `frontend/dist`).
- **MongoDB Atlas:** base de datos en la nube.

Cuando hagas push a GitHub, Railway puede redeployar solo si tienes el deploy automático activado en el servicio.

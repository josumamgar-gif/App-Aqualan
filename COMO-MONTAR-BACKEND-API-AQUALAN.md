# Cómo montar el backend para que se vean los productos

**Si tu cPanel no te deja crear subdominios**, usa la guía **BACKEND-SIN-SUBDOMINIO-RENDER.md**: ahí se explica cómo poner el backend en Render (gratis) y que la app llame a esa URL.

---

## Qué está pasando ahora

- **https://aqualan.es/app** → Es tu app (frontend). Funciona.
- **https://aqualan.es/api** → Es una **página de WordPress**, no un servidor Python. Por eso no devuelve productos.

Para que se carguen los productos hace falta un **backend real**: el proyecto Python (FastAPI) que tienes en la carpeta `backend/`. Ese backend debe estar en un **subdominio propio**, por ejemplo **https://api.aqualan.es**.

---

## Qué tienes que hacer (resumen)

1. Crear el subdominio **api.aqualan.es** en cPanel.
2. Subir el contenido de la carpeta **backend/** a la carpeta de ese subdominio.
3. Poner en **.env** la URL de MongoDB (y el resto de datos).
4. Crear la **aplicación Python** en cPanel apuntando a esa carpeta y arrancarla.
5. La app en aqualan.es/app ya está configurada para usar **https://api.aqualan.es** como API.

---

## Paso 1: Crear el subdominio api.aqualan.es

1. Entra en **cPanel**.
2. **Dominios** → **Subdominios**.
3. Crea:
   - **Subdominio:** `api`
   - **Dominio:** `aqualan.es`
   - **Carpeta del documento:** la que te proponga (ej. `api.aqualan.es`).
4. Guardar. La ruta suele ser algo como: `public_html/api.aqualan.es` o `~/api.aqualan.es`.

---

## Paso 2: Subir el backend

1. **Archivos** → **Administrador de archivos**.
2. Entra en la **carpeta del subdominio** (la de api.aqualan.es).
3. Sube **todo lo que hay dentro** de la carpeta `backend/` de tu proyecto (no la carpeta “backend”, sino su contenido):
   - `server.py`
   - `requirements.txt`
   - Carpeta `static/` (si existe)
   - Cualquier otro archivo que esté junto a `server.py`.

---

## Paso 3: Crear y editar el archivo .env

En la **misma carpeta** donde has subido `server.py` (carpeta de api.aqualan.es):

1. Crea un archivo llamado **`.env`** (con el punto delante).
2. Pon dentro algo como esto, **con tu enlace real de MongoDB**:

```env
MONGO_URL=mongodb+srv://USUARIO:CONTRASEÑA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=test_database

SMTP_SERVER=mail.aqualan.es
SMTP_PORT=465
SMTP_USER=pedidos@aqualan.es
SMTP_PASSWORD=TuPasswordSMTP

BASE_URL=https://aqualan.es
```

- **MONGO_URL**: sustituye por el enlace completo que te da MongoDB Atlas (usuario, contraseña y host reales). Sí tiene que ver: el backend usa MongoDB para guardar y leer productos y pedidos.
- **DB_NAME**: nombre de la base de datos (puedes dejar `test_database` si en MongoDB usas ese).
- El resto son los datos de correo y la URL de tu web; ajústalos si son distintos.

Guarda el archivo.

---

## Paso 4: Aplicación Python en cPanel

1. En cPanel busca **“Setup Python App”** o **“Application Manager”** / **“Configurar aplicación Python”**.
2. **Create Application** (o similar):
   - **Python version:** 3.10 o 3.11.
   - **Application root:** la ruta de la carpeta del subdominio (ej. `api.aqualan.es` o la ruta absoluta que te indique cPanel).
   - **Application URL:** el dominio del subdominio, **api.aqualan.es** (para que quede https://api.aqualan.es).
3. En la misma pantalla, **instala dependencias:**
   - Comando tipo: `pip install -r requirements.txt`
   (o el botón “Run pip install” y el archivo `requirements.txt`).
4. Si te pide **Application startup file** o **callable:**
   - Startup file: `server.py`
   - Callable: `app`
5. **Start** / **Restart** la aplicación.

Si algo falla, revisa los **logs** de la aplicación en cPanel.

---

## Paso 5: Comprobar que el backend responde

Abre en el navegador:

- **https://api.aqualan.es/api/health**  
  Deberías ver algo como: `{"status":"ok","message":"AQUALAN API",...}`

- **https://api.aqualan.es/api/products**  
  Deberías ver un JSON con la lista de productos.

Si eso funciona, **https://aqualan.es/app** ya debería cargar los productos (la app está configurada para usar **https://api.aqualan.es** cuando estás en aqualan.es).

---

## Resumen

| Qué | Dónde |
|-----|--------|
| Página “api” en WordPress (https://aqualan.es/api) | No es el backend; puedes dejarla o quitarla. |
| Backend real (FastAPI) | Debe estar en **https://api.aqualan.es** (subdominio con “Setup Python App”). |
| MongoDB | Tiene que ver: pon su URL en el **.env** del backend en api.aqualan.es. |
| App (aqualan.es/app) | Ya está configurada para usar api.aqualan.es como API. |

Si en algún paso te pide algo que no ves en tu cPanel (por ejemplo “Setup Python App”), dime qué opciones te salen y te indico el equivalente.

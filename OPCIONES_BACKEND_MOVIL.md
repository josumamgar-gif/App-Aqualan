# Cómo hacer que el backend lo vea tu móvil (Expo Go)

El backend **no puede ser localhost** para el móvil: localhost es solo tu ordenador. Aquí tienes **3 formas** de que la app en el teléfono llegue al backend.

---

## Opción 1: Misma WiFi – IP de tu ordenador (rápido, sin instalar nada)

Tu **ordenador** y el **móvil** en la **misma WiFi**. El backend escucha en la red local y la app usa la IP del PC.

### 1. Arrancar el backend escuchando en la red

En la carpeta `backend`:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

O usa el script (ver más abajo):

```bash
./run-para-movil.sh
```

**Importante:** `--host 0.0.0.0` hace que acepte peticiones desde la WiFi, no solo desde localhost.

### 2. Saber la IP de tu Mac/PC

- **Mac:** Terminal → `ipconfig getifaddr en0` (o `en1`). Ej: `192.168.1.21`
- **Windows:** `ipconfig` → busca “IPv4”. Ej: `192.168.1.10`

### 3. Poner esa URL en la app

En **frontend/.env**:

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.21:8000
```

(Sustituye por tu IP.)

### 4. Arrancar la app y abrir en Expo Go

```bash
cd frontend
npx expo start
```

En el móvil (Expo Go), escanea el QR o introduce la URL que salga (ej. `exp://192.168.1.21:8081`).

**Ventaja:** Sin cuentas ni desplegar. **Limitación:** Solo funciona con el móvil en la misma WiFi que el PC.

---

## Opción 2: Tunel (ngrok) – URL pública temporal

Tu backend sigue en el PC, pero ngrok crea una **URL pública HTTPS** que redirige al puerto 8000. El móvil puede usar esa URL desde cualquier red (WiFi o datos).

### 1. Instalar ngrok

- Descarga: https://ngrok.com/download  
- O con Homebrew (Mac): `brew install ngrok`

### 2. Arrancar el backend en el PC

```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8000
```

### 3. Crear el túnel

En **otra terminal**:

```bash
ngrok http 8000
```

Verás algo como:

```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8000
```

Copia la URL **https** (ej. `https://abc123.ngrok-free.app`).

### 4. Configurar la app

En **frontend/.env**:

```env
EXPO_PUBLIC_BACKEND_URL=https://abc123.ngrok-free.app
```

(Sustituye por la URL que te dio ngrok.)

### 5. Arrancar Expo y abrir en el móvil

```bash
cd frontend
npx expo start
```

Abre la app en Expo Go (QR o URL). El móvil llamará al backend a través de la URL de ngrok.

**Ventaja:** Funciona desde cualquier red. **Limitación:** La URL de ngrok cambia cada vez que reinicias ngrok (en plan gratuito); tendrás que actualizar `.env` y reiniciar Expo.

---

## Opción 3: Producción – Backend en aqualan.es

Backend desplegado en tu servidor **aqualan.es** (o en el mismo dominio bajo `/api`). La app y el móvil usan siempre la misma URL.

### Configuración

En **frontend/.env**:

```env
EXPO_PUBLIC_BACKEND_URL=https://aqualan.es
```

En el servidor debes tener Nginx con `location /api` apuntando al backend y el backend corriendo (uvicorn con systemd o similar). Detalles en **BACKEND_DEPLOY.md**.

**Ventaja:** Estable, para uso real. **Limitación:** Necesitas tener el servidor configurado y desplegado.

---

## Resumen rápido

| Opción        | Dónde corre el backend | EXPO_PUBLIC_BACKEND_URL      | Cuándo usarla              |
|---------------|-------------------------|------------------------------|----------------------------|
| 1. Misma WiFi | Tu PC (0.0.0.0:8000)    | `http://TU_IP:8000`           | Probar en casa con Expo Go |
| 2. ngrok      | Tu PC (túnel)           | `https://xxx.ngrok-free.app`  | Probar desde cualquier red |
| 3. Producción | Servidor aqualan.es     | `https://aqualan.es`         | App real para usuarios     |

---

## Script para Opción 1 (red local)

En la carpeta **backend** hay un script `run-para-movil.sh` que arranca uvicorn con `--host 0.0.0.0 --port 8000`. Ejecútalo y luego pon en frontend/.env la IP de tu PC como arriba.

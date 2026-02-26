# Cómo abrir AQUALAN en el móvil (Expo Go y descarga normal)

Tu proyecto ya está publicado en Expo con la cuenta **josu.mambrilla**:
- **Proyecto:** https://expo.dev/accounts/josu.mambrilla/projects/aqualan  
- **Última actualización:** rama `production` (Publicación inicial).

---

## 1. Abrir en Expo Go (probar en el teléfono)

**Expo Go** es la app de Expo para probar proyectos sin instalar un .ipa/.apk propio. La app AQUALAN se abre **dentro** de Expo Go.

### En el móvil (iPhone o Android)

1. **Instala Expo Go** desde la tienda:
   - **iPhone:** App Store → busca «Expo Go» → Instalar.
   - **Android:** Play Store → busca «Expo Go» → Instalar.

2. **Inicia sesión en Expo Go** con tu cuenta:
   - Abre Expo Go.
   - Toca **Profile** (o el icono de perfil) y **Sign in**.
   - Entra con el usuario **josu.mambrilla** (el mismo que en expo.dev).

3. **Abrir el proyecto AQUALAN:**
   - En la pantalla principal de Expo Go, toca **Projects** (o **Your projects**).
   - Deberías ver **AQUALAN**. Toca para abrirlo y se cargará la app.

   **Si no aparece en Projects:**  
   - Abre en el **navegador del móvil** la página del proyecto:  
     **https://expo.dev/accounts/josu.mambrilla/projects/aqualan**  
     y usa el botón **«Open in Expo Go»** si aparece.  
   - O abre esta página (genera QR y enlace para Expo Go):  
     **https://qr.expo.dev/eas-update?projectId=6963a6c9-151b-4a7d-8bc2-3cd0ed4cd202&runtimeVersion=1.0.0&channel=production**  
     Escanea el QR con la cámara (iPhone) o con Expo Go (Android) para abrir AQUALAN.

Con esto ya puedes usar AQUALAN en el teléfono como si fuera una app, pero dentro de Expo Go.

---

## 2. Descargar e instalar como app normal (fuera de Expo Go)

Si quieres un **instalable** (como si lo bajaras de la App Store / Play Store) para iPhone o Android:

### Android (archivo .apk para instalar)

1. En el ordenador, en la carpeta del proyecto:
   ```bash
   cd frontend
   npx eas build --platform android --profile preview --non-interactive
   ```
2. Cuando termine, en la consola (o en el enlace que te da EAS) aparecerá un **enlace para descargar el APK**.
3. En el **móvil Android:** abre ese enlace en el navegador, descarga el .apk e instálalo. Puede que tengas que permitir «Instalar desde fuentes desconocidas» para esa app o navegador.
4. La app **AQUALAN** quedará instalada como cualquier otra app (icono en la pantalla, sin abrir Expo Go).

### iPhone (app instalada en el dispositivo)

- Para instalar en un **iPhone real** (no simulador) hace falta **cuenta de Apple Developer** (de pago).
- Si la tienes:
  1. En el ordenador:
     ```bash
     cd frontend
     npx eas build --platform ios --profile preview --non-interactive
     ```
  2. Cuando termine, en el panel de EAS (expo.dev) podrás descargar el .ipa o usar **TestFlight** para instalarlo en el iPhone.
- Si **no** tienes cuenta de Apple Developer, en iPhone solo puedes usar la app **dentro de Expo Go** (paso 1).

---

## Resumen

| Qué quieres              | Cómo                          |
|--------------------------|--------------------------------|
| Probar en el móvil       | Instalar **Expo Go** → iniciar sesión **josu.mambrilla** → abrir proyecto **AQUALAN** (o desde el enlace del proyecto en expo.dev). |
| App instalable en Android| Ejecutar `eas build --platform android --profile preview` y usar el enlace de descarga del APK. |
| App instalable en iPhone | Necesitas cuenta Apple Developer; luego `eas build --platform ios --profile preview` y descarga/TestFlight. |

---

## Backend (API)

La app usa la URL del backend que configures en `frontend/.env` como `EXPO_PUBLIC_BACKEND_URL`.  
- Si está vacía, en desarrollo usa `http://localhost:8000`.  
- Para que funcione en el móvil (Expo Go o instalable), esa URL debe ser una **dirección pública** (por ejemplo la de tu API en un servidor o la URL de MongoDB Atlas / tu API si la tienes ahí). Puedes editar `frontend/.env` y volver a publicar con:

```bash
cd frontend
npx eas update --branch production --message "Config backend"
```

# Cómo probar y compartir la app AQUALAN

## Opción A: Probar en Expo Go (rápido, sin generar instalables)

Quien quiera probar solo tiene que instalar **Expo Go** desde la App Store (iPhone) o Play Store (Android) y abrir tu proyecto.

### 1. En tu Mac, desde la carpeta `frontend`:

```bash
cd frontend
npx expo start --tunnel
```

Si el puerto 8081 está ocupado, usa otro: `npx expo start --tunnel --port 8085`.

**Importante:** Ejecuta el comando en una terminal donde puedas ver la salida (Terminal de Cursor o Terminal del sistema). Ahí aparecerá el **código QR** y el **enlace** para abrir la app en Expo Go.

### 2. Compartir con otros

- Se mostrará un **código QR** y un **enlace** (tipo `exp://xxxx.eas.exp.direct` o similar).
- Envía el enlace o el QR por WhatsApp/email.
- La otra persona:
  - Instala **Expo Go** (App Store / Play Store).
  - En iPhone: abre la **cámara**, escanea el QR, o pega el enlace en Safari.
  - En Android: abre **Expo Go** y escanea el QR o pega el enlace.
- La app se cargará dentro de Expo Go (no es un .ipa/.apk instalado como “app propia”, pero sirve para probar).

**Importante:** Tu ordenador debe seguir con `npx expo start --tunnel` encendido mientras la gente prueba. Si lo cierras, dejarán de poder cargar la app.

---

## Opción B: App instalable (como si fuera de la store) con EAS Build

Así generas un **APK (Android)** y, si tienes cuenta de Apple, **instalable en iPhone**, para repartir el enlace o el archivo y que lo instalen como una app normal.

### Requisitos

1. **Cuenta de Expo** (ya la tienes): estar logueado con `npx expo login`.
2. **EAS CLI** (solo la primera vez):
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Para Android:** no hace falta cuenta de Google Play. EAS genera un APK y un enlace de descarga.
4. **Para iPhone (dispositivo real):** necesitas **cuenta de Apple Developer** (99 €/año). Sin ella solo puedes generar build para **simulador** en Mac.

### 1. URL del backend en builds

La app llama al backend. En el móvil no puede usar `localhost`. Tienes que indicar la URL real de tu API:

- Si ya tienes el backend en un servidor (ej. `https://api.aqualan.es`), dímelo y la ponemos en el build.
- Si aún no: puedes usar un túnel temporal (ej. ngrok) para probar, o dejamos la URL para cuando tengas el backend en producción.

En `eas.json` está un placeholder `EXPO_PUBLIC_BACKEND_URL`. Lo podemos cambiar antes del build o pasarlo por variable de entorno.

### 2. Generar build para Android (APK para compartir)

```bash
cd frontend
eas build --platform android --profile preview
```

- Te pedirá confirmar proyecto y permisos la primera vez.
- Al terminar, EAS te dará un **enlace para descargar el APK**.
- Puedes enviar ese enlace por WhatsApp/email; en Android instalan el APK y abren la app como cualquier otra.

### 3. Generar build para iPhone

**Si tienes Apple Developer:**

```bash
eas build --platform ios --profile preview
```

- Configuración de certificados y provisioning la puede hacer EAS (te preguntará).
- Al terminar tendrás un enlace para instalar en el iPhone (TestFlight o instalación interna, según cómo lo configures).

**Si no tienes Apple Developer:**

- Solo puedes generar build para **simulador iOS** (se usa en un Mac con Xcode):
  ```bash
  eas build --platform ios --profile preview
  ```
  y en `eas.json` en el perfil `preview` para `ios` puedes poner `"simulator": true` para que sea solo simulador.

### 4. Usuario/owner de Expo (opcional)

Si quieres que el proyecto aparezca bajo tu usuario de Expo al hacer `eas build`, en la raíz del proyecto (o en `app.json`) se puede poner `"owner": "tu-usuario-expo"`. Si me dices tu usuario de Expo, te indico dónde colocarlo.

---

## Resumen de lo que necesito de ti

Para dejarlo todo listo y decirte los comandos exactos:

1. **¿Tienes ya el backend en un servidor con URL pública?** (ej. `https://api.aqualan.es`)  
   - Si sí: dime la URL y la ponemos en el build.  
   - Si no: podemos dejar una URL de ejemplo y la cambias cuando tengas el servidor.

2. **¿Tienes cuenta de Apple Developer (99 €/año)?**  
   - Si sí: podrás generar un instalable para iPhone y compartirlo.  
   - Si no: en Android puedes repartir el APK sin problema; en iPhone solo simulador o que prueben con Expo Go.

3. **Tu usuario de Expo** (el que usas en expo.dev), si quieres que el proyecto quede bajo tu cuenta al hacer EAS Build.

Con eso te dejo los pasos finales (y si quieres, el `owner` en `app.json` y la URL del backend en `eas.json` ya puestos).

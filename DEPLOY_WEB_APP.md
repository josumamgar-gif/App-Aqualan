# Desplegar la app web en https://aqualan.es/app

La app ya está compilada para la ruta **/app**. Solo tienes que subir los archivos al servidor.

## 1. Archivos a subir

En tu Mac está la carpeta:

```
APLICACION-AQUALAN2.0/frontend/dist/
```

**Sube todo el contenido** de `dist/` al servidor en la carpeta que Nginx use para `/app`. Por ejemplo:

- **Ruta en el servidor:** `/var/www/aqualan-app/` (o la que tengas configurada)

Debe quedar así en el servidor:

```
/var/www/aqualan-app/index.html
/var/www/aqualan-app/favicon.ico
/var/www/aqualan-app/_expo/
/var/www/aqualan-app/(tabs)/
/var/www/aqualan-app/cart.html
/var/www/aqualan-app/contact.html
/var/www/aqualan-app/offer.html
/var/www/aqualan-app/orders.html
/var/www/aqualan-app/products.html
... (y el resto de archivos/carpetas de dist/)
```

## 2. Nginx para /app

En el `server { ... }` de **aqualan.es** debe estar algo así:

```nginx
location /app {
    alias /var/www/aqualan-app/;
    try_files $uri $uri/ /app/index.html;
}
```

Si usas `alias`, la barra final en `/var/www/aqualan-app/` es importante.

Recarga Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Comprobar

- Abre **https://aqualan.es/app** en el navegador.
- La app cargará y usará el backend en **https://aqualan.es/api** (categorías, productos, pedidos).

## 4. Volver a generar el build (cuando cambies código)

En tu Mac:

```bash
cd APLICACION-AQUALAN2.0/frontend
EXPO_PUBLIC_BACKEND_URL=https://aqualan.es npx expo export --platform web --clear
```

Luego sube de nuevo el contenido de `dist/` a `/var/www/aqualan-app/` (o tu ruta).

# Subir la app web a Raiola Networks (WordPress en aqualan.es)

Tu sitio está en **Raiola Networks**, con **WordPress** en el dominio principal. La app debe quedar en **https://aqualan.es/app**.

---

## 1. Dónde está WordPress en el servidor

En Raiola suele ser algo así:

- **Carpeta del sitio:** `public_html` o `www` o `web` (depende del panel).
- **Ruta típica:** `/home/tu_usuario/public_html` o similar.

En el panel de Raiola (cPanel, Plesk o el que uses) localiza la **carpeta raíz del dominio aqualan.es**.

---

## 2. Crear la carpeta `/app`

En esa carpeta raíz (donde está WordPress: `wp-admin`, `wp-content`, `index.php`…), crea una carpeta llamada **`app`**.

Quedará:

```
public_html/          ← raíz de aqualan.es
  wp-admin/
  wp-content/
  index.php
  ...
  app/                ← carpeta nueva
```

---

## 3. Subir los archivos de la app

En tu Mac tienes la app compilada en:

**`APLICACION-AQUALAN2.0/frontend/dist/`**

Sube **todo el contenido** de `dist/` dentro de la carpeta **`app`** del servidor (por FTP, SFTP o el gestor de archivos del panel).

Debe quedar así en el servidor:

```
public_html/app/
  index.html
  favicon.ico
  .htaccess
  _expo/
  (tabs)/
  cart.html
  contact.html
  offer.html
  orders.html
  products.html
  ... (resto de archivos y carpetas de dist/)
```

**Importante:** el archivo **`.htaccess`** debe estar dentro de `app/` (ya está en `dist/`); sirve para que las rutas como `/app/products` o `/app/cart` funcionen en WordPress/Apache.

---

## 4. Comprobar

- Abre **https://aqualan.es/app** (o **https://aqualan.es/app/**).
- Deberías ver la app AQUALAN y que use el backend en **https://aqualan.es/api**.

Si WordPress tiene una página o entrada con enlace “/app”, ese enlace debe apuntar a **https://aqualan.es/app** (o **/app**). No hace falta crear una página de WordPress para “app”; la app son solo archivos estáticos en la carpeta `app/`.

---

## 5. Si algo no carga (rutas o 404)

En Raiola suelen usar **Apache**. El `.htaccess` que está en `dist/` hace que las peticiones a rutas como `/app/products` que no sean un archivo real se sirvan con `index.html`.  
Si aun así ves 404:

- Comprueba que **`.htaccess`** está dentro de `public_html/app/`.
- En el panel de Raiola, revisa si hay opción de “Permitir .htaccess” o “Override” para ese dominio y que esté activada.

---

## 6. Resumen

| Dónde              | Qué hacer |
|--------------------|-----------|
| Raiola (carpeta raíz del dominio) | Crear carpeta `app` |
| Tu Mac `frontend/dist/`           | Subir todo su contenido dentro de `app/` |
| Navegador                          | Abrir **https://aqualan.es/app** |

La web principal (WordPress) sigue en **https://aqualan.es**; la app solo ocupa la ruta **/app**.

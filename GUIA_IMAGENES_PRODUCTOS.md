# Guía para cambiar las imágenes de los artículos

Puedes sustituir las imágenes de los productos **una a una** por tus propias fotos. Hay dos formas de hacerlo.

---

## Opción A: Usar tus imágenes en una carpeta del proyecto (recomendado)

### 1. Dónde poner las imágenes

- **Carpeta:** `backend/static/products/`
- **Nombre del archivo:** debe ser exactamente el **ID** del producto + extensión.
- **Formatos:** `.jpg`, `.jpeg` o `.png` (recomendado: JPG para fotos, ~400–800 px de ancho).

### 2. Tabla de productos e IDs (productos definitivos)

| # | Nombre del producto | Nombre del archivo de imagen |
|---|---------------------|-----------------------------|
| 1 | Botellón 19L San Andrés | `botellon-19-sanandres.jpg` |
| 2 | Botellón 12L San Andrés | `botellon-12-sanandres.jpg` |
| 3 | Ecobox 5L Alzola | `ecobox-5-alzola.jpg` |
| 4 | Ecobox 15L Alzola | `ecobox-15-alzola.jpg` |
| 5 | Botellín 0,33L San Andrés (24 ud) | `botellin-033-sanandres.jpg` |
| 6 | Botellín 0,5L San Andrés (24 ud) | `botellin-05-sanandres.jpg` |
| 7 | Botella 1,5L San Andrés (6 ud) | `botella-15-sanandres.jpg` |
| 8 | Dispensador Agua Fría/Caliente | `dispensador-fria-caliente.jpg` |
| 9 | Fuentes de Red | `fuentes-red.jpg` |
| 10 | Vasos Compostables 220ml 2000ud | `vasos-compostables-220-2000ud.jpg` |
| 11 | Vasos Plástico Transparente 1000ud | `vasos-plastico-1000ud.jpg` |
| 12 | Cafetera de Cápsulas Roja | `cafetera-capsulas-roja.jpg` |
| 13 | Cafetera de Cápsulas Negra | `cafetera-capsulas-negra.jpg` |
| 14 | Cápsulas Café Cremoso 50ud | `capsulas-cremoso-50ud.jpg` |
| 15 | Cápsulas Café Intenso 50ud | `capsulas-intenso-50ud.jpg` |
| 16 | Cápsulas Café Descafeinado 50ud | `capsulas-descafeinado-50ud.jpg` |
| 17 | Pack Azúcar + Paletinas | `pack-azucar-paletinas.jpg` |

### 3. Cambiar la imagen en el código (por cada producto)

Cada vez que añadas o cambies una imagen en `backend/static/products/`:

1. Abre el archivo **`backend/server.py`**.
2. Busca el producto por su **id** (por ejemplo `"id": "botellon-19-sanandres"`).
3. Sustituye la línea **`"image_url": "https://..."`** por la URL de tu imagen:

   - **En local (tu ordenador):**  
     `"image_url": "http://localhost:8000/static/products/botellon-19-sanandres.jpg"`
   - **En producción (tu servidor):**  
     Sustituye `localhost:8000` por tu dominio, por ejemplo:  
     `"image_url": "https://tudominio.com/static/products/botellon-19-sanandres.jpg"`

4. Guarda `server.py` y reinicia el backend si está en marcha.

**Ejemplo** – Botellón 19L:

```python
# Antes
"image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",

# Después (imagen tuya en backend/static/products/botellon-19-sanandres.jpg)
"image_url": "http://localhost:8000/static/products/botellon-19-sanandres.jpg",
```

Puedes ir haciendo lo mismo producto por producto: añades la foto con el nombre correcto en `backend/static/products/` y actualizas solo ese `image_url` en `server.py`.

---

## Opción B: Usar una URL externa

Si subes la imagen a tu web, a un almacenamiento en la nube o a una red social y obtienes un enlace directo a la imagen:

1. Abre **`backend/server.py`**.
2. Localiza el producto por su **id**.
3. Cambia **`"image_url"`** por la URL completa de la imagen, por ejemplo:  
   `"image_url": "https://tudominio.com/fotos/botellon-19.jpg"`

La URL debe ser directa a la imagen (que al abrirla en el navegador se vea solo la foto, no una página).

---

## Resumen rápido por producto (IDs para el archivo de imagen)

| ID del producto | Archivo en `backend/static/products/` |
|-----------------|---------------------------------------|
| `botellon-19-sanandres` | `botellon-19-sanandres.jpg` |
| `botellon-12-sanandres` | `botellon-12-sanandres.jpg` |
| `ecobox-5-alzola` | `ecobox-5-alzola.jpg` |
| `ecobox-15-alzola` | `ecobox-15-alzola.jpg` |
| `botellin-033-sanandres` | `botellin-033-sanandres.jpg` |
| `botellin-05-sanandres` | `botellin-05-sanandres.jpg` |
| `botella-15-sanandres` | `botella-15-sanandres.jpg` |
| `dispensador-fria-caliente` | `dispensador-fria-caliente.jpg` |
| `fuentes-red` | `fuentes-red.jpg` |
| `vasos-compostables-220-2000ud` | `vasos-compostables-220-2000ud.jpg` |
| `vasos-plastico-1000ud` | `vasos-plastico-1000ud.jpg` |
| `cafetera-capsulas-roja` | `cafetera-capsulas-roja.jpg` |
| `cafetera-capsulas-negra` | `cafetera-capsulas-negra.jpg` |
| `capsulas-cremoso-50ud` | `capsulas-cremoso-50ud.jpg` |
| `capsulas-intenso-50ud` | `capsulas-intenso-50ud.jpg` |
| `capsulas-descafeinado-50ud` | `capsulas-descafeinado-50ud.jpg` |
| `pack-azucar-paletinas` | `pack-azucar-paletinas.jpg` |

---

## Consejos

- **Tamaño:** imágenes de 400–800 px de ancho suelen verse bien y cargan rápido.
- **Nombre:** el nombre del archivo debe coincidir **exactamente** con el ID (minúsculas, guiones, sin espacios).
- **Un producto cada vez:** puedes cambiar solo uno, dejar el resto con la imagen actual y seguir después con los demás.

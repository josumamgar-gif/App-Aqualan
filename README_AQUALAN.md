# AQUALAN - Aplicación de Pedidos

## Descripción
Aplicación móvil de pedidos para Aqualan, distribuidora de agua embotellada del País Vasco. Basada en el diseño y productos de https://aqualan.es

## Características

### Frontend (Expo/React Native)
- **Pantalla de Inicio**: Hero con información del manantial de San Andrés, categorías de productos
- **Catálogo de Productos**: 6 categorías (Botellones, Ecobox, Botellines, Dispensadores, Vasos, Café)
- **Carrito de Compras**: Gestión completa con persistencia local
- **Sistema de Pedidos**: Formulario de checkout con zonas de entrega
- **Mis Pedidos**: Consulta de pedidos por email
- **Contacto**: Información de contacto, WhatsApp, Instagram, ubicación

### Backend (FastAPI + MongoDB)
- API REST completa
- Gestión de productos con categorías
- Sistema de pedidos
- Zonas de entrega (Bizkaia, Gipuzkoa, Álava, Cantabria, Navarra)

## Productos Incluidos

### Botellones
- Botellón 19L San Andrés - 6.50€
- Botellón 12L San Andrés - 4.50€

### Ecobox
- Ecobox 5L Alzola - 3.90€
- Ecobox 15L Alzola - 9.50€
- Adaptador Water Kit Vitop - 25.00€

### Botellines
- Botellín 0.33L Alzola - 0.60€
- Botellín 0.5L Alzola - 0.75€
- Botellín 0.5L San Andrés - 0.70€
- Botella 1.5L San Andrés - 0.95€

### Dispensadores
- Dispensador Agua Fría/Caliente - 150.00€
- Generador de Ozono - 45.00€

### Vasos
- Vasos Compostables 220ml (pack 100) - 8.50€
- Vasos Plástico Transparente 220ml (pack 100) - 5.50€
- Dispensador de Vasos - 15.00€

### Café
- Cafetera de Cápsulas Roja - 89.00€
- Cafetera de Cápsulas Negra - 89.00€
- Cápsulas Café Cremoso (caja 10) - 4.50€
- Cápsulas Café Intenso (caja 10) - 4.50€
- Cápsulas Café Descafeinado (caja 10) - 4.50€
- Pack Azúcar + Paletinas (pack 100) - 6.00€

## Estructura del Proyecto

```
app/
├── backend/
│   ├── server.py          # API FastAPI
│   ├── requirements.txt   # Dependencias Python
│   └── .env              # Variables de entorno
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx    # Layout de tabs
│   │   │   ├── index.tsx      # Pantalla de inicio
│   │   │   ├── products.tsx   # Catálogo de productos
│   │   │   ├── cart.tsx       # Carrito de compras
│   │   │   ├── orders.tsx     # Mis pedidos
│   │   │   └── contact.tsx    # Contacto
│   │   └── _layout.tsx        # Layout principal
│   ├── package.json
│   └── .env
└── README_AQUALAN.md
```

## Instalación

### Backend
```bash
cd backend
pip install -r requirements.txt
# Asegúrate de tener MongoDB ejecutándose
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## API Endpoints

### Productos
- `GET /api/products` - Lista todos los productos
- `GET /api/products?category=botellones` - Filtra por categoría
- `GET /api/products/{id}` - Obtiene un producto específico
- `GET /api/categories` - Lista todas las categorías

### Pedidos
- `POST /api/orders` - Crea un nuevo pedido
- `GET /api/orders?email=correo@ejemplo.com` - Lista pedidos por email
- `GET /api/orders/{id}` - Obtiene un pedido específico
- `PUT /api/orders/{id}/status` - Actualiza el estado del pedido

### Zonas de Entrega
- `GET /api/delivery-zones` - Lista las zonas de entrega disponibles

## Colores de la Marca
- Azul Principal: #0077B6
- Azul Claro: #00B4D8
- Azul Oscuro: #023E8A

## Contacto Aqualan
- Teléfono: 946 212 789
- WhatsApp: +34 669 335 093
- Email: info@aqualan.es
- Instagram: @_aqualan_
- Dirección: Erreka Bazterrak Kalea, 13, Urbi, 48970 Basauri, Bizkaia

## Zonas de Entrega
- Bizkaia
- Gipuzkoa
- Álava
- Cantabria
- Navarra

Entrega en 24/48 horas.

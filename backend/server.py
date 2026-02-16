from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper function for ObjectId
def str_to_objectid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")


# Define Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str  # botellones, ecobox, botellines, dispensadores, vasos, cafe
    subcategory: Optional[str] = None
    price: float
    unit: str  # unidad, pack, caja
    image_url: str
    capacity: Optional[str] = None  # 19L, 12L, 5L, etc.
    brand: Optional[str] = None  # San Andrés, Alzola
    available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CartItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    unit: str
    image_url: str


class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str
    delivery_zone: str  # Bizkaia, Gipuzkoa, Alava, Cantabria, Navarra
    items: List[CartItem]
    notes: Optional[str] = None


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str
    delivery_zone: str
    items: List[CartItem]
    notes: Optional[str] = None
    total: float
    status: str = "pendiente"  # pendiente, confirmado, en_camino, entregado, cancelado
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Seed initial products
async def seed_products():
    count = await db.products.count_documents({})
    if count == 0:
        products = [
            # Botellones
            {
                "id": str(uuid.uuid4()),
                "name": "Botellón 19L San Andrés",
                "description": "Botellón PET de 19 litros con asa incorporada. Agua mineral natural del manantial de San Andrés de León. Formato pesado con máximo contenido de agua.",
                "category": "botellones",
                "price": 6.50,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
                "capacity": "19L",
                "brand": "San Andrés",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Botellón 12L San Andrés",
                "description": "Botellón PET de 12 litros color azul. Formato cómodo con excelente manejabilidad gracias a su bajo peso. Agua del manantial de San Andrés.",
                "category": "botellones",
                "price": 4.50,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
                "capacity": "12L",
                "brand": "San Andrés",
                "available": True,
                "created_at": datetime.utcnow()
            },
            # Ecobox
            {
                "id": str(uuid.uuid4()),
                "name": "Ecobox 5L Alzola",
                "description": "Solución ecológica en formato bag in box sobremesa. Tamaño práctico de 5 litros para hidratarse en cualquier momento y lugar.",
                "category": "ecobox",
                "price": 3.90,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
                "capacity": "5L",
                "brand": "Alzola",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ecobox 15L Alzola",
                "description": "Formato bag in box ecológico que reduce el desperdicio de envases. Compatible con adaptadores Water Kit Vitop para coolers empresariales.",
                "category": "ecobox",
                "price": 9.50,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
                "capacity": "15L",
                "brand": "Alzola",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Adaptador Water Kit Vitop",
                "description": "Adaptador especial con bandeja para acoplar el ECOBOX a fuentes dispensadoras. Fácil instalación y reposición del envase.",
                "category": "ecobox",
                "subcategory": "accesorios",
                "price": 25.00,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            # Botellines
            {
                "id": str(uuid.uuid4()),
                "name": "Botellín 0.33L Alzola",
                "description": "Formato de 0,33L ideal para reuniones de empresa y detalles con clientes. Agua mineral Alzola Basque Water.",
                "category": "botellines",
                "price": 0.60,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
                "capacity": "0.33L",
                "brand": "Alzola",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Botellín 0.5L Alzola",
                "description": "Formato de 0,5L perfecto para reuniones y deporte. Agua mineral Alzola con formato adaptado.",
                "category": "botellines",
                "price": 0.75,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
                "capacity": "0.5L",
                "brand": "Alzola",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Botellín 0.5L San Andrés",
                "description": "Agua mineral San Andrés en formato 0,5L. Bajo sodio, excelente para deporte y reuniones.",
                "category": "botellines",
                "price": 0.70,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
                "capacity": "0.5L",
                "brand": "San Andrés",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Botella 1.5L San Andrés",
                "description": "Formato 1,5L ideal para desplazamientos y actividades prolongadas. Agua mineral San Andrés, baja en sodio.",
                "category": "botellines",
                "price": 0.95,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
                "capacity": "1.5L",
                "brand": "San Andrés",
                "available": True,
                "created_at": datetime.utcnow()
            },
            # Dispensadores
            {
                "id": str(uuid.uuid4()),
                "name": "Dispensador Agua Fría/Caliente",
                "description": "Dispensador de agua con función fría y caliente. Perfecto para oficinas y hogares. Incluye servicio de instalación.",
                "category": "dispensadores",
                "price": 150.00,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Generador de Ozono",
                "description": "Sistema de higienización para dispensadores. Elimina bacterias mediante reacción fotoquímica. Producto seguro y efectivo.",
                "category": "dispensadores",
                "subcategory": "higienizacion",
                "price": 45.00,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            # Vasos
            {
                "id": str(uuid.uuid4()),
                "name": "Vasos Compostables 220ml",
                "description": "Vasos 100% reciclables y compostables. Capacidad 220ml. Perfectos para infusiones, café y agua caliente. Pack de 100 unidades.",
                "category": "vasos",
                "price": 8.50,
                "unit": "pack 100",
                "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
                "capacity": "220ml",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Vasos Plástico Transparente 220ml",
                "description": "Vasos desechables transparentes. Capacidad 220ml. Pack de 100 unidades.",
                "category": "vasos",
                "price": 5.50,
                "unit": "pack 100",
                "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
                "capacity": "220ml",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Dispensador de Vasos",
                "description": "Accesorio dispensador de vasos. Se acopla al lateral del dispensador de agua mediante 2 tornillos incluidos.",
                "category": "vasos",
                "subcategory": "accesorios",
                "price": 15.00,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            # Café
            {
                "id": str(uuid.uuid4()),
                "name": "Cafetera de Cápsulas Roja",
                "description": "Cafetera de cápsulas funcional y sencilla. Color rojo. Perfecta para oficinas y hogares.",
                "category": "cafe",
                "price": 89.00,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cafetera de Cápsulas Negra",
                "description": "Cafetera de cápsulas funcional y sencilla. Color negro. Perfecta para oficinas y hogares.",
                "category": "cafe",
                "price": 89.00,
                "unit": "unidad",
                "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cápsulas Café Cremoso",
                "description": "Cápsulas de café con aroma cremoso. Caja de 10 cápsulas. Compatible con nuestras cafeteras.",
                "category": "cafe",
                "subcategory": "capsulas",
                "price": 4.50,
                "unit": "caja 10",
                "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cápsulas Café Intenso",
                "description": "Cápsulas de café con aroma intenso. Caja de 10 cápsulas. Compatible con nuestras cafeteras.",
                "category": "cafe",
                "subcategory": "capsulas",
                "price": 4.50,
                "unit": "caja 10",
                "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cápsulas Café Descafeinado",
                "description": "Cápsulas de café descafeinado. Caja de 10 cápsulas. Compatible con nuestras cafeteras.",
                "category": "cafe",
                "subcategory": "capsulas",
                "price": 4.50,
                "unit": "caja 10",
                "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pack Azúcar + Paletinas",
                "description": "Pack de 100 unidades de azúcar con paletinas. Complemento perfecto para tu café.",
                "category": "cafe",
                "subcategory": "accesorios",
                "price": 6.00,
                "unit": "pack 100",
                "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
                "available": True,
                "created_at": datetime.utcnow()
            }
        ]
        await db.products.insert_many(products)
        logger.info(f"Seeded {len(products)} products")


# Routes
@api_router.get("/")
async def root():
    return {"message": "Aqualan API - Sistema de Pedidos"}


# Products endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, brand: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if brand:
        query["brand"] = brand
    
    products = await db.products.find(query).to_list(100)
    return [Product(**p) for p in products]


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return Product(**product)


@api_router.get("/categories")
async def get_categories():
    categories = [
        {"id": "botellones", "name": "Botellones", "description": "Botellones de 12L y 19L", "icon": "water"},
        {"id": "ecobox", "name": "Ecobox", "description": "Formato bag in box ecológico", "icon": "leaf"},
        {"id": "botellines", "name": "Botellines", "description": "Botellas de 0.33L a 1.5L", "icon": "flask"},
        {"id": "dispensadores", "name": "Dispensadores", "description": "Dispensadores de agua fría/caliente", "icon": "beaker"},
        {"id": "vasos", "name": "Vasos", "description": "Vasos plásticos y compostables", "icon": "cup"},
        {"id": "cafe", "name": "Café", "description": "Cafeteras y cápsulas", "icon": "cafe"}
    ]
    return categories


# Orders endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Calculate total
    total = sum(item.price * item.quantity for item in order_data.items)
    
    # Create order
    order = Order(
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        delivery_address=order_data.delivery_address,
        delivery_zone=order_data.delivery_zone,
        items=order_data.items,
        notes=order_data.notes,
        total=total
    )
    
    await db.orders.insert_one(order.dict())
    return order


@api_router.get("/orders", response_model=List[Order])
async def get_orders(email: Optional[str] = None):
    query = {}
    if email:
        query["customer_email"] = email
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    return [Order(**o) for o in orders]


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return Order(**order)


@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid_statuses = ["pendiente", "confirmado", "en_camino", "entregado", "cancelado"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {valid_statuses}")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    return {"message": "Estado actualizado", "status": status}


@api_router.get("/delivery-zones")
async def get_delivery_zones():
    zones = [
        {"id": "bizkaia", "name": "Bizkaia"},
        {"id": "gipuzkoa", "name": "Gipuzkoa"},
        {"id": "alava", "name": "Álava"},
        {"id": "cantabria", "name": "Cantabria"},
        {"id": "navarra", "name": "Navarra"}
    ]
    return zones


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    await seed_products()
    logger.info("Application started and products seeded")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

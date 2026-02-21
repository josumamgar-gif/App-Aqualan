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
from datetime import datetime, timedelta
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Email configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'mail.aqualan.es')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_TO = 'pedidos@aqualan.es'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Rutas de entrega - Días de reparto por localidad
# 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes
DELIVERY_ROUTES = {
    # BILBAO - Lunes, Miércoles, Viernes
    "bilbao": [0, 2, 4],
    "bilbao-begoña": [0, 2, 4],
    "bilbao-santutxu": [2],
    "bilbao-deusto": [2],
    "bilbao-casco viejo": [0],
    "bilbao-txurdinaga": [0, 2, 4],
    "basurtu-zorrotza": [0, 2, 4],
    
    # ZAMUDIO-SONDIKA-DERIO-LARRABETZU-LOIU - Lunes
    "zamudio": [0],
    "sondika": [0],
    "derio": [0],
    "larrabetzu": [0],
    "loiu": [0],
    
    # BASAURI-GALDAKAO-ARTEA-IGORRE - Martes
    "basauri": [1],
    "san miguel de basauri": [1],
    "galdakao": [1],
    "artea": [1],
    "igorre": [1],
    "lemoa": [1],
    "lemoa-lemona": [1],
    "dima": [1],
    
    # ELGOIBAR-EIBAR-ERMUA-BERGARA-MONDRAGON - Lunes
    "elgoibar": [0],
    "eibar": [0],
    "ermua": [0],
    "bergara": [0],
    "mondragon": [0],
    "arrasate": [0],
    "elgeta": [0],
    "oñati": [0],
    "aretxabaleta": [0],
    "mendaro": [0],
    "mallabia": [0],
    "zaldibar": [0],
    "elorrio": [0],
    
    # BERMEO-GERNIKA-ISPASTER-LEKEITIO-BUSTURIA - Miércoles
    "bermeo": [2],
    "gernika": [2],
    "ispaster": [2],
    "lekeitio": [2],
    "busturia": [2],
    
    # ASUA-ERANDIO - Martes
    "asua": [1],
    "erandio": [1],
    "asua-erandio": [1],
    "astrabudua": [1],
    
    # DURANGO-AMOREBIETA - Martes
    "durango": [1],
    "amorebieta": [1],
    "amorebieta-etxano": [1],
    "berriz": [1],
    "abadiño": [1],
    "iurreta": [1],
    
    # ZIERBENA-SANTURTZI-ORTUELLA-CASTRO - Martes
    "zierbena": [1],
    "santurtzi": [1],
    "ortuella": [1],
    "castro urdiales": [1],
    "castro-urdiales": [1],
    "muskiz": [1],
    "gallarta": [1],
    
    # BALMASEDA-MEDINA DE POMAR - Jueves
    "balmaseda": [3],
    "medina de pomar": [3],
    "villasana de mena": [3],
    "zalla": [3],
    "gordexola": [3],
    "orduña": [3],
    
    # GETXO-LEIOA - Miércoles
    "getxo": [2],
    "leioa": [2],
    "algorta": [2],
    "las arenas-getxo": [2],
    "andra mari-getxo": [2],
    "berango": [2],
    
    # AMURRIO-VITORIA - Viernes
    "amurrio": [4],
    "vitoria": [4],
    "vitoria-gasteiz": [4],
    "vitoria gasteiz": [4],
    "logroño": [4],
    "laudio-llodio": [4],
    "legutio": [4],
    "legutiano": [4],
    "nanclares de oca": [4],
    "alegria-dulantzi": [4],
    
    # SOPELANA-URDULIZ-PLENTZIA-MUNGIA - Miércoles
    "sopelana": [2],
    "sopela": [2],
    "urduliz": [2],
    "plentzia": [2],
    "mungia": [2],
    "gorliz": [2],
    
    # ETXEBARRI-ARRIGORRIAGA-ZARATAMO - Jueves
    "etxebarri": [3],
    "arrigorriaga": [3],
    "zaratamo": [3],
    "ugao-miraballes": [3],
    "orozko": [3],
    
    # BARAKALDO-PORTUGALETE - Jueves
    "barakaldo": [3],
    "portugalete": [3],
    "sestao": [3],
    "trapaga": [3],
    "alonsotegi": [3],
    
    # CANTABRIA - Martes
    "santander": [1],
    "laredo": [1],
    "colindres": [1],
    "limpias": [1],
    "noja": [4],
    "suances": [1],
    "camargo": [1],
    "cicero": [1],
    "treto": [1],
    
    # DONOSTIALDEA - Jueves
    "hernani": [3],
    "donostia": [3],
    "donostia-san sebastian": [3],
    "andoain": [3],
    "lasarte-oria": [3],
    "lasarte oria": [3],
    "urnieta": [3],
    "oiartzun": [3],
    "errenteria": [3],
    "pasaia": [3],
    "lezo": [3],
    "irun": [3],
    "tolosa": [3],
    "azkoitia": [3],
    "azpeitia": [3],
    "zarautz": [3],
    "zumaia": [3],
}

DAY_NAMES = {
    0: "Lunes",
    1: "Martes", 
    2: "Miércoles",
    3: "Jueves",
    4: "Viernes"
}


def get_next_delivery_date(city: str) -> dict:
    """Calcula la próxima fecha de entrega basada en la ciudad"""
    city_lower = city.lower().strip()
    
    # Buscar la ciudad en las rutas
    delivery_days = None
    for route_city, days in DELIVERY_ROUTES.items():
        if route_city in city_lower or city_lower in route_city:
            delivery_days = days
            break
    
    # Si no se encuentra, buscar coincidencia parcial
    if delivery_days is None:
        for route_city, days in DELIVERY_ROUTES.items():
            if any(word in city_lower for word in route_city.split('-')) or \
               any(word in route_city for word in city_lower.split()):
                delivery_days = days
                break
    
    # Si aún no se encuentra, devolver mensaje genérico
    if delivery_days is None:
        return {
            "found": False,
            "message": "Te contactaremos para confirmar la fecha de entrega",
            "date": None,
            "day_name": None
        }
    
    # Calcular próxima fecha de entrega
    today = datetime.now()
    current_weekday = today.weekday()
    current_hour = today.hour
    
    # Buscar el próximo día de reparto
    days_to_add = None
    for day in delivery_days:
        if day > current_weekday:
            days_to_add = day - current_weekday
            break
        elif day == current_weekday and current_hour < 10:  # Si es hoy antes de las 10am
            days_to_add = 0
            break
    
    # Si no hay día esta semana, buscar el primer día de la próxima semana
    if days_to_add is None:
        days_to_add = (7 - current_weekday) + delivery_days[0]
    
    delivery_date = today + timedelta(days=days_to_add)
    
    return {
        "found": True,
        "message": f"Tu pedido llegará el {DAY_NAMES[delivery_date.weekday()]} {delivery_date.strftime('%d/%m/%Y')}",
        "date": delivery_date.strftime('%Y-%m-%d'),
        "day_name": DAY_NAMES[delivery_date.weekday()]
    }


# Define Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    subcategory: Optional[str] = None
    unit: str
    image_url: str
    capacity: Optional[str] = None
    brand: Optional[str] = None
    available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CartItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit: str
    image_url: str


class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str
    delivery_city: str
    items: List[CartItem]
    notes: Optional[str] = None


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str
    delivery_city: Optional[str] = None
    delivery_zone: Optional[str] = None  # Para compatibilidad con pedidos antiguos
    items: List[CartItem]
    notes: Optional[str] = None
    status: str = "pendiente"
    delivery_date: Optional[str] = None
    delivery_day: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


async def send_order_email(order: Order, delivery_info: dict, to_customer: bool = False):
    """Envía email con los detalles del pedido"""
    try:
        # Crear el contenido del email
        items_html = ""
        for item in order.items:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.product_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.unit}</td>
            </tr>
            """
        
        delivery_message = delivery_info.get('message', 'Fecha por confirmar')
        
        if to_customer:
            # Email para el cliente
            header_text = "Confirmación de Pedido"
            intro_text = f"<p>Hola <strong>{order.customer_name}</strong>,</p><p>Hemos recibido tu pedido correctamente. Aquí tienes los detalles:</p>"
            footer_text = "<p>Gracias por confiar en AQUALAN. Si tienes alguna duda, contacta con nosotros en info@aqualan.es o al 946 212 789.</p>"
        else:
            # Email para la empresa
            header_text = "Nuevo Pedido Recibido"
            intro_text = ""
            footer_text = "<p>Este email fue generado automáticamente desde la App de Pedidos de AQUALAN</p>"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #0077B6; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">AQUALAN</h1>
                <p style="margin: 5px 0 0 0;">{header_text}</p>
            </div>
            
            <div style="padding: 20px;">
                {intro_text}
                <h2 style="color: #0077B6;">Pedido #{order.id[:8].upper()}</h2>
                <p><strong>Fecha:</strong> {order.created_at.strftime('%d/%m/%Y %H:%M')}</p>
                
                <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #023E8A; margin-top: 0;">📅 Fecha de Entrega</h3>
                    <p style="font-size: 18px; font-weight: bold; color: #0077B6;">{delivery_message}</p>
                </div>
                
                <h3 style="color: #023E8A;">👤 Datos de Entrega</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 5px;"><strong>Nombre:</strong></td><td>{order.customer_name}</td></tr>
                    <tr><td style="padding: 5px;"><strong>Email:</strong></td><td>{order.customer_email}</td></tr>
                    <tr><td style="padding: 5px;"><strong>Teléfono:</strong></td><td>{order.customer_phone}</td></tr>
                    <tr><td style="padding: 5px;"><strong>Ciudad:</strong></td><td>{order.delivery_city}</td></tr>
                    <tr><td style="padding: 5px;"><strong>Dirección:</strong></td><td>{order.delivery_address}</td></tr>
                </table>
                
                <h3 style="color: #023E8A;">📦 Productos Solicitados</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: #f9f9f9;">
                    <thead>
                        <tr style="background-color: #0077B6; color: white;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px; text-align: center;">Cantidad</th>
                            <th style="padding: 10px; text-align: left;">Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                {f'<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px;"><h4 style="margin-top: 0;">📝 Notas:</h4><p>{order.notes}</p></div>' if order.notes else ''}
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                {footer_text}
            </div>
        </body>
        </html>
        """
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        if to_customer:
            msg['Subject'] = f'✅ Confirmación de Pedido #{order.id[:8].upper()} - AQUALAN'
            msg['To'] = order.customer_email
        else:
            msg['Subject'] = f'🚰 Nuevo Pedido #{order.id[:8].upper()} - {order.customer_name}'
            msg['To'] = EMAIL_TO
        msg['From'] = SMTP_USER if SMTP_USER else 'pedidos@aqualan.es'
        
        # Versión texto plano
        text_content = f"""
        NUEVO PEDIDO AQUALAN
        ====================
        
        Pedido: #{order.id[:8].upper()}
        Fecha: {order.created_at.strftime('%d/%m/%Y %H:%M')}
        
        FECHA DE ENTREGA: {delivery_message}
        
        DATOS DEL CLIENTE:
        - Nombre: {order.customer_name}
        - Email: {order.customer_email}
        - Teléfono: {order.customer_phone}
        - Ciudad: {order.delivery_city}
        - Dirección: {order.delivery_address}
        
        PRODUCTOS:
        """
        for item in order.items:
            text_content += f"- {item.quantity}x {item.product_name} ({item.unit})\n"
        
        if order.notes:
            text_content += f"\nNOTAS: {order.notes}"
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        # Enviar email
        if SMTP_USER and SMTP_PASSWORD:
            # Usar SSL para puerto 465
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Email enviado correctamente para pedido {order.id}")
            return True
        else:
            logger.warning("Credenciales SMTP no configuradas. Email no enviado.")
            return False
            
    except Exception as e:
        logger.error(f"Error enviando email: {str(e)}")
        return False


# Seed initial products (sin precios)
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


# Delivery date endpoint
@api_router.get("/delivery-date")
async def get_delivery_date(city: str):
    """Calcula la fecha de entrega basada en la ciudad"""
    return get_next_delivery_date(city)


# Orders endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Calcular fecha de entrega
    delivery_info = get_next_delivery_date(order_data.delivery_city)
    
    # Create order
    order = Order(
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        delivery_address=order_data.delivery_address,
        delivery_city=order_data.delivery_city,
        items=order_data.items,
        notes=order_data.notes,
        delivery_date=delivery_info.get('date'),
        delivery_day=delivery_info.get('day_name')
    )
    
    await db.orders.insert_one(order.dict())
    
    # Enviar email a la empresa
    await send_order_email(order, delivery_info, to_customer=False)
    
    # Enviar email de confirmación al cliente
    await send_order_email(order, delivery_info, to_customer=True)
    
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

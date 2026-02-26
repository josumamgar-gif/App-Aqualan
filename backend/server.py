from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, date
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

try:
    import resend
except ImportError:
    resend = None


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection (tolerante a fallos: si falla o URL con placeholder, db=None y se usan productos en memoria)
client = None
db = None
try:
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    if '<db_password>' in (mongo_url or ''):
        mongo_url = None  # placeholder de Atlas → no conectar
    # No conectar nunca a localhost en producción (Render/Railway no tienen MongoDB local)
    if not mongo_url or mongo_url.strip() == 'mongodb://localhost:27017':
        logging.warning("MONGO_URL no configurada o es localhost. Configura MONGO_URL con tu cadena de MongoDB Atlas. Productos y pedidos en memoria.")
    else:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[os.environ.get('DB_NAME', 'test_database')]
except Exception as e:
    logging.warning(f"MongoDB no disponible: {e}. Se usarán productos en memoria.")

# Email configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'mail.aqualan.es')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_TO = 'pedidos@aqualan.es'
# Resend.com API (recomendado en Render plan gratis: SMTP está bloqueado)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
EMAIL_FROM_RESEND = os.environ.get('EMAIL_FROM', 'AQUALAN <onboarding@resend.dev>')

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

# Referencia: 23 feb 2026 = lunes = primera semana tipo "Semana 2". Ciclo cada 14 días.
REFERENCE_MONDAY = date(2026, 2, 23)
# Rutas cada 14 días: ciudad normalizada -> {"semana": 1|2, "days": [0,1,2,3,4]}
# Fallback: rutas que en el Excel son CADA 14 DIAS / SEMANA 2 (ej. Leioa, Getxo) por defecto Semana 2, miércoles
ROUTES_14_DAYS: dict = {
    "leioa": {"semana": 2, "days": [2]},
    "getxo": {"semana": 2, "days": [2]},
    "berango": {"semana": 2, "days": [2]},
    "algorta": {"semana": 2, "days": [2]},
    "las arenas-getxo": {"semana": 2, "days": [2]},
    "andra mari-getxo": {"semana": 2, "days": [2]},
    "sopelana": {"semana": 2, "days": [2]},
    "sopela": {"semana": 2, "days": [2]},
    "urduliz": {"semana": 2, "days": [2]},
    "plentzia": {"semana": 2, "days": [2]},
    "mungia": {"semana": 2, "days": [2]},
    "gorliz": {"semana": 2, "days": [2]},
    "bermeo": {"semana": 2, "days": [2]},
    "gernika": {"semana": 2, "days": [2]},
    "ispaster": {"semana": 2, "days": [2]},
    "lekeitio": {"semana": 2, "days": [2]},
    "busturia": {"semana": 2, "days": [2]},
    "balmaseda": {"semana": 2, "days": [3]},
    "medina de pomar": {"semana": 2, "days": [3]},
    "villasana de mena": {"semana": 2, "days": [3]},
    "zalla": {"semana": 2, "days": [3]},
    "gordexola": {"semana": 2, "days": [3]},
    "orduña": {"semana": 2, "days": [3]},
    "etxebarri": {"semana": 2, "days": [3]},
    "arrigorriaga": {"semana": 2, "days": [3]},
    "zaratamo": {"semana": 2, "days": [3]},
    "ugao-miraballes": {"semana": 2, "days": [3]},
    "orozko": {"semana": 2, "days": [3]},
    "barakaldo": {"semana": 2, "days": [3]},
    "portugalete": {"semana": 2, "days": [3]},
    "sestao": {"semana": 2, "days": [3]},
    "trapaga": {"semana": 2, "days": [3]},
    "alonsotegi": {"semana": 2, "days": [3]},
}


def _current_semana(d: date) -> int:
    """Devuelve 2 si la semana de d es Semana 2, 1 si es Semana 1 (ciclo 14 días desde REFERENCE_MONDAY)."""
    monday = d - timedelta(days=d.weekday())
    weeks_since_ref = (monday - REFERENCE_MONDAY).days // 7
    return 2 if weeks_since_ref % 2 == 0 else 1


def _load_routes_from_excel() -> None:
    """Carga rutas con SEMANA 1 / SEMANA 2 y días desde rutas.xlsx (columnas L-V y periodicidad)."""
    global ROUTES_14_DAYS
    xlsx_path = ROOT_DIR.parent / "rutas.xlsx"
    if not xlsx_path.exists():
        return
    try:
        import pandas as pd
        df = pd.read_excel(xlsx_path, engine="openpyxl", header=0)
        city_col = "Clientes asignados/Ciudad"
        day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
        period_col = None
        for c in df.columns:
            s = df[c].dropna().astype(str)
            if s.str.contains("SEMANA 1|SEMANA 2", regex=True, case=False).any():
                period_col = c
                break
        if period_col is None or city_col not in df.columns:
            return
        current_days = None
        for _, row in df.iterrows():
            city = row.get(city_col)
            if pd.isna(city) or not isinstance(city, str) or not str(city).strip():
                continue
            period = row.get(period_col)
            if pd.isna(period):
                period = ""
            period_str = str(period).strip().upper()
            days_row = []
            for dc in day_names:
                if dc not in df.columns:
                    continue
                v = row.get(dc)
                if v is True or (isinstance(v, (int, float)) and not pd.isna(v) and int(v) == 1):
                    days_row.append(True)
                else:
                    days_row.append(False)
            if len(days_row) == 5 and any(days_row):
                current_days = [i for i in range(5) if days_row[i]]
            if "SEMANA 1" in period_str or "SEMANA 2" in period_str:
                semana = 1 if "SEMANA 1" in period_str else 2
                if current_days:
                    key = str(city).lower().strip()
                    ROUTES_14_DAYS[key] = {"semana": semana, "days": current_days}
    except Exception as e:
        logging.warning("No se pudo cargar rutas.xlsx para SEMANA 1/2: %s", e)


def _next_delivery_14_days(route_semana: int, delivery_weekdays: List[int], today: date) -> date:
    """
    Próxima fecha de entrega para ruta cada 14 días.
    Norma: si estamos en la misma semana (Semana 1 o 2) y hoy es el día de reparto o antes (o al día siguiente),
    entrega = ese día de esta semana. Si no, entrega = ese día en la próxima vez que toque esa semana.
    Ej.: Semana 2 = Leioa, miércoles. Pedido hoy 25 (mié) o mañana 26 (jue) -> entrega 25. Pedido el 26 (jue) "más adelante" -> próximo mié Semana 2 = 11 mar.
    """
    first_weekday = min(delivery_weekdays)
    cur_semana = _current_semana(today)
    today_weekday = today.weekday()
    # Lunes de esta semana
    this_monday = today - timedelta(days=today_weekday)

    if route_semana == cur_semana:
        # Mismo tipo de semana: si pedido hoy (mié) o antes (lun, mar) → entrega este mié; si pedido el jueves o después → próximo mié de Semana 2
        if today_weekday <= first_weekday:
            delivery = this_monday + timedelta(days=first_weekday)
            return delivery
        # Jueves o más tarde en la semana → próximo ciclo (ej. 11 mar)
        next_semana_monday = this_monday + timedelta(days=14)
    else:
        # Estamos en la otra semana: próximo día de reparto es la próxima vez que toque route_semana
        next_semana_monday = this_monday + timedelta(days=7)

    return next_semana_monday + timedelta(days=first_weekday)


def get_next_delivery_date(city: str) -> dict:
    """Calcula la próxima fecha de entrega basada en la ciudad (rutas 7 días o 14 días con Semana 1/2)."""
    city_lower = city.lower().strip()
    today = datetime.now().date()

    # 1) Rutas cada 14 días (SEMANA 1 / SEMANA 2 desde Excel o fallback)
    for route_city, info in ROUTES_14_DAYS.items():
        if route_city in city_lower or city_lower in route_city:
            delivery_date = _next_delivery_14_days(
                info["semana"], info["days"], today
            )
            return {
                "found": True,
                "message": f"Tu pedido llegará el {DAY_NAMES[delivery_date.weekday()]} {delivery_date.strftime('%d/%m/%Y')}",
                "date": delivery_date.strftime('%Y-%m-%d'),
                "day_name": DAY_NAMES[delivery_date.weekday()],
            }
    # Coincidencia parcial para 14 días
    for route_city, info in ROUTES_14_DAYS.items():
        if any(word in city_lower for word in route_city.split("-")) or \
           any(word in route_city for word in city_lower.split()):
            delivery_date = _next_delivery_14_days(
                info["semana"], info["days"], today
            )
            return {
                "found": True,
                "message": f"Tu pedido llegará el {DAY_NAMES[delivery_date.weekday()]} {delivery_date.strftime('%d/%m/%Y')}",
                "date": delivery_date.strftime('%Y-%m-%d'),
                "day_name": DAY_NAMES[delivery_date.weekday()],
            }

    # 2) Rutas cada 7 días (lógica actual)
    delivery_days = None
    for route_city, days in DELIVERY_ROUTES.items():
        if route_city in city_lower or city_lower in route_city:
            delivery_days = days
            break
    if delivery_days is None:
        for route_city, days in DELIVERY_ROUTES.items():
            if any(word in city_lower for word in route_city.split('-')) or \
               any(word in route_city for word in city_lower.split()):
                delivery_days = days
                break

    if delivery_days is None:
        return {
            "found": False,
            "message": "Te contactaremos para confirmar la fecha de entrega",
            "date": None,
            "day_name": None
        }

    current_weekday = today.weekday()
    current_hour = datetime.now().hour
    days_to_add = None
    for day in delivery_days:
        if day > current_weekday:
            days_to_add = day - current_weekday
            break
        elif day == current_weekday and current_hour < 10:
            days_to_add = 0
            break
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


EMAIL_INFO = "info@aqualan.es"


class OfferRequestForm(BaseModel):
    empresa: str
    nombre: str
    telefono: str
    email: str
    ubicacion: str  # provincia: bizkaia, gipuzkoa, alava, cantabria, navarra, otra
    otra_provincia: Optional[str] = None
    ciudad: str
    productos: List[str]  # ["botellones", "ecobox", ...]
    mensaje: Optional[str] = None


def _send_email_resend(to: str, subject: str, html: str, from_email: Optional[str] = None) -> bool:
    """Envía un email usando la API de Resend (HTTPS). Funciona en Render/Railway."""
    if not RESEND_API_KEY or not resend:
        return False
    try:
        resend.api_key = RESEND_API_KEY
        params = {
            "from": from_email or EMAIL_FROM_RESEND,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.exception("Resend send failed: %s", e)
        return False


def _send_offer_request_email(data: OfferRequestForm) -> bool:
    """Envía a info@aqualan.es la solicitud de oferta con formato claro."""
    provincia_display = data.otra_provincia.strip() if data.ubicacion == "otra" and data.otra_provincia else data.ubicacion.replace("-", " ").title()
    productos_labels = {
        "botellones": "Botellones 19L/11L",
        "ecobox": "Ecobox (15L/5L)",
        "botellines": "Botellines",
        "dispensador": "Dispensador Frío/Caliente",
        "fuentes-red": "Fuente de Red",
        "cafe": "Café en Cápsulas",
        "vasos": "Vasos Compostables",
    }
    productos_html = "".join(
        f"<li>{productos_labels.get(p, p)}</li>" for p in data.productos
    )
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0077B6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">AQUALAN</h1>
            <p style="margin: 5px 0 0 0;">Solicitud de oferta personalizada</p>
        </div>
        <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">Se ha recibido una nueva solicitud de oferta desde la app.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr style="background-color: #f0f7fc;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Empresa</strong></td><td style="padding: 10px; border: 1px solid #ddd;">{data.empresa}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Nombre</strong></td><td style="padding: 10px; border: 1px solid #ddd;">{data.nombre}</td></tr>
                <tr style="background-color: #f0f7fc;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Teléfono</strong></td><td style="padding: 10px; border: 1px solid #ddd;">{data.telefono}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 10px; border: 1px solid #ddd;">{data.email}</td></tr>
                <tr style="background-color: #f0f7fc;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>Provincia</strong></td><td style="padding: 10px; border: 1px solid #ddd;">{provincia_display}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Ciudad</strong></td><td style="padding: 10px; border: 1px solid #ddd;">{data.ciudad}</td></tr>
            </table>
            <h3 style="color: #023E8A; margin-top: 20px;">Productos de interés</h3>
            <ul style="color: #333;">{productos_html}</ul>
            {f'<div style="margin-top: 16px; padding: 12px; background-color: #f9f9f9; border-radius: 8px;"><strong>Mensaje:</strong><p style="margin: 8px 0 0 0;">{data.mensaje}</p></div>' if data.mensaje and data.mensaje.strip() else ''}
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            Solicitud recibida el {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} (UTC). Responder a {data.email}.
        </div>
    </body>
    </html>
    """
    subject = f'Oferta solicitada: {data.empresa} - {data.nombre}'
    if RESEND_API_KEY:
        if _send_email_resend(EMAIL_INFO, subject, html_content):
            logger.info("Email de oferta enviado via Resend: %s - %s", data.empresa, data.email)
            return True
        return False
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['To'] = EMAIL_INFO
    msg['From'] = SMTP_USER if SMTP_USER else 'pedidos@aqualan.es'
    msg.attach(MIMEText(html_content, 'html'))
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.info("Oferta solicitada (SMTP no configurado): %s - %s - %s", data.empresa, data.nombre, data.email)
        return True
    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        logger.info("Email de oferta enviado correctamente: %s - %s", data.empresa, data.email)
        return True
    except Exception as e:
        logger.exception("Error enviando email de oferta: %s", e)
        return False


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
        
        # Enviar email (SMTP es bloqueante, lo ejecutamos en thread)
        if SMTP_USER and SMTP_PASSWORD:
            def _do_send():
                if SMTP_PORT == 465:
                    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)
                else:
                    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
                        server.starttls()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)

            await asyncio.to_thread(_do_send)
            logger.info(f"Email enviado correctamente para pedido {order.id} (to_customer={to_customer})")
            return True
        else:
            logger.warning("Credenciales SMTP no configuradas (SMTP_USER/SMTP_PASSWORD). Email no enviado.")
            return False

    except Exception as e:
        logger.exception(f"Error enviando email: {e}")
        return False


def _send_order_email_sync(order: Order, delivery_info: dict, to_customer: bool) -> None:
    """Envía el email del pedido. Usa Resend si RESEND_API_KEY está definido, si no SMTP."""
    if not RESEND_API_KEY and not (SMTP_USER and SMTP_PASSWORD):
        logger.warning("Email de pedido: ni RESEND_API_KEY ni SMTP configurados.")
        return
    try:
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
            header_text = "Confirmación de Pedido"
            intro_text = f"<p>Hola <strong>{order.customer_name}</strong>,</p><p>Hemos recibido tu pedido correctamente. Aquí tienes los detalles:</p>"
            footer_text = "<p>Gracias por confiar en AQUALAN. Si tienes alguna duda, contacta con nosotros en info@aqualan.es o al 946 212 789.</p>"
        else:
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
                    <tbody>{items_html}</tbody>
                </table>
                {f'<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px;"><h4 style="margin-top: 0;">📝 Notas:</h4><p>{order.notes}</p></div>' if order.notes else ''}
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">{footer_text}</div>
        </body>
        </html>
        """
        if RESEND_API_KEY:
            if to_customer:
                subject = f'✅ Confirmación de Pedido #{order.id[:8].upper()} - AQUALAN'
                to_email = order.customer_email
            else:
                subject = f'🚰 Nuevo Pedido #{order.id[:8].upper()} - {order.customer_name}'
                to_email = EMAIL_TO
            if _send_email_resend(to_email, subject, html_content):
                logger.info("Email de pedido enviado via Resend: %s (to_customer=%s)", order.id, to_customer)
            else:
                raise RuntimeError("Resend falló")
            return
        msg = MIMEMultipart('alternative')
        if to_customer:
            msg['Subject'] = f'✅ Confirmación de Pedido #{order.id[:8].upper()} - AQUALAN'
            msg['To'] = order.customer_email
        else:
            msg['Subject'] = f'🚰 Nuevo Pedido #{order.id[:8].upper()} - {order.customer_name}'
            msg['To'] = EMAIL_TO
        msg['From'] = SMTP_USER or 'pedidos@aqualan.es'
        text_content = f"\nPedido: #{order.id[:8].upper()}\nFecha: {order.created_at.strftime('%d/%m/%Y %H:%M')}\nFECHA DE ENTREGA: {delivery_message}\n\n"
        for item in order.items:
            text_content += f"- {item.quantity}x {item.product_name} ({item.unit})\n"
        if order.notes:
            text_content += f"\nNOTAS: {order.notes}"
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        logger.info("Email de pedido enviado correctamente: %s (to_customer=%s)", order.id, to_customer)
    except Exception as e:
        logger.exception("Error enviando email de pedido (background): %s", e)


# Productos definitivos (imágenes se cambian en GUIA_IMAGENES_PRODUCTOS.md)
SEED_PRODUCTS = [
    {
        "id": "botellon-19-sanandres",
        "name": "Botellón 19L San Andrés",
        "description": "Botellón PET de 19 litros con asa incorporada. Agua mineral natural del manantial de San Andrés de León.",
        "category": "botellones",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
        "capacity": "19L",
        "brand": "San Andrés",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "botellon-12-sanandres",
        "name": "Botellón 12L San Andrés",
        "description": "Botellón PET de 12 litros. Agua del manantial de San Andrés. Formato cómodo y manejable.",
        "category": "botellones",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
        "capacity": "12L",
        "brand": "San Andrés",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "ecobox-5-alzola",
        "name": "Ecobox 5L Alzola",
        "description": "Solución ecológica en formato bag in box sobremesa. 5 litros. Marca Alzola.",
        "category": "ecobox",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
        "capacity": "5L",
        "brand": "Alzola",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "ecobox-15-alzola",
        "name": "Ecobox 15L Alzola",
        "description": "Formato bag in box ecológico de 15 litros. Reduce desperdicio de envases. Alzola.",
        "category": "ecobox",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
        "capacity": "15L",
        "brand": "Alzola",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "botellin-033-sanandres",
        "name": "Botellín 0,33L San Andrés",
        "description": "Agua mineral San Andrés en formato 0,33L. Bajo sodio. Pack 24 unidades.",
        "category": "botellines",
        "unit": "24 ud",
        "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
        "capacity": "0.33L",
        "brand": "San Andrés",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "botellin-05-sanandres",
        "name": "Botellín 0,5L San Andrés",
        "description": "Agua mineral San Andrés en formato 0,5L. Bajo sodio. Ideal para deporte y reuniones. Pack 24 unidades.",
        "category": "botellines",
        "unit": "24 ud",
        "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
        "capacity": "0.5L",
        "brand": "San Andrés",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "botella-15-sanandres",
        "name": "Botella 1,5L San Andrés",
        "description": "Formato 1,5L. Agua mineral San Andrés, baja en sodio. Ideal para desplazamientos. Pack 6 unidades.",
        "category": "botellines",
        "unit": "6 ud",
        "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
        "capacity": "1.5L",
        "brand": "San Andrés",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "dispensador-fria-caliente",
        "name": "Dispensador Agua Fría/Caliente",
        "description": "Dispensador de agua con función fría y caliente. Perfecto para oficinas y hogares.",
        "category": "dispensadores",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "fuentes-red",
        "name": "Fuentes de Red",
        "description": "Fuente de agua conectada a la red. Suministro continuo, ideal para oficinas y locales.",
        "category": "dispensadores",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "vasos-compostables-220-2000ud",
        "name": "Vasos Compostables 220ml 2000ud",
        "description": "Vasos 100% reciclables y compostables. 220ml. Pack 2000 unidades.",
        "category": "vasos",
        "unit": "2000 ud",
        "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
        "capacity": "220ml",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "vasos-plastico-1000ud",
        "name": "Vasos Plástico Transparente 1000ud",
        "description": "Vasos desechables transparentes. Pack 1000 unidades.",
        "category": "vasos",
        "unit": "1000 ud",
        "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
        "capacity": "220ml",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "cafetera-capsulas-roja",
        "name": "Cafetera de Cápsulas Roja",
        "description": "Cafetera de cápsulas. Color rojo. Perfecta para oficinas y hogares.",
        "category": "cafe",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "cafetera-capsulas-negra",
        "name": "Cafetera de Cápsulas Negra",
        "description": "Cafetera de cápsulas. Color negro. Perfecta para oficinas y hogares.",
        "category": "cafe",
        "unit": "unidad",
        "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "capsulas-cremoso-50ud",
        "name": "Cápsulas Café Cremoso 50ud",
        "description": "Cápsulas de café con aroma cremoso. 50 unidades. Compatible con nuestras cafeteras.",
        "category": "cafe",
        "subcategory": "capsulas",
        "unit": "50 ud",
        "image_url": "https://images.unsplash.com/photo-1591656927346-5c8e933b966d?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "capsulas-intenso-50ud",
        "name": "Cápsulas Café Intenso 50ud",
        "description": "Cápsulas de café con aroma intenso. 50 unidades. Compatible con nuestras cafeteras.",
        "category": "cafe",
        "subcategory": "capsulas",
        "unit": "50 ud",
        "image_url": "https://images.unsplash.com/photo-1637905351378-67232a5f0c9b?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "capsulas-descafeinado-50ud",
        "name": "Cápsulas Café Descafeinado 50ud",
        "description": "Cápsulas de café descafeinado. 50 unidades. Compatible con nuestras cafeteras.",
        "category": "cafe",
        "subcategory": "capsulas",
        "unit": "50 ud",
        "image_url": "https://images.unsplash.com/photo-1639256150782-ecdb00b01e84?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": "pack-azucar-paletinas",
        "name": "Pack Azúcar + Paletinas",
        "description": "Pack de azúcar con paletinas. Complemento perfecto para tu café.",
        "category": "cafe",
        "subcategory": "accesorios",
        "unit": "pack",
        "image_url": "https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=400",
        "available": True,
        "created_at": datetime.utcnow(),
    },
]

# Imágenes desde backend/static/products/ (nombre: {id}.jpg o .png)
_STATIC_BASE = os.environ.get("BASE_URL", "http://localhost:8000")
for _p in SEED_PRODUCTS:
    _p["image_url"] = f"{_STATIC_BASE}/static/products/{_p['id']}.jpg"


async def seed_products():
    """Sincroniza los productos del backend con la BD (inserta o actualiza por id)."""
    if db is None:
        logger.info("MongoDB no disponible. Productos servidos desde memoria.")
        return
    try:
        for p in SEED_PRODUCTS:
            doc = dict(p)
            await db.products.replace_one(
                {"id": doc["id"]},
                doc,
                upsert=True
            )
        logger.info(f"Seeded/synced {len(SEED_PRODUCTS)} products")
    except Exception as e:
        logger.warning(f"No se pudo hacer seed en MongoDB: {e}. Productos desde memoria.")


# Routes
@api_router.get("/")
async def root():
    return {"message": "Aqualan API - Sistema de Pedidos"}


@api_router.get("/health")
async def health():
    """Comprueba que es este backend y que la API está lista (incl. offer-request)."""
    return {"status": "ok", "message": "AQUALAN API", "offer_request": "POST /api/offer-request"}


def _products_fallback(category: Optional[str] = None, brand: Optional[str] = None):
    """Devuelve productos desde SEED_PRODUCTS filtrados por categoría/marca."""
    filtered = [
        p for p in SEED_PRODUCTS
        if (not category or p.get("category") == category)
        and (not brand or p.get("brand") == brand)
    ]
    return [Product(**{**p, "created_at": p.get("created_at", datetime.utcnow())}) for p in filtered]


# Products endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, brand: Optional[str] = None):
    if db is not None:
        try:
            query = {}
            if category:
                query["category"] = category
            if brand:
                query["brand"] = brand
            products = await db.products.find(query).to_list(100)
            if products:
                return [Product(**p) for p in products]
        except Exception as e:
            logger.warning(f"Error leyendo productos de MongoDB: {e}. Usando lista en memoria.")
    return _products_fallback(category, brand)


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    if db is not None:
        try:
            product = await db.products.find_one({"id": product_id})
            if product:
                return Product(**product)
        except Exception:
            pass
    for p in SEED_PRODUCTS:
        if p.get("id") == product_id:
            return Product(**{**p, "created_at": p.get("created_at", datetime.utcnow())})
    raise HTTPException(status_code=404, detail="Producto no encontrado")


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


@api_router.post("/offer-request")
async def submit_offer_request(data: OfferRequestForm):
    """Recibe el formulario de solicitud de oferta y envía email a info@aqualan.es."""
    has_email = bool(RESEND_API_KEY or (SMTP_USER and SMTP_PASSWORD))
    if not has_email:
        logger.warning("offer-request: Ni RESEND_API_KEY ni SMTP configurados. Configura uno en el panel (Render/Railway).")
        raise HTTPException(status_code=503, detail="Servicio de email no configurado. Contacta con el administrador.")
    try:
        ok = await asyncio.to_thread(_send_offer_request_email, data)
        if not ok:
            raise HTTPException(status_code=500, detail="No se pudo enviar la solicitud. Inténtalo más tarde.")
        return {"success": True, "message": "Solicitud enviada correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("offer-request: error enviando email: %s", e)
        raise HTTPException(status_code=500, detail="Error al enviar la solicitud. Inténtalo más tarde.")


# Pedidos en memoria cuando MongoDB no está disponible
_orders_in_memory: List[dict] = []


# Orders endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Calcular fecha de entrega
    delivery_info = get_next_delivery_date(order_data.delivery_city or "")
    
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
    
    if db is not None:
        try:
            await db.orders.insert_one(order.dict())
        except Exception as e:
            logger.warning(f"No se pudo guardar el pedido en BD: {e}. Guardando en memoria.")
            _orders_in_memory.append(order.dict())
    else:
        _orders_in_memory.append(order.dict())
    
    # Enviar emails (esperamos a que se envíen para que no se pierdan en Render)
    has_email = bool(RESEND_API_KEY or (SMTP_USER and SMTP_PASSWORD))
    if not has_email:
        logger.warning("create_order: Ni RESEND_API_KEY ni SMTP configurados. No se envían emails.")
    else:
        try:
            await asyncio.to_thread(_send_order_email_sync, order, delivery_info, False)
            logger.info("Email pedido enviado a %s", EMAIL_TO)
        except Exception as e:
            logger.exception("Error enviando email a empresa (pedido %s): %s", order.id, e)
        try:
            await asyncio.to_thread(_send_order_email_sync, order, delivery_info, True)
            logger.info("Email pedido enviado al cliente %s", order.customer_email)
        except Exception as e:
            logger.exception("Error enviando email al cliente (pedido %s): %s", order.id, e)

    return order


@api_router.get("/orders", response_model=List[Order])
async def get_orders(email: Optional[str] = None):
    if db is not None:
        try:
            query = {}
            if email:
                query["customer_email"] = email
            orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
            return [Order(**o) for o in orders]
        except Exception:
            pass
    # Fallback: pedidos en memoria
    filtered = _orders_in_memory if not email else [o for o in _orders_in_memory if o.get("customer_email") == email]
    filtered = sorted(filtered, key=lambda o: o.get("created_at"), reverse=True)[:100]
    return [Order(**o) for o in filtered]


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    if db is not None:
        try:
            order = await db.orders.find_one({"id": order_id})
            if order:
                return Order(**order)
        except Exception:
            pass
    for o in _orders_in_memory:
        if o.get("id") == order_id:
            return Order(**o)
    raise HTTPException(status_code=404, detail="Pedido no encontrado")


@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid_statuses = ["pendiente", "confirmado", "en_camino", "entregado", "cancelado"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {valid_statuses}")
    
    if db is not None:
        try:
            result = await db.orders.update_one(
                {"id": order_id},
                {"$set": {"status": status, "updated_at": datetime.utcnow()}}
            )
            if result.modified_count > 0:
                return {"message": "Estado actualizado", "status": status}
        except Exception:
            pass
    for o in _orders_in_memory:
        if o.get("id") == order_id:
            o["status"] = status
            o["updated_at"] = datetime.utcnow()
            return {"message": "Estado actualizado", "status": status}
    raise HTTPException(status_code=404, detail="Pedido no encontrado")


# Include the router in the main app
app.include_router(api_router)

# Carpeta de imágenes de productos: pon aquí tus fotos (ver GUIA_IMAGENES_PRODUCTOS.md)
STATIC_DIR = ROOT_DIR / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    _load_routes_from_excel()
    await seed_products()
    logger.info("Application started and products seeded")
    logger.info("SMTP config: server=%s port=%s user=%s password_set=%s | Resend: %s", SMTP_SERVER, SMTP_PORT, SMTP_USER or "(vacío)", "sí" if SMTP_PASSWORD else "no", "sí" if RESEND_API_KEY else "no")
    logger.info("POST /api/offer-request disponible para solicitudes de oferta -> info@aqualan.es")


@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()

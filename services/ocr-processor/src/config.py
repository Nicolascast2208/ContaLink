import os
from pathlib import Path
from dotenv import load_dotenv
import logging

# Cargar variables de entorno desde .env
load_dotenv()

# Paths base
BASE_DIR = Path(__file__).resolve().parent.parent
KEYS_DIR = BASE_DIR / 'keys'

# ============================================
# FIREBASE CONFIGURATION
# ============================================
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv(
    'FIREBASE_SERVICE_ACCOUNT_PATH',
    str(KEYS_DIR / 'firebase_admin.json')
)
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')
FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET')

# ============================================
# GOOGLE CLOUD VISION CONFIGURATION
# ============================================
GOOGLE_VISION_SERVICE_ACCOUNT_PATH = os.getenv(
    'GOOGLE_VISION_SERVICE_ACCOUNT_PATH',
    str(KEYS_DIR / 'google_vision.json')
)
GCP_PROJECT_ID = os.getenv('GCP_PROJECT_ID')

# ============================================
# LOGGING CONFIGURATION
# ============================================
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# ============================================
# PROCESSING CONFIGURATION
# ============================================
MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))
SII_CACHE_EXPIRY_DAYS = int(os.getenv('SII_CACHE_EXPIRY_DAYS', '30'))

# ============================================
# VALIDATION
# ============================================
def validate_config():
    """Validar que todas las configuraciones requeridas estén presentes"""
    errors = []
    
    if not FIREBASE_PROJECT_ID:
        errors.append('FIREBASE_PROJECT_ID no está configurado')
    
    if not FIREBASE_STORAGE_BUCKET:
        errors.append('FIREBASE_STORAGE_BUCKET no está configurado')
    
    if not Path(FIREBASE_SERVICE_ACCOUNT_PATH).exists():
        errors.append(f'Firebase service account key no encontrado en: {FIREBASE_SERVICE_ACCOUNT_PATH}')
    
    if not Path(GOOGLE_VISION_SERVICE_ACCOUNT_PATH).exists():
        errors.append(f'Google Vision service account key no encontrado en: {GOOGLE_VISION_SERVICE_ACCOUNT_PATH}')
    
    if errors:
        raise ValueError(
            'Errores de configuración:\n' + '\n'.join(f'  - {err}' for err in errors) +
            '\n\nAsegúrate de:\n'
            '1. Crear un archivo .env basado en .env.example\n'
            '2. Descargar los service account keys de Firebase y Google Cloud\n'
            '3. Colocar los archivos .json en la carpeta keys/'
        )
    
    logging.info('✓ Configuración validada correctamente')

# Validar configuración al importar
try:
    validate_config()
except ValueError as e:
    logging.error(str(e))
    raise

import firebase_admin
from firebase_admin import credentials, firestore, storage
from typing import Optional
import logging
from datetime import datetime

from config import (
    FIREBASE_SERVICE_ACCOUNT_PATH,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET
)

logger = logging.getLogger(__name__)

# ============================================
# FIREBASE INITIALIZATION
# ============================================
_app: Optional[firebase_admin.App] = None
_db: Optional[firestore.Client] = None
_bucket: Optional[storage.Bucket] = None

def initialize_firebase():
    """Inicializar Firebase Admin SDK"""
    global _app, _db, _bucket
    
    if _app is not None:
        logger.info('Firebase ya está inicializado')
        return
    
    try:
        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
        _app = firebase_admin.initialize_app(cred, {
            'projectId': FIREBASE_PROJECT_ID,
            'storageBucket': FIREBASE_STORAGE_BUCKET
        })
        
        _db = firestore.client()
        _bucket = storage.bucket()
        
        logger.info(f'✓ Firebase inicializado - Proyecto: {FIREBASE_PROJECT_ID}')
    except Exception as e:
        logger.error(f'Error al inicializar Firebase: {e}')
        raise

def get_firestore() -> firestore.Client:
    """Obtener cliente de Firestore"""
    if _db is None:
        initialize_firebase()
    return _db

def get_storage_bucket() -> storage.Bucket:
    """Obtener bucket de Storage"""
    if _bucket is None:
        initialize_firebase()
    return _bucket

# ============================================
# FIRESTORE HELPERS
# ============================================

def get_invoice(company_id: str, invoice_id: str) -> Optional[dict]:
    """Obtener una factura desde Firestore"""
    try:
        db = get_firestore()
        doc_ref = db.collection('companies').document(company_id).collection('invoices').document(invoice_id)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None
    except Exception as e:
        logger.error(f'Error al obtener factura {invoice_id}: {e}')
        return None

def update_invoice(company_id: str, invoice_id: str, data: dict) -> bool:
    """Actualizar una factura en Firestore"""
    try:
        db = get_firestore()
        doc_ref = db.collection('companies').document(company_id).collection('invoices').document(invoice_id)
        doc_ref.update(data)
        logger.info(f'✓ Factura {invoice_id} actualizada')
        return True
    except Exception as e:
        logger.error(f'Error al actualizar factura {invoice_id}: {e}')
        return False

def update_invoice_status(company_id: str, invoice_id: str, status: str, error_message: str = None) -> bool:
    """Actualizar estado de una factura"""
    data = {
        'status': status,
        'processedAt': firestore.SERVER_TIMESTAMP
    }
    
    if error_message:
        data['errorMessage'] = error_message
    
    return update_invoice(company_id, invoice_id, data)

def save_supplier_cache(rut: str, data: dict) -> bool:
    """Guardar datos de proveedor en cache"""
    try:
        db = get_firestore()
        doc_ref = db.collection('suppliers').document(rut)
        
        cache_data = {
            'rut': rut,
            'razonSocial': data.get('razonSocial', ''),
            'giro': data.get('giro', ''),
            'lastVerified': firestore.SERVER_TIMESTAMP,
            'siiData': data
        }
        
        doc_ref.set(cache_data)
        logger.info(f'✓ Proveedor {rut} guardado en cache')
        return True
    except Exception as e:
        logger.error(f'Error al guardar proveedor en cache: {e}')
        return False

def get_supplier_from_cache(rut: str, max_days: int = 30) -> Optional[dict]:
    """Obtener datos de proveedor desde cache"""
    try:
        db = get_firestore()
        doc_ref = db.collection('suppliers').document(rut)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        
        # Verificar si el cache está vigente
        if 'lastVerified' in data:
            from datetime import timedelta
            last_verified = data['lastVerified']
            if datetime.now() - last_verified > timedelta(days=max_days):
                logger.info(f'Cache de proveedor {rut} expirado')
                return None
        
        logger.info(f'✓ Proveedor {rut} obtenido desde cache')
        return data.get('siiData', {})
    except Exception as e:
        logger.error(f'Error al obtener proveedor desde cache: {e}')
        return None

# ============================================
# STORAGE HELPERS
# ============================================

def download_image_from_storage(image_url: str) -> Optional[bytes]:
    """Descargar imagen desde Firebase Storage"""
    try:
        bucket = get_storage_bucket()
        
        # Extraer path del blob desde la URL
        # URL ejemplo: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg
        from urllib.parse import urlparse, unquote
        parsed = urlparse(image_url)
        path = parsed.path.split('/o/')[-1].split('?')[0]
        blob_path = unquote(path)
        
        blob = bucket.blob(blob_path)
        
        if not blob.exists():
            logger.error(f'Imagen no encontrada en Storage: {blob_path}')
            return None
        
        image_bytes = blob.download_as_bytes()
        logger.info(f'✓ Imagen descargada: {blob_path} ({len(image_bytes)} bytes)')
        return image_bytes
    except Exception as e:
        logger.error(f'Error al descargar imagen: {e}')
        return None

# ============================================
# QUERY HELPERS
# ============================================

def get_pending_invoices(limit: int = 10):
    """Obtener facturas pendientes de procesamiento OCR"""
    try:
        db = get_firestore()
        
        # Buscar en todas las empresas (requiere índice compuesto en Firestore)
        # Alternativa: iterar por empresas
        companies_ref = db.collection('companies')
        companies = companies_ref.stream()
        
        pending_invoices = []
        
        for company in companies:
            invoices_ref = company.reference.collection('invoices')
            query = invoices_ref.where('status', '==', 'pending_ocr').limit(limit)
            
            for invoice_doc in query.stream():
                invoice_data = invoice_doc.to_dict()
                invoice_data['id'] = invoice_doc.id
                invoice_data['companyId'] = company.id
                pending_invoices.append(invoice_data)
                
                if len(pending_invoices) >= limit:
                    break
            
            if len(pending_invoices) >= limit:
                break
        
        logger.info(f'✓ {len(pending_invoices)} facturas pendientes encontradas')
        return pending_invoices
    except Exception as e:
        logger.error(f'Error al obtener facturas pendientes: {e}')
        return []

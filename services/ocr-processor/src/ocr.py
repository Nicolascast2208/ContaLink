"""
Servicio de OCR usando Google Cloud Vision API
Optimizado para documentos tributarios chilenos
"""

import logging
from typing import Optional, Dict, Any
from google.cloud import vision
from google.cloud.vision_v1 import types
import os

from config import GOOGLE_VISION_SERVICE_ACCOUNT_PATH

logger = logging.getLogger(__name__)

# ============================================
# GOOGLE CLOUD VISION CLIENT
# ============================================
_vision_client: Optional[vision.ImageAnnotatorClient] = None

def get_vision_client() -> vision.ImageAnnotatorClient:
    """Obtener cliente de Google Cloud Vision"""
    global _vision_client
    
    if _vision_client is None:
        # Configurar ruta de credenciales
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_VISION_SERVICE_ACCOUNT_PATH
        _vision_client = vision.ImageAnnotatorClient()
        logger.info('✓ Google Cloud Vision client inicializado')
    
    return _vision_client

# ============================================
# OCR FUNCTIONS
# ============================================

def extract_text_from_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Extraer texto de una imagen usando Google Cloud Vision OCR
    
    Args:
        image_bytes: Bytes de la imagen a procesar
    
    Returns:
        Dict con:
        - text: Texto completo extraído
        - confidence: Nivel de confianza promedio
        - blocks: Bloques de texto estructurados (opcional)
        - error: Mensaje de error si falló
    """
    try:
        client = get_vision_client()
        
        # Crear objeto Image
        image = vision.Image(content=image_bytes)
        
        # Usar DOCUMENT_TEXT_DETECTION (optimizado para documentos densos)
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            raise Exception(response.error.message)
        
        # Extraer texto completo
        full_text = response.full_text_annotation.text if response.full_text_annotation else ''
        
        # Calcular confianza promedio
        confidence = 0.0
        if response.full_text_annotation and response.full_text_annotation.pages:
            total_confidence = 0.0
            block_count = 0
            
            for page in response.full_text_annotation.pages:
                for block in page.blocks:
                    total_confidence += block.confidence
                    block_count += 1
            
            if block_count > 0:
                confidence = total_confidence / block_count
        
        # Extraer bloques estructurados (opcional para análisis detallado)
        blocks = []
        if response.full_text_annotation:
            for page in response.full_text_annotation.pages:
                for block in page.blocks:
                    block_text = ''
                    for paragraph in block.paragraphs:
                        para_text = ''
                        for word in paragraph.words:
                            word_text = ''.join([symbol.text for symbol in word.symbols])
                            para_text += word_text + ' '
                        block_text += para_text.strip() + '\n'
                    
                    blocks.append({
                        'text': block_text.strip(),
                        'confidence': block.confidence
                    })
        
        logger.info(f'✓ Texto extraído: {len(full_text)} caracteres, confianza: {confidence:.2%}')
        
        return {
            'text': full_text,
            'confidence': confidence,
            'blocks': blocks,
            'error': None
        }
    
    except Exception as e:
        error_msg = f'Error en OCR: {str(e)}'
        logger.error(error_msg)
        return {
            'text': '',
            'confidence': 0.0,
            'blocks': [],
            'error': error_msg
        }

def preprocess_image_if_needed(image_bytes: bytes) -> bytes:
    """
    Pre-procesar imagen si es necesario (mejorar contraste, deskew, etc.)
    
    TODO: Implementar con Pillow si se requiere mejoras en la calidad del OCR
    Por ahora, retorna la imagen sin cambios
    """
    # Implementación futura con Pillow:
    # - Convertir a escala de grises
    # - Aumentar contraste
    # - Corregir inclinación (deskew)
    # - Aplicar threshold adaptativo
    
    return image_bytes

def extract_text_with_preprocessing(image_bytes: bytes) -> Dict[str, Any]:
    """
    Extraer texto con pre-procesamiento de imagen
    """
    try:
        # Pre-procesar imagen
        processed_image = preprocess_image_if_needed(image_bytes)
        
        # Extraer texto
        return extract_text_from_image(processed_image)
    
    except Exception as e:
        logger.error(f'Error en extracción con preprocesamiento: {e}')
        return {
            'text': '',
            'confidence': 0.0,
            'blocks': [],
            'error': str(e)
        }

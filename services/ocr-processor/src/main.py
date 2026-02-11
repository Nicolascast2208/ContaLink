"""
Script principal para procesamiento de facturas con OCR
Escucha facturas pendientes en Firestore y las procesa automáticamente
"""

import logging
import time
import sys
from typing import Dict, Any

# Importar módulos locales
from config import validate_config
from firebase_client import (
    initialize_firebase,
    get_pending_invoices,
    update_invoice,
    update_invoice_status,
    download_image_from_storage,
    get_supplier_from_cache,
    save_supplier_cache
)
from ocr import extract_text_from_image
from parser import parse_invoice_text, validate_rut
from sii import query_sii_by_rut, format_rut

logger = logging.getLogger(__name__)

# ============================================
# PIPELINE DE PROCESAMIENTO
# ============================================

def process_invoice(invoice_data: Dict[str, Any]) -> bool:
    """
    Procesar una factura completa: OCR -> Parser -> SII -> Actualizar Firestore
    
    Args:
        invoice_data: Dict con datos de la factura desde Firestore
    
    Returns:
        True si se procesó exitosamente, False si hubo error
    """
    invoice_id = invoice_data.get('id')
    company_id = invoice_data.get('companyId')
    image_url = invoice_data.get('imageUrl')
    
    logger.info(f'========================================')
    logger.info(f'Procesando factura: {invoice_id}')
    logger.info(f'========================================')
    
    try:
        # Actualizar estado a "processing"
        update_invoice_status(company_id, invoice_id, 'processing')
        
        # Paso 1: Descargar imagen
        logger.info('PASO 1: Descargando imagen desde Storage...')
        image_bytes = download_image_from_storage(image_url)
        
        if not image_bytes:
            raise Exception('No se pudo descargar la imagen desde Storage')
        
        # Paso 2: Extraer texto con OCR
        logger.info('PASO 2: Extrayendo texto con Google Cloud Vision OCR...')
        ocr_result = extract_text_from_image(image_bytes)
        
        if ocr_result.get('error'):
            raise Exception(f'Error en OCR: {ocr_result["error"]}')
        
        text = ocr_result.get('text', '')
        confidence = ocr_result.get('confidence', 0.0)
        
        if not text:
            raise Exception('No se extrajo texto de la imagen')
        
        logger.info(f'✓ Texto extraído: {len(text)} caracteres (confianza: {confidence:.1%})')
        
        # Paso 3: Parsear texto y extraer datos estructurados
        logger.info('PASO 3: Parseando texto y extrayendo datos...')
        parsed_data = parse_invoice_text(text)
        
        # Paso 4: Consultar SII por RUT del emisor (si existe)
        emisor_rut = parsed_data.get('emisorRut')
        
        if emisor_rut and validate_rut(emisor_rut):
            logger.info(f'PASO 4: Consultando SII para emisor: {emisor_rut}')
            
            # Intentar obtener desde cache primero
            cached_data = get_supplier_from_cache(emisor_rut)
            
            if cached_data:
                logger.info('✓ Datos obtenidos desde cache')
                parsed_data['emisorRazonSocial'] = cached_data.get('razonSocial', parsed_data.get('emisorRazonSocial'))
                parsed_data['emisorGiro'] = cached_data.get('giro', '')
            else:
                # Consultar al SII
                sii_data = query_sii_by_rut(emisor_rut)
                
                if sii_data:
                    parsed_data['emisorRazonSocial'] = sii_data.get('razonSocial', parsed_data.get('emisorRazonSocial'))
                    parsed_data['emisorGiro'] = sii_data.get('giro', '')
                    parsed_data['emisorDireccion'] = sii_data.get('direccion', '')
                    parsed_data['emisorComuna'] = sii_data.get('comuna', '')
                    
                    # Guardar en cache
                    save_supplier_cache(emisor_rut, sii_data)
                else:
                    logger.warning('No se pudieron obtener datos del SII para el emisor')
        else:
            logger.warning('RUT del emisor no encontrado o inválido, saltando consulta al SII')
        
        # Paso 5: Actualizar documento en Firestore
        logger.info('PASO 5: Actualizando factura en Firestore...')
        
        update_data = {
            'status': 'ocr_done',
            'ocrRawText': text,
            'ocrConfidence': confidence,
            **{k: v for k, v in parsed_data.items() if v is not None and k != 'raw_matches'}
        }
        
        success = update_invoice(company_id, invoice_id, update_data)
        
        if success:
            logger.info('✓✓✓ Factura procesada exitosamente ✓✓✓\n')
            return True
        else:
            raise Exception('Error al actualizar factura en Firestore')
    
    except Exception as e:
        logger.error(f'✗✗✗ Error al procesar factura: {e} ✗✗✗\n')
        update_invoice_status(company_id, invoice_id, 'error', str(e))
        return False

# ============================================
# MAIN LOOP
# ============================================

def main():
    """
    Loop principal que busca y procesa facturas pendientes
    """
    logger.info('===========================================')
    logger.info('ContaLink OCR Processor')
    logger.info('===========================================\n')
    
    try:
        # Validar configuración
        logger.info('Validando configuración...')
        validate_config()
        
        # Inicializar Firebase
        logger.info('Inicializando Firebase...')
        initialize_firebase()
        
        logger.info('\n✓ Sistema inicializado correctamente')
        logger.info('Escuchando facturas pendientes...\n')
        
        # Loop infinito para procesar facturas
        while True:
            try:
                # Obtener facturas pendientes
                pending_invoices = get_pending_invoices(limit=5)
                
                if pending_invoices:
                    logger.info(f'Se encontraron {len(pending_invoices)} facturas pendientes')
                    
                    for invoice in pending_invoices:
                        process_invoice(invoice)
                        
                        # Pequeño delay entre facturas para no saturar APIs
                        time.sleep(2)
                else:
                    # No hay facturas pendientes, esperar antes de volver a consultar
                    logger.debug('No hay facturas pendientes, esperando...')
                    time.sleep(10)  # Esperar 10 segundos
            
            except KeyboardInterrupt:
                logger.info('\n\nInterrupción recibida, cerrando...')
                break
            
            except Exception as e:
                logger.error(f'Error en el loop principal: {e}')
                time.sleep(30)  # Esperar 30 segundos antes de reintentar
    
    except Exception as e:
        logger.error(f'Error fatal: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()

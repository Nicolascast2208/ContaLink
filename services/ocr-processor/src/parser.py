"""
Parser de texto OCR para facturas chilenas
Extrae información estructurada usando expresiones regulares
"""

import re
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

# ============================================
# REGEX PATTERNS PARA FACTURAS CHILENAS
# ============================================

# RUT: Formato XX.XXX.XXX-X o XXXXXXXX-X
RUT_PATTERN = r'(\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK])'

# Número de factura/boleta
NUMERO_FACTURA_PATTERN = r'(?:N[°º]?|N[UÚ]MERO)[:\s]*(\d+)'
NUMERO_SIMPLE_PATTERN = r'N[°º]\s*(\d+)'

# Montos (con o sin puntos de miles, con o sin decimales)
MONTO_PATTERN = r'\$\s*([\d\.]+(?:,\d{1,2})?)'

# Fecha (varios formatos chilenos)
FECHA_PATTERN_1 = r'(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})'  # DD/MM/YYYY
FECHA_PATTERN_2 = r'(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:de\s+)?(\d{4})'  # DD de Mes de YYYY

# Tipo de documento
TIPO_DOC_PATTERNS = {
    'factura': r'FACTURA\s+ELECTR[ÓO]NICA',
    'boleta': r'BOLETA\s+ELECTR[ÓO]NICA',
    'nota_credito': r'NOTA\s+DE\s+CR[ÉE]DITO',
    'nota_debito': r'NOTA\s+DE\s+D[ÉE]BITO',
    'guia_despacho': r'GU[ÍI]A\s+DE\s+DESPACHO',
    'factura_exenta': r'FACTURA\s+(?:ELECTR[ÓO]NICA\s+)?EXENTA'
}

# Etiquetas comunes
ETIQUETAS = {
    'total': ['total', 'monto total', 'total a pagar'],
    'neto': ['neto', 'monto neto', 'subtotal'],
    'iva': ['iva', 'i.v.a.', 'impuesto'],
    'emisor': ['emisor', 'raz[óo]n social', 'proveedor'],
    'receptor': ['receptor', 'se[ñn]or', 'cliente'],
    'fecha': ['fecha', 'fecha emisi[óo]n'],
    'rut': ['rut', 'r.u.t.']
}

# Meses en español
MESES = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
}

# ============================================
# FUNCIONES DE EXTRACCIÓN
# ============================================

def parse_invoice_text(text: str) -> Dict[str, Any]:
    """
    Parsear texto OCR y extraer información estructurada de la factura
    
    Args:
        text: Texto extraído por OCR
    
    Returns:
        Dict con los datos extraídos
    """
    logger.info('Iniciando parseo de texto OCR')
    
    data = {
        'type': extract_document_type(text),
        'number': extract_invoice_number(text),
        'date': extract_date(text),
        'emisorRut': None,
        'emisorRazonSocial': None,
        'receptorRut': None,
        'receptorRazonSocial': None,
        'netoAmount': extract_amount(text, 'neto'),
        'ivaAmount': extract_amount(text, 'iva'),
        'totalAmount': extract_amount(text, 'total'),
        'items': extract_items(text),
        'raw_matches': {}  # Para debugging
    }
    
    # Extraer RUTs (emisor y receptor)
    ruts = extract_all_ruts(text)
    if len(ruts) >= 1:
        data['emisorRut'] = ruts[0]
    if len(ruts) >= 2:
        data['receptorRut'] = ruts[1]
    
    logger.info(f'✓ Parseo completado: Tipo={data["type"]}, Número={data["number"]}, Total={data["totalAmount"]}')
    
    return data

def extract_document_type(text: str) -> str:
    """Detectar tipo de documento"""
    text_upper = text.upper()
    
    for doc_type, pattern in TIPO_DOC_PATTERNS.items():
        if re.search(pattern, text_upper):
            logger.debug(f'Tipo de documento detectado: {doc_type}')
            return doc_type
    
    # Por defecto, asumir factura
    logger.warning('Tipo de documento no detectado, asumiendo "factura"')
    return 'factura'

def extract_invoice_number(text: str) -> Optional[int]:
    """Extraer número de factura"""
    # Intentar con patrón completo
    match = re.search(NUMERO_FACTURA_PATTERN, text, re.IGNORECASE)
    if match:
        try:
            numero = int(match.group(1))
            logger.debug(f'Número de factura extraído: {numero}')
            return numero
        except ValueError:
            pass
    
    # Intentar con patrón simple
    match = re.search(NUMERO_SIMPLE_PATTERN, text)
    if match:
        try:
            numero = int(match.group(1))
            logger.debug(f'Número de factura extraído (patrón simple): {numero}')
            return numero
        except ValueError:
            pass
    
    logger.warning('No se pudo extraer número de factura')
    return None

def extract_date(text: str) -> Optional[str]:
    """Extraer fecha de emisión"""
    # Intentar formato DD/MM/YYYY
    match = re.search(FECHA_PATTERN_1, text)
    if match:
        try:
            day, month, year = match.groups()
            if len(year) == 2:
                year = '20' + year
            fecha = f'{year}-{month.zfill(2)}-{day.zfill(2)}'
            logger.debug(f'Fecha extraída: {fecha}')
            return fecha
        except:
            pass
    
    # Intentar formato DD de Mes de YYYY
    match = re.search(FECHA_PATTERN_2, text, re.IGNORECASE)
    if match:
        try:
            day, month_name, year = match.groups()
            month_name_lower = month_name.lower()
            
            # Buscar mes
            for mes_str, mes_num in MESES.items():
                if mes_str.startswith(month_name_lower[:3]):
                    fecha = f'{year}-{str(mes_num).zfill(2)}-{day.zfill(2)}'
                    logger.debug(f'Fecha extraída: {fecha}')
                    return fecha
        except:
            pass
    
    logger.warning('No se pudo extraer fecha')
    return None

def extract_all_ruts(text: str) -> List[str]:
    """Extraer todos los RUTs encontrados en el texto"""
    matches = re.findall(RUT_PATTERN, text)
    
    # Limpiar y formatear
    ruts = []
    for rut in matches:
        # Agregar puntos y guión si no los tiene
        cleaned = rut.replace('.', '').replace('-', '')
        if len(cleaned) >= 2:
            dv = cleaned[-1].upper()
            number = cleaned[:-1]
            
            # Formatear con puntos
            formatted = f'{int(number):,}'.replace(',', '.') + f'-{dv}'
            ruts.append(formatted)
    
    logger.debug(f'{len(ruts)} RUTs extraídos: {ruts}')
    return ruts

def extract_amount(text: str, amount_type: str) -> Optional[float]:
    """
    Extraer monto específico (total, neto, iva)
    
    Args:
        text: Texto del documento
        amount_type: Tipo de monto ('total', 'neto', 'iva')
    """
    # Buscar etiquetas relacionadas
    etiquetas = ETIQUETAS.get(amount_type, [amount_type])
    
    for etiqueta in etiquetas:
        # Crear patrón que busque la etiqueta seguida de un monto
        pattern = rf'{etiqueta}\s*:?\s*\$?\s*([\d\.]+(?:,\d{{1,2}})?)'
        match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            try:
                # Convertir a float (remover puntos de miles, reemplazar coma por punto)
                amount_str = match.group(1).replace('.', '').replace(',', '.')
                amount = float(amount_str)
                logger.debug(f'Monto {amount_type} extraído: ${amount:,.0f}')
                return amount
            except ValueError:
                continue
    
    # Si no se encuentra con etiqueta, buscar montos genéricos y tomar el mayor (para "total")
    if amount_type == 'total':
        montos = re.findall(MONTO_PATTERN, text)
        if montos:
            try:
                amounts = [float(m.replace('.', '').replace(',', '.')) for m in montos]
                max_amount = max(amounts)
                logger.debug(f'Monto total inferido (máximo): ${max_amount:,.0f}')
                return max_amount
            except ValueError:
                pass
    
    logger.warning(f'No se pudo extraer monto: {amount_type}')
    return None

def extract_items(text: str) -> List[Dict[str, Any]]:
    """
    Extraer items/líneas de la factura
    
    TODO: Implementar extracción de tabla de items
    Requiere análisis más detallado de la estructura del documento
    """
    # Implementación futura
    return []

def format_rut(rut: str) -> str:
    """Formatear RUT con puntos y guión"""
    cleaned = rut.replace('.', '').replace('-', '')
    if len(cleaned) < 2:
        return rut
    
    dv = cleaned[-1].upper()
    number = cleaned[:-1]
    
    try:
        formatted = f'{int(number):,}'.replace(',', '.') + f'-{dv}'
        return formatted
    except:
        return rut

def validate_rut(rut: str) -> bool:
    """Validar dígito verificador de RUT chileno"""
    try:
        cleaned = rut.replace('.', '').replace('-', '')
        dv = cleaned[-1].upper()
        number = cleaned[:-1]
        
        # Calcular dígito verificador
        sum_val = 0
        multiplier = 2
        
        for digit in reversed(number):
            sum_val += int(digit) * multiplier
            multiplier = 7 if multiplier == 2 else multiplier + 1
        
        expected_dv = 11 - (sum_val % 11)
        expected_dv_str = '0' if expected_dv == 11 else ('K' if expected_dv == 10 else str(expected_dv))
        
        return dv == expected_dv_str
    except:
        return False

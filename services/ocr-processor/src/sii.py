"""
Servicio para consulta de datos de contribuyentes al SII (Servicio de Impuestos Internos)
Web scraping del portal del SII
"""

import requests
from bs4 import BeautifulSoup
import logging
from typing import Optional, Dict, Any
import time
from config import MAX_RETRIES

logger = logging.getLogger(__name__)

# ============================================
# CONFIGURACIÓN SII
# ============================================

SII_BASE_URL = 'https://zeus.sii.cl'
SII_CONSULTA_URL = f'{SII_BASE_URL}/cvc_cgi/stc/getstc'

# Headers para simular navegador
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-CL,es;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
}

# ============================================
# FUNCIONES DE CONSULTA
# ============================================

def query_sii_by_rut(rut: str) -> Optional[Dict[str, Any]]:
    """
    Consultar datos de un contribuyente en el SII por RUT
    
    Args:
        rut: RUT del contribuyente (con o sin formato)
    
    Returns:
        Dict con datos del contribuyente o None si no se encuentra
        {
            'rut': str,
            'razonSocial': str,
            'giro': str,
            'actividadEconomica': str,
            'direccion': str (opcional),
            'comuna': str (opcional),
            'region': str (opcional)
        }
    """
    try:
        # Limpiar y formatear RUT
        cleaned_rut = rut.replace('.', '').replace('-', '')
        if len(cleaned_rut) < 2:
            logger.error(f'RUT inválido: {rut}')
            return None
        
        # Separar número y dígito verificador
        dv = cleaned_rut[-1]
        numero = cleaned_rut[:-1]
        
        logger.info(f'Consultando SII para RUT: {numero}-{dv}')
        
        # Realizar consulta con reintentos
        for attempt in range(MAX_RETRIES):
            try:
                response = requests.post(
                    SII_CONSULTA_URL,
                    data={
                        'RUT': numero,
                        'DV': dv,
                        'PRG': 'STC',  # Programa de consulta
                        'OPC': 'NOR'   # Opción normal
                    },
                    headers=HEADERS,
                    timeout=10
                )
                
                if response.status_code == 200:
                    # Parsear respuesta HTML
                    data = parse_sii_response(response.text, rut)
                    
                    if data:
                        logger.info(f'✓ Datos obtenidos del SII: {data["razonSocial"]}')
                        return data
                    else:
                        logger.warning(f'No se encontraron datos en el SII para RUT: {rut}')
                        return None
                
                logger.warning(f'Intento {attempt + 1}/{MAX_RETRIES} falló: Status {response.status_code}')
                time.sleep(1 * (attempt + 1))  # Backoff exponencial
                
            except requests.RequestException as e:
                logger.error(f'Error en solicitud HTTP (intento {attempt + 1}/{MAX_RETRIES}): {e}')
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2 * (attempt + 1))
                else:
                    raise
        
        logger.error(f'No se pudo consultar el SII después de {MAX_RETRIES} intentos')
        return None
    
    except Exception as e:
        logger.error(f'Error al consultar SII: {e}')
        return None

def parse_sii_response(html: str, rut: str) -> Optional[Dict[str, Any]]:
    """
    Parsear respuesta HTML del SII
    
    Args:
        html: HTML de respuesta
        rut: RUT consultado
    
    Returns:
        Dict con los datos extraídos o None
    """
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        # El SII retorna los datos en diferentes formatos dependiendo del tipo de consulta
        # Buscar tabla con datos del contribuyente
        
        # Método 1: Buscar por tabla con clase específica
        table = soup.find('table', {'class': 'cuadro'})
        if not table:
            # Método 2: Buscar cualquier tabla
            table = soup.find('table')
        
        if not table:
            logger.warning('No se encontró tabla en la respuesta del SII')
            return None
        
        # Extraer filas
        rows = table.find_all('tr')
        
        data = {
            'rut': rut,
            'razonSocial': None,
            'giro': None,
            'actividadEconomica': None,
            'direccion': None,
            'comuna': None,
            'region': None
        }
        
        # Parsear filas buscando las etiquetas
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                label = cells[0].get_text(strip=True).lower()
                value = cells[1].get_text(strip=True)
                
                if 'razón social' in label or 'nombre' in label:
                    data['razonSocial'] = value
                elif 'giro' in label:
                    data['giro'] = value
                elif 'actividad' in label:
                    data['actividadEconomica'] = value
                elif 'dirección' in label or 'domicilio' in label:
                    data['direccion'] = value
                elif 'comuna' in label:
                    data['comuna'] = value
                elif 'región' in label:
                    data['region'] = value
        
        # Validar que al menos tengamos razón social
        if not data['razonSocial']:
            logger.warning('No se pudo extraer razón social de la respuesta')
            return None
        
        return data
    
    except Exception as e:
        logger.error(f'Error al parsear respuesta del SII: {e}')
        return None

def validate_rut(rut: str) -> bool:
    """
    Validar formato y dígito verificador de RUT chileno
    
    Args:
        rut: RUT a validar (con o sin formato)
    
    Returns:
        True si es válido, False si no
    """
    try:
        # Limpiar RUT
        cleaned = rut.replace('.', '').replace('-', '').upper()
        
        if len(cleaned) < 2:
            return False
        
        # Separar número y dígito verificador
        dv = cleaned[-1]
        numero = cleaned[:-1]
        
        # El número debe ser numérico
        if not numero.isdigit():
            return False
        
        # Calcular dígito verificador esperado
        suma = 0
        multiplicador = 2
        
        for digito in reversed(numero):
            suma += int(digito) * multiplicador
            multiplicador = 7 if multiplicador == 2 else multiplicador + 1
        
        dv_esperado = 11 - (suma % 11)
        
        if dv_esperado == 11:
            dv_esperado_str = '0'
        elif dv_esperado == 10:
            dv_esperado_str = 'K'
        else:
            dv_esperado_str = str(dv_esperado)
        
        return dv == dv_esperado_str
    
    except Exception as e:
        logger.error(f'Error al validar RUT: {e}')
        return False

def format_rut(rut: str) -> str:
    """
    Formatear RUT con puntos y guión
    
    Args:
        rut: RUT sin formato
    
    Returns:
        RUT formateado (XX.XXX.XXX-X)
    """
    try:
        cleaned = rut.replace('.', '').replace('-', '').upper()
        
        if len(cleaned) < 2:
            return rut
        
        dv = cleaned[-1]
        numero = cleaned[:-1]
        
        # Agregar puntos de miles
        formatted_numero = f'{int(numero):,}'.replace(',', '.')
        
        return f'{formatted_numero}-{dv}'
    
    except Exception as e:
        logger.error(f'Error al formatear RUT: {e}')
        return rut

# ============================================
# NOTAS IMPORTANTES
# ============================================

"""
LIMITACIONES Y CONSIDERACIONES:

1. **Rate Limiting del SII:**
   - El SII puede bloquear consultas excesivas desde una misma IP
   - Implementar delays entre consultas
   - Usar cache en Firestore para evitar consultas repetidas

2. **Captcha:**
   - El SII puede implementar captcha para prevenir scraping
   - Si se encuentra captcha, considerar:
     a) Servicios de terceros (APIs comerciales)
     b) Selenium con resolución manual de captcha
     c) Aumentar cache para reducir consultas

3. **Cambios en la estructura del sitio:**
   - El HTML del SII puede cambiar sin previo aviso
   - Monitorear errores y actualizar parseo según sea necesario

4. **Alternativas:**
   - API Marketplace del SII (requiere convenio)
   - Servicios de terceros (ej: simpliroute, indicadoreschile)
   - Base de datos local pre-cargada

5. **Mejoras futuras:**
   - Implementar Selenium para casos más complejos
   - Añadir soporte para consulta de otros datos (folios, documentos, etc.)
   - Implementar proxy rotation para evitar bloqueos
"""

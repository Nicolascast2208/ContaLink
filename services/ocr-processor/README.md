# ContaLink OCR Processor

Servicio backend en Python para procesamiento automático de facturas chilenas con OCR.

## 🚀 Características

- **Escucha automática**: Detecta nuevas facturas en Firebase Storage
- **OCR con Google Cloud Vision**: Extracción de texto optimizada para documentos densos
- **Parser inteligente**: Regex especializados para facturas chilenas
- **Consulta al SII**: Validación de RUT y obtención de razón social
- **Cache inteligente**: Reduce consultas al SII con Firestore
- **Manejo de errores**: Reintentos automáticos y logging detallado

## 📋 Prerequisitos

- Python 3.12 o superior
- Cuenta de Google Cloud Platform con Vision API habilitada
- Proyecto Firebase configurado
- Service Account Keys para Firebase y Google Cloud

## 🛠️ Instalación

### 1. Crear entorno virtual

```bash
cd services/ocr-processor
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Editar `.env` con tus configuraciones:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./keys/firebase_admin.json
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com

GOOGLE_VISION_SERVICE_ACCOUNT_PATH=./keys/google_vision.json
GCP_PROJECT_ID=tu_proyecto_gcp
```

### 4. Descargar Service Account Keys

#### Firebase Admin SDK:
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar tu proyecto
3. **Project Settings** > **Service accounts**
4. Clic en **Generate new private key**
5. Guardar como `keys/firebase_admin.json`

#### Google Cloud Vision:
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. **IAM & Admin** > **Service accounts**
3. Crear o seleccionar una cuenta con rol **Cloud Vision API User**
4. **Create key** > **JSON**
5. Guardar como `keys/google_vision.json`

## 🏃 Ejecución

### Modo desarrollo (listener local)

```bash
python src/main.py
```

El script quedará escuchando cambios en Firestore y procesará automáticamente las facturas con `status: "pending_ocr"`.

### Salida esperada:

```
===========================================
ContaLink OCR Processor
===========================================

✓ Configuración validada correctamente
✓ Firebase inicializado - Proyecto: contalink-xxxxx
✓ Google Cloud Vision client inicializado

✓ Sistema inicializado correctamente
Escuchando facturas pendientes...

========================================
Procesando factura: abc123
========================================
PASO 1: Descargando imagen desde Storage...
✓ Imagen descargada: users/uid/invoices/123.jpg (245678 bytes)
PASO 2: Extrayendo texto con Google Cloud Vision OCR...
✓ Texto extraído: 1234 caracteres (confianza: 95.3%)
PASO 3: Parseando texto y extrayendo datos...
✓ Parseo completado: Tipo=factura, Número=12345, Total=150000
PASO 4: Consultando SII para emisor: 76.123.456-7
✓ Datos obtenidos del SII: Empresa S.A.
PASO 5: Actualizando factura en Firestore...
✓✓✓ Factura procesada exitosamente ✓✓✓
```

## 📁 Estructura

```
ocr-processor/
├── src/
│   ├── main.py              # Entry point y loop principal
│   ├── config.py            # Configuración y validación
│   ├── firebase_client.py   # Firebase Admin SDK helpers
│   ├── ocr.py               # Google Cloud Vision OCR
│   ├── parser.py            # Extracción con Regex
│   └── sii.py               # Consulta al SII
├── tests/
│   ├── test_parser.py       # Tests del parser
│   └── fixtures/            # Imágenes de prueba
├── keys/                    # Service account keys (NO SUBIR)
├── requirements.txt
├── .env                     # Variables de entorno (NO SUBIR)
└── README.md
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
pytest tests/

# Test específico
pytest tests/test_parser.py

# Con cobertura
pytest --cov=src tests/
```

## 📊 Pipeline de Procesamiento

```
1. Factura subida → Firebase Storage
         ↓
2. App crea doc en Firestore con status: "pending_ocr"
         ↓
3. Script detecta factura pendiente
         ↓
4. Descarga imagen desde Storage
         ↓
5. OCR con Google Cloud Vision
         ↓
6. Parser extrae: RUT, montos, fecha, número
         ↓
7. Consulta SII por RUT (con cache)
         ↓
8. Actualiza Firestore con datos + status: "ocr_done"
         ↓
9. App recibe actualización en tiempo real
```

## ⚙️ Configuración Avanzada

### Variables de entorno opcionales

```env
# Nivel de logging (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO

# Máximo de reintentos para SII y APIs
MAX_RETRIES=3

# Días de validez del cache de SII
SII_CACHE_EXPIRY_DAYS=30
```

### Optimizaciones

- **Cache SII**: Los datos del SII se guardan en Firestore (`suppliers/` collection) y se reutilizan por 30 días
- **Batch processing**: El script procesa hasta 5 facturas en paralelo
- **Rate limiting**: Delays automáticos entre consultas al SII

## 🚢 Deployment a Cloud Functions

Para producción, usar Cloud Functions con trigger automático:

```bash
cd cloud_function

# Deploy
gcloud functions deploy ocr-processor \
  --runtime python312 \
  --trigger-resource YOUR_BUCKET \
  --trigger-event google.storage.object.finalize \
  --entry-point process_invoice \
  --region us-central1 \
  --memory 512MB \
  --timeout 300s
```

## 🔧 Troubleshooting

### Error: "Firebase service account key no encontrado"
- Verificar que el archivo `.json` existe en `keys/`
- Verificar el path en `.env`

### Error: "GOOGLE_APPLICATION_CREDENTIALS"
- El script configura automáticamente esta variable
- Verificar permisos del archivo `.json`

### Error: "Rate limiting" del SII
- Aumentar delays entre consultas en `sii.py`
- Verificar que el cache esté funcionando
- Considerar usar proxy rotation

### OCR con baja confianza
- Mejorar calidad de las fotos (iluminación, enfoque)
- Implementar pre-procesamiento de imágenes en `ocr.py`
- Aumentar contraste o aplicar threshold

## 📝 Notas Importantes

### ⚠️ SII Scraping

El servicio consulta datos públicos del SII mediante web scraping. Consideraciones:

- **Rate limiting**: El SII puede bloquear IPs con muchas consultas
- **Captcha**: Puede aparecer y bloquear consultas automáticas
- **Cambios en HTML**: El sitio puede cambiar sin previo aviso
- **Alternativas**: Considerar APIs de terceros o convenios con el SII

### 🔒 Seguridad

- **NUNCA** subir archivos `.json` de credenciales al repositorio
- Los keys deben estar en `.gitignore`
- Rotar keys periódicamente
- Usar variables de entorno en producción

## 📚 Referencias

- [Firebase Admin SDK (Python)](https://firebase.google.com/docs/admin/setup)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [SII - Servicio de Impuestos Internos](https://www.sii.cl)

## 📄 Licencia

MIT License - Ver LICENSE en la raíz del proyecto

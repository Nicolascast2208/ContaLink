# 🧾 ContaLink

**App multiplataforma para digitalización automática de facturas chilenas con OCR**

ContaLink es una solución profesional que permite a empresas y contadores escanear facturas, boletas y documentos tributarios chilenos para extraer automáticamente datos clave mediante OCR (Google Cloud Vision) y validarlos contra el Servicio de Impuestos Internos (SII).

---

## 🏗️ Arquitectura

### Monorepo Structure

```
ContaLink/
├── apps/mobile/              # App móvil (React Native + Expo SDK 52)
└── services/ocr-processor/   # Servicio de procesamiento OCR (Python 3.12)
```

### Stack Tecnológico

#### **Frontend** (`apps/mobile/`)
- **Framework**: React Native con Expo SDK 52
- **Router**: Expo Router (file-based routing)
- **Lenguaje**: TypeScript
- **Styling**: NativeWind (Tailwind CSS para React Native)
- **Backend as a Service**: Firebase (Auth, Firestore, Storage)
- **Auth**: Email/Contraseña, Google Sign-In, Apple Sign-In

#### **Backend** (`services/ocr-processor/`)
- **Lenguaje**: Python 3.12
- **OCR**: Google Cloud Vision API (Document Text Detection)
- **Validación**: SII Chile (consulta de RUT para razón social y giro)
- **Base de datos**: Firebase Admin SDK (Firestore)
- **Parser**: Regex personalizado para facturas chilenas

---

## 🚀 Quick Start

### Prerequisitos

- **Node.js** >= 18.x
- **npm** o **yarn**
- **Python** >= 3.12
- **Cuenta de Firebase** (proyecto configurado)
- **Cuenta de Google Cloud Platform** (con Vision API habilitada)

### 1. Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** (Email/Password, Google, Apple)
3. Crea una base de datos **Firestore**
4. Crea un bucket de **Storage**
5. Descarga:
   - **Web SDK config** → copia los valores para `.env.local` del frontend
   - **Service Account Key** → guarda en `services/ocr-processor/keys/firebase_admin.json`

### 2. Configuración de Google Cloud Vision

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita **Cloud Vision API**
3. Crea una **Service Account** con rol de Cloud Vision
4. Descarga el JSON key → guarda en `services/ocr-processor/keys/google_vision.json`

### 3. Frontend Setup

```bash
# Navegar a la app móvil
cd apps/mobile

# Instalar dependencias
npm install

# Copiar archivo de ejemplo de variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales de Firebase
nano .env.local

# Iniciar Expo
npx expo start
```

**Opciones de desarrollo:**
- Presiona `i` para iOS Simulator
- Presiona `a` para Android Emulator
- Escanea el QR con Expo Go en tu dispositivo físico

### 4. Backend Setup

```bash
# Navegar al servicio OCR
cd services/ocr-processor

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# En macOS/Linux:
source .venv/bin/activate
# En Windows:
# .venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de ejemplo de variables de entorno
cp .env.example .env

# Editar .env con tus paths de credenciales
nano .env

# Ejecutar el listener (modo desarrollo)
python src/main.py
```

---

## 📁 Estructura Detallada

### Frontend (`apps/mobile/`)

```
apps/mobile/
├── app/                      # 🚦 RUTAS (Expo Router)
│   ├── _layout.tsx           # Root layout, providers, splash
│   ├── index.tsx             # Redirect según autenticación
│   ├── (auth)/               # Stack de autenticación
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/               # Tab navigator principal
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # Dashboard
│   │   ├── scan.tsx          # Captura de facturas
│   │   ├── invoices.tsx      # Lista de facturas
│   │   └── profile.tsx       # Perfil y configuración
│   └── invoice/
│       └── [id].tsx          # Detalle individual
│
├── components/               # 🧩 COMPONENTES
│   ├── ui/                   # Componentes base (Button, Input, Card)
│   ├── forms/                # Formularios (Login, Register, Invoice)
│   └── invoices/             # Componentes de facturas (Card, List)
│
├── hooks/                    # 🪝 CUSTOM HOOKS
│   ├── useAuth.ts
│   ├── useInvoices.ts
│   └── useCompany.ts
│
├── services/                 # 🔌 INTEGRACIÓN FIREBASE
│   ├── firebase.ts           # Inicialización
│   ├── auth.ts               # Autenticación (3 métodos)
│   ├── firestore.ts          # Queries a Firestore
│   └── storage.ts            # Upload de imágenes (XMLHttpRequest)
│
├── lib/                      # 🛠️ UTILIDADES
│   ├── constants.ts
│   └── utils.ts
│
├── types/                    # 📝 TIPOS TYPESCRIPT
│   ├── invoice.ts
│   ├── company.ts
│   └── user.ts
│
├── context/                  # 🌍 CONTEXTOS GLOBALES
│   └── AuthContext.tsx
│
└── assets/                   # 🎨 RECURSOS ESTÁTICOS
    ├── fonts/
    └── images/
```

### Backend (`services/ocr-processor/`)

```
services/ocr-processor/
├── src/                      # 🐍 CÓDIGO FUENTE
│   ├── main.py               # Entry point (listener Firestore)
│   ├── config.py             # Configuración y variables de entorno
│   ├── ocr.py                # Google Cloud Vision OCR
│   ├── parser.py             # Extracción con Regex
│   ├── sii.py                # Consulta al SII Chile
│   └── firebase_client.py    # Firebase Admin SDK
│
├── cloud_function/           # ☁️ CLOUD FUNCTIONS (PRODUCCIÓN)
│   ├── main.py               # Trigger onObjectFinalized
│   └── requirements.txt
│
├── tests/                    # 🧪 TESTS
│   ├── test_parser.py
│   ├── test_ocr.py
│   └── fixtures/             # Imágenes de prueba
│
└── keys/                     # 🔐 CREDENCIALES (NO SUBIR)
    ├── firebase_admin.json
    └── google_vision.json
```

---

## 🔧 Configuración

### Variables de Entorno

#### Frontend (`.env.local`)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### Backend (`.env`)

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./keys/firebase_admin.json
GOOGLE_VISION_SERVICE_ACCOUNT_PATH=./keys/google_vision.json
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
```

---

## 📊 Modelo de Datos (Firestore)

```
users/{userId}
├── email: string
├── displayName: string
├── createdAt: timestamp
└── defaultCompanyId: string

companies/{companyId}
├── rut: string
├── razonSocial: string
├── giro: string
├── createdAt: timestamp
├── /members/{userId}
│   ├── role: "admin" | "editor" | "viewer"
│   └── joinedAt: timestamp
└── /invoices/{invoiceId}
    ├── type: "factura" | "boleta" | "nota_credito" | ...
    ├── number: number
    ├── date: timestamp
    ├── emisorRut: string
    ├── emisorRazonSocial: string
    ├── totalAmount: number
    ├── status: "pending_ocr" | "ocr_done" | "verified" | "error"
    ├── imageUrl: string
    ├── ocrRawText: string
    └── createdAt: timestamp

suppliers/{supplierRut}  (cache SII)
├── rut: string
├── razonSocial: string
├── giro: string
└── lastVerified: timestamp
```

---

## 🛡️ Seguridad

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo acceden a sus datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Facturas: solo miembros de la empresa
    match /companies/{companyId}/invoices/{invoiceId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/companies/$(companyId)/members/$(request.auth.uid));
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/companies/$(companyId)/members/$(request.auth.uid)).data.role in ['admin', 'editor'];
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/invoices/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024  // Max 10MB
        && request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}
```

---

## 🔄 Pipeline de Procesamiento

```
1. Usuario captura/sube foto de factura en la app
   ↓
2. App sube imagen a Firebase Storage (XMLHttpRequest)
   ↓
3. App crea documento en Firestore con status: "pending_ocr"
   ↓
4. Backend Python detecta cambio (listener Firestore)
   ↓
5. Descarga imagen desde Storage
   ↓
6. Extrae texto con Google Cloud Vision OCR
   ↓
7. Parsea datos con Regex (RUT, monto, fecha, etc.)
   ↓
8. Consulta SII por RUT del emisor (con cache)
   ↓
9. Actualiza documento en Firestore con datos extraídos
   ↓
10. App recibe actualización en tiempo real y muestra datos
```

---

## 🧪 Testing

### Frontend

```bash
cd apps/mobile
npm test
```

### Backend

```bash
cd services/ocr-processor
pytest tests/
```

---

## 🚢 Deployment

### Frontend (Expo EAS)

```bash
cd apps/mobile

# Build para Android
eas build --platform android

# Build para iOS
eas build --platform ios

# Submit a las stores
eas submit --platform all
```

### Backend (Google Cloud Functions)

```bash
cd services/ocr-processor/cloud_function

gcloud functions deploy ocr-processor \
  --runtime python312 \
  --trigger-resource YOUR_BUCKET \
  --trigger-event google.storage.object.finalize \
  --entry-point process_invoice
```

---

## ⚠️ Notas Críticas

### ⚡ Upload de Imágenes en Expo SDK 52

Debido a problemas conocidos con `Blob` y `Base64` en Android/iOS con Expo 52, la subida de imágenes usa **XMLHttpRequest nativo**. 

**NO refactorizar a `fetch()` o `uploadString()` sin probar exhaustivamente**, ya que puede romper la funcionalidad en dispositivos móviles.

Ver implementación en: `apps/mobile/services/storage.ts`

### 🇨🇱 SII Chile

El SII no ofrece API pública oficial. El scraping puede requerir:
- Manejo de captcha
- Rate limiting
- Rotación de IPs para uso intensivo
- Considerar servicios de terceros para producción

---

## 📄 Licencia

[MIT License](LICENSE)

---

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repo
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Para problemas o preguntas, abre un [Issue](https://github.com/yourusername/contalink/issues).

---

**Hecho con ❤️ para simplificar la contabilidad chilena**

# 🚀 Guía Rápida - ContaLink

Guía paso a paso para poner en marcha ContaLink en tu máquina local.

---

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Configurar Firebase

#### A. Crear proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Clic en **"Crear un proyecto"**
3. Nombre: `contalink-tu-nombre`
4. Habilitar Google Analytics (opcional)

#### B. Habilitar servicios

En tu proyecto Firebase:

**Authentication:**
- Ir a **Build** > **Authentication**
- Clic en **"Get started"**
- Habilitar **Email/Password**
- *(Opcional)* Habilitar **Google** y **Apple**

**Firestore:**
- Ir a **Build** > **Firestore Database**
- Clic en **"Create database"**
- Modo: **Producción** o **Pruebas**
- Ubicación: elegir la más cercana

**Storage:**
- Ir a **Build** > **Storage**
- Clic en **"Get started"**
- Modo: **Producción** o **Pruebas**

#### C. Obtener credenciales para la app móvil

1. En **Project Settings** (⚙️) > **General**
2. Sección **"Your apps"**
3. Clic en **</> (Web)**
4. Registrar app: `ContaLink Web`
5. Copiar las credenciales (las usaremos después)

#### D. Obtener Service Account Key (Backend)

1. En **Project Settings** > **Service accounts**
2. Clic en **"Generate new private key"**
3. Descargar el JSON
4. Guardar como: `services/ocr-processor/keys/firebase_admin.json`

---

### 2️⃣ Configurar Google Cloud Vision

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar el proyecto de Firebase (mismo nombre)
3. Habilitar **Cloud Vision API**:
   - Ir a **APIs & Services** > **Library**
   - Buscar "Cloud Vision API"
   - Clic en **Enable**
4. Crear Service Account:
   - Ir a **IAM & Admin** > **Service Accounts**
   - Clic en **Create Service Account**
   - Nombre: `contalink-vision`
   - Rol: **Cloud Vision API User**
   - Crear key → **JSON**
   - Guardar como: `services/ocr-processor/keys/google_vision.json`

---

### 3️⃣ Configurar Frontend (App Móvil)

```bash
cd apps/mobile

# Instalar dependencias (ya hecho)
# npm install

# Configurar variables de entorno
cp .env.example .env.local
```

Editar `apps/mobile/.env.local` con las credenciales de Firebase del paso 1C:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

### 4️⃣ Configurar Backend (Python)

```bash
cd services/ocr-processor

# Crear entorno virtual
python3 -m venv .venv

# Activar entorno virtual
source .venv/bin/activate  # macOS/Linux
# En Windows: .venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

Editar `services/ocr-processor/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./keys/firebase_admin.json
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com

GOOGLE_VISION_SERVICE_ACCOUNT_PATH=./keys/google_vision.json
GCP_PROJECT_ID=tu_proyecto_id

LOG_LEVEL=INFO
```

---

### 5️⃣ Configurar Firestore Security Rules

En Firebase Console > **Firestore Database** > **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Empresas y facturas
    match /companies/{companyId} {
      allow read, write: if request.auth != null;
      
      match /invoices/{invoiceId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Cache de proveedores (solo lectura para usuarios)
    match /suppliers/{supplierId} {
      allow read: if request.auth != null;
    }
  }
}
```

Clic en **Publish**.

---

### 6️⃣ Configurar Storage Security Rules

En Firebase Console > **Storage** > **Rules**:

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

Clic en **Publish**.

---

### 7️⃣ Ejecutar la aplicación

#### Terminal 1: Backend Python

```bash
cd services/ocr-processor
source .venv/bin/activate  # Activar entorno virtual
python src/main.py
```

Deberías ver:

```
===========================================
ContaLink OCR Processor
===========================================

✓ Configuración validada correctamente
✓ Firebase inicializado - Proyecto: tu_proyecto
✓ Sistema inicializado correctamente
Escuchando facturas pendientes...
```

#### Terminal 2: Frontend Expo

```bash
cd apps/mobile
npx expo start
```

Opciones:
- Presiona `i` → Abrir en iOS Simulator
- Presiona `a` → Abrir en Android Emulator
- Escanea el QR con **Expo Go** en tu teléfono

---

## 🎯 Primer uso

1. **Registrarte**: Crear cuenta con email/contraseña
2. **Escanear factura**: Ir a tab "Escanear" → Tomar foto o seleccionar de galería
3. **Ver resultado**: El backend procesará la factura automáticamente (~10-30 segundos)
4. **Ver lista**: Ir a tab "Facturas" para ver todas las facturas procesadas

---

## 🐛 Problemas Comunes

### "Firebase not configured"
- Verificar que `.env.local` tenga todas las variables
- Reiniciar Expo: `npx expo start -c`

### "Service account key not found" (Backend)
- Verificar que los archivos `.json` estén en `keys/`
- Verificar que las rutas en `.env` sean correctas
- Los archivos `.json` deben tener permisos de lectura

### "Permission denied" en Storage
- Verificar que las Security Rules estén publicadas
- Verificar que el usuario esté autenticado

### Backend no procesa facturas
- Verificar que el backend esté corriendo
- Verificar logs en la consola del backend
- Verificar que la factura tenga `status: "pending_ocr"` en Firestore

---

## 📚 Siguiente paso

Leer el [README.md](README.md) principal para entender la arquitectura completa y opciones avanzadas.

---

## 💡 Tips

- **Desarrollo en Web**: `npx expo start --web` para probar en navegador
- **Ver logs de Firestore**: Firebase Console > Firestore > Ver documentos
- **Ver Storage**: Firebase Console > Storage > Ver archivos
- **Debug OCR**: El texto extraído se guarda en `ocrRawText` de cada factura

---

## 🆘 Ayuda

Si tienes problemas:

1. Revisar logs del backend en la terminal
2. Revisar consola del navegador/app (errores de Firebase)
3. Verificar que todos los servicios estén habilitados en Firebase
4. Abrir un Issue en GitHub con los logs del error

---

**¡Listo! 🎉 Ahora tienes ContaLink funcionando localmente.**

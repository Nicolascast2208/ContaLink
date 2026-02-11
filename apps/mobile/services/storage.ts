import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage';

/**
 * ⚠️ NOTA CRÍTICA PARA EXPO SDK 52
 * 
 * Debido a problemas conocidos con Blob y Base64 en Android/iOS con Expo SDK 52,
 * NO usar fetch() ni uploadString() para subir imágenes.
 * 
 * Este servicio usa XMLHttpRequest nativo para subir archivos de forma confiable
 * en todas las plataformas (iOS, Android, Web).
 * 
 * NO REFACTORIZAR sin probar exhaustivamente en dispositivos reales.
 */

/**
 * Callback para reportar progreso de subida
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Resultado de una subida exitosa
 */
export interface UploadResult {
  downloadURL: string;
  fullPath: string;
  contentType: string;
  size: number;
}

/**
 * Subir imagen a Firebase Storage usando XMLHttpRequest
 * 
 * @param uri - URI local de la imagen (de expo-image-picker o expo-camera)
 * @param path - Ruta en Storage (ej: 'users/uid123/invoices/image.jpg')
 * @param onProgress - Callback opcional para reportar progreso (0-100)
 * @returns URL de descarga y metadata
 */
export const uploadImage = async (
  uri: string,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> => {
  try {
    // Obtener el Blob de la imagen usando XMLHttpRequest
    const blob = await uriToBlob(uri);
    
    // Crear referencia en Storage
    const storageRef = ref(storage, path);
    
    // Determinar tipo de contenido
    const contentType = getContentType(uri);
    
    // Subir con uploadBytesResumable para tener progreso
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType
    });
    
    // Escuchar progreso
    if (onProgress) {
      uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      });
    }
    
    // Esperar a que termine la subida
    await uploadTask;
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    
    return {
      downloadURL,
      fullPath: uploadTask.snapshot.ref.fullPath,
      contentType,
      size: uploadTask.snapshot.totalBytes
    };
  } catch (error: any) {
    console.error('Error al subir imagen:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
};

/**
 * Convertir URI local a Blob usando XMLHttpRequest
 * Este método es más confiable en React Native que fetch()
 * 
 * @param uri - URI local del archivo
 * @returns Blob del archivo
 */
const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.onload = function () {
      resolve(xhr.response);
    };
    
    xhr.onerror = function (e) {
      console.error('Error en XMLHttpRequest:', e);
      reject(new TypeError('Error de red al cargar el archivo'));
    };
    
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

/**
 * Determinar tipo MIME del archivo basado en la extensión
 */
const getContentType = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif',
    'pdf': 'application/pdf'
  };
  
  return mimeTypes[extension || ''] || 'image/jpeg';
};

/**
 * Eliminar una imagen de Storage
 */
export const deleteImage = async (fullPath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Error al eliminar imagen:', error);
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
};

/**
 * Obtener URL de descarga de un archivo en Storage
 */
export const getImageURL = async (fullPath: string): Promise<string> => {
  try {
    const storageRef = ref(storage, fullPath);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error('Error al obtener URL:', error);
    throw new Error(`Error al obtener URL: ${error.message}`);
  }
};

/**
 * Generar nombre único para archivo
 */
export const generateFileName = (userId: string, extension: string = 'jpg'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `users/${userId}/invoices/${timestamp}_${random}.${extension}`;
};

/**
 * Validar tamaño de archivo (máx 10MB por defecto)
 */
export const validateFileSize = async (
  uri: string,
  maxSizeMB: number = 10
): Promise<boolean> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const sizeMB = blob.size / (1024 * 1024);
    return sizeMB <= maxSizeMB;
  } catch (error) {
    console.error('Error al validar tamaño:', error);
    return false;
  }
};

/**
 * Comprimir imagen antes de subir (reducir calidad)
 * Usar con expo-image-manipulator
 */
export const compressImage = async (
  uri: string,
  quality: number = 0.7
): Promise<string> => {
  // TODO: Implementar con expo-image-manipulator si es necesario
  // Por ahora, retornar la URI original
  return uri;
};

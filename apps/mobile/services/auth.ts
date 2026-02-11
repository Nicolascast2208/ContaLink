import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  UserCredential,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

/**
 * Registrar nuevo usuario con email y contraseña
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Actualizar perfil con nombre
    await updateProfile(userCredential.user, { displayName });
    
    return userCredential;
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

/**
 * Iniciar sesión con email y contraseña
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

/**
 * Cerrar sesión
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

/**
 * Enviar email de recuperación de contraseña
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

/**
 * Iniciar sesión con Google
 * Requiere configuración de OAuth en Firebase Console y Google Cloud Console
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    // TODO: Configurar Google Sign-In con el clientId correcto
    // Obtener de: Google Cloud Console > APIs & Services > Credentials
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
    
    if (!clientId) {
      throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID no está configurado');
    }

    // En web, usar el flujo estándar de Google
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const result = await signInWithCredential(auth, GoogleAuthProvider.credential());
      return result;
    }

    // En móvil, usar expo-auth-session
    // Nota: Esto requiere configuración adicional en app.config.ts
    throw new Error('Google Sign-In requiere configuración adicional en móvil');
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

/**
 * Obtener el usuario actual
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Manejar errores de autenticación y devolver mensajes amigables
 */
const handleAuthError = (error: any): Error => {
  const errorCode = error.code;
  
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
    'auth/invalid-email': 'Correo electrónico inválido',
    'auth/operation-not-allowed': 'Operación no permitida',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'auth/invalid-credential': 'Credenciales inválidas',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de inicio de sesión'
  };

  const message = errorMessages[errorCode] || error.message || 'Error de autenticación';
  
  return new Error(message);
};

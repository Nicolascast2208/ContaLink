import { Timestamp } from 'firebase/firestore';

/**
 * Usuario de la aplicación
 */
export interface AppUser {
  uid: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  
  // Empresa por defecto (última usada)
  defaultCompanyId: string | null;
  
  // Configuración de usuario
  preferences?: {
    language: 'es' | 'en';
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
  };
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  
  // Auth providers usados
  providers: ('password' | 'google.com')[];
}

/**
 * Tipo para crear un nuevo usuario
 */
export type CreateUserInput = Omit<AppUser, 'uid' | 'createdAt' | 'providers'> & {
  uid: string;
  createdAt?: Timestamp;
  providers?: ('password' | 'google.com')[];
};

/**
 * Tipo para actualizar un usuario
 */
export type UpdateUserInput = Partial<Omit<AppUser, 'uid' | 'email' | 'createdAt'>> & {
  uid: string;
};

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

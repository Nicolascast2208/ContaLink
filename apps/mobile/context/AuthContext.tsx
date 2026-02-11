import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUser, createUser } from '../services/firestore';
import { AppUser, AuthState } from '../types';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            // Obtener datos del usuario desde Firestore
            let appUser = await getUser(firebaseUser.uid);
            
            // Si no existe en Firestore, crearlo
            if (!appUser) {
              const providers = firebaseUser.providerData.map(
                p => p.providerId as 'password' | 'google.com'
              );
              
              await createUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                photoURL: firebaseUser.photoURL || undefined,
                defaultCompanyId: null,
                createdAt: Timestamp.now(),
                providers
              });
              
              appUser = await getUser(firebaseUser.uid);
            }
            
            setState({
              user: appUser,
              isLoading: false,
              isAuthenticated: true,
              error: null
            });
          } catch (error: any) {
            console.error('Error al cargar usuario:', error);
            setState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: error.message
            });
          }
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null
          });
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const appUser = await getUser(auth.currentUser.uid);
      setState(prev => ({ ...prev, user: appUser }));
    }
  };

  const value: AuthContextType = {
    ...state,
    signOut,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

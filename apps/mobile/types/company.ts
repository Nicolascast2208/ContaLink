import { Timestamp } from 'firebase/firestore';

/**
 * Roles de usuario dentro de una empresa
 */
export type CompanyRole = 
  | 'admin'     // Puede todo: invitar usuarios, editar empresa, eliminar facturas
  | 'editor'    // Puede crear y editar facturas
  | 'viewer';   // Solo lectura

/**
 * Miembro de una empresa
 */
export interface CompanyMember {
  userId: string;
  email: string;
  displayName: string;
  role: CompanyRole;
  joinedAt: Timestamp;
  invitedBy: string; // User ID de quien lo invitó
}

/**
 * Empresa/organización
 */
export interface Company {
  id: string;
  
  // Datos del SII
  rut: string;              // RUT con formato XX.XXX.XXX-X
  razonSocial: string;      // Razón social oficial
  nombreFantasia?: string;  // Nombre comercial
  giro: string;             // Actividad económica principal
  
  // Dirección
  direccion: string;
  comuna: string;
  ciudad: string;
  region?: string;
  
  // Contacto
  telefono?: string;
  email?: string;
  
  // Metadatos
  createdAt: Timestamp;
  createdBy: string;        // User ID del creador
  updatedAt?: Timestamp;
  
  // Estadísticas (desnormalizadas para performance)
  stats?: {
    totalInvoices: number;
    totalAmount: number;
    lastInvoiceDate: Timestamp | null;
  };
}

/**
 * Tipo para crear una nueva empresa
 */
export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'stats'> & {
  createdAt?: Timestamp;
};

/**
 * Tipo para actualizar una empresa
 */
export type UpdateCompanyInput = Partial<Omit<Company, 'id' | 'createdAt' | 'createdBy'>> & {
  id: string;
};

/**
 * Invitación a empresa (documento temporal)
 */
export interface CompanyInvitation {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  role: CompanyRole;
  invitedBy: string;
  invitedByName: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

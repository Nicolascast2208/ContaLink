import { Timestamp } from 'firebase/firestore';

/**
 * Tipos de documentos tributarios chilenos
 */
export type InvoiceType = 
  | 'factura'           // Factura electrónica
  | 'boleta'            // Boleta electrónica
  | 'nota_credito'      // Nota de crédito
  | 'nota_debito'       // Nota de débito
  | 'guia_despacho'     // Guía de despacho
  | 'factura_exenta'    // Factura exenta
  | 'comprobante';      // Otros comprobantes

/**
 * Estados del procesamiento OCR
 */
export type InvoiceStatus =
  | 'pending_ocr'       // Esperando procesamiento OCR
  | 'processing'        // En proceso de OCR
  | 'ocr_done'          // OCR completado exitosamente
  | 'verified'          // Datos verificados por el usuario
  | 'error'             // Error en el procesamiento
  | 'rejected';         // Rechazada por el usuario

/**
 * Item individual de una factura
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
}

/**
 * Estructura completa de una factura/documento tributario
 */
export interface Invoice {
  id: string;
  
  // Tipo y número
  type: InvoiceType;
  number: number;
  date: Timestamp;
  
  // Emisor (quien emite la factura)
  emisorRut: string;
  emisorRazonSocial: string;
  emisorDireccion?: string;
  emisorGiro?: string;
  emisorComuna?: string;
  emisorCiudad?: string;
  emisorTelefono?: string;
  
  // Receptor (quien recibe la factura)
  receptorRut: string;
  receptorRazonSocial: string;
  receptorDireccion?: string;
  receptorComuna?: string;
  receptorCiudad?: string;
  
  // Montos
  netoAmount: number;        // Monto neto (sin IVA)
  ivaAmount: number;         // IVA (19%)
  totalAmount: number;       // Total a pagar
  exentoAmount?: number;     // Monto exento (si aplica)
  descuentoAmount?: number;  // Descuento global
  
  // Items/detalles
  items: InvoiceItem[];
  
  // Metadatos de procesamiento
  status: InvoiceStatus;
  imageUrl: string;          // URL en Firebase Storage
  ocrRawText: string;        // Texto completo extraído por OCR
  errorMessage?: string;     // Mensaje de error si status === 'error'
  
  // Auditoría
  createdAt: Timestamp;
  processedAt: Timestamp | null;
  verifiedAt: Timestamp | null;
  createdBy: string;         // User ID
  companyId: string;         // Empresa a la que pertenece
  
  // Campos opcionales adicionales
  folio?: string;            // Folio del documento
  observaciones?: string;    // Observaciones del documento
  formaPago?: string;        // Forma de pago (contado, crédito)
  condicionesPago?: string;  // Condiciones de pago
}

/**
 * Tipo para crear una nueva factura (sin campos auto-generados)
 */
export type CreateInvoiceInput = Omit<Invoice, 'id' | 'createdAt' | 'processedAt' | 'verifiedAt'> & {
  createdAt?: Timestamp;
};

/**
 * Tipo para actualizar una factura (todos los campos opcionales excepto id)
 */
export type UpdateInvoiceInput = Partial<Omit<Invoice, 'id'>> & {
  id: string;
};

/**
 * Filtros para buscar facturas
 */
export interface InvoiceFilters {
  type?: InvoiceType;
  status?: InvoiceStatus;
  emisorRut?: string;
  receptorRut?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Resultado de búsqueda con paginación
 */
export interface InvoiceSearchResult {
  invoices: Invoice[];
  totalCount: number;
  hasMore: boolean;
  lastVisible?: any; // DocumentSnapshot para paginación
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  addDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import {
  AppUser,
  CreateUserInput,
  UpdateUserInput,
  Company,
  CreateCompanyInput,
  UpdateCompanyInput,
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
  InvoiceSearchResult
} from '../types';

// ======================
// USUARIOS
// ======================

/**
 * Crear un nuevo usuario en Firestore
 */
export const createUser = async (userData: CreateUserInput): Promise<void> => {
  const userRef = doc(db, 'users', userData.uid);
  const data = {
    ...userData,
    createdAt: userData.createdAt || Timestamp.now(),
    providers: userData.providers || []
  };
  await setDoc(userRef, data);
};

/**
 * Obtener datos de un usuario
 */
export const getUser = async (uid: string): Promise<AppUser | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  return { uid: userSnap.id, ...userSnap.data() } as AppUser;
};

/**
 * Actualizar datos de un usuario
 */
export const updateUser = async (data: UpdateUserInput): Promise<void> => {
  const { uid, ...updateData } = data;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updateData,
    updatedAt: Timestamp.now()
  });
};

// ======================
// EMPRESAS
// ======================

/**
 * Crear una nueva empresa
 */
export const createCompany = async (companyData: CreateCompanyInput): Promise<string> => {
  const companiesRef = collection(db, 'companies');
  const data = {
    ...companyData,
    createdAt: companyData.createdAt || Timestamp.now()
  };
  const docRef = await addDoc(companiesRef, data);
  return docRef.id;
};

/**
 * Obtener datos de una empresa
 */
export const getCompany = async (companyId: string): Promise<Company | null> => {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);
  
  if (!companySnap.exists()) {
    return null;
  }
  
  return { id: companySnap.id, ...companySnap.data() } as Company;
};

/**
 * Actualizar datos de una empresa
 */
export const updateCompany = async (data: UpdateCompanyInput): Promise<void> => {
  const { id, ...updateData } = data;
  const companyRef = doc(db, 'companies', id);
  await updateDoc(companyRef, {
    ...updateData,
    updatedAt: Timestamp.now()
  });
};

/**
 * Obtener empresas de un usuario
 */
export const getUserCompanies = async (userId: string): Promise<Company[]> => {
  const companiesRef = collection(db, 'companies');
  const q = query(
    companiesRef,
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Company[];
};

// ======================
// FACTURAS
// ======================

/**
 * Crear una nueva factura
 */
export const createInvoice = async (
  companyId: string,
  invoiceData: CreateInvoiceInput
): Promise<string> => {
  const invoicesRef = collection(db, 'companies', companyId, 'invoices');
  const data = {
    ...invoiceData,
    companyId,
    createdAt: invoiceData.createdAt || Timestamp.now()
  };
  const docRef = await addDoc(invoicesRef, data);
  return docRef.id;
};

/**
 * Obtener una factura específica
 */
export const getInvoice = async (
  companyId: string,
  invoiceId: string
): Promise<Invoice | null> => {
  const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
  const invoiceSnap = await getDoc(invoiceRef);
  
  if (!invoiceSnap.exists()) {
    return null;
  }
  
  return { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
};

/**
 * Actualizar una factura
 */
export const updateInvoice = async (
  companyId: string,
  data: UpdateInvoiceInput
): Promise<void> => {
  const { id, ...updateData } = data;
  const invoiceRef = doc(db, 'companies', companyId, 'invoices', id);
  await updateDoc(invoiceRef, updateData);
};

/**
 * Eliminar una factura
 */
export const deleteInvoice = async (
  companyId: string,
  invoiceId: string
): Promise<void> => {
  const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
  await deleteDoc(invoiceRef);
};

/**
 * Buscar facturas con filtros y paginación
 */
export const searchInvoices = async (
  companyId: string,
  filters: InvoiceFilters = {},
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<InvoiceSearchResult> => {
  const invoicesRef = collection(db, 'companies', companyId, 'invoices');
  const constraints: QueryConstraint[] = [];
  
  // Aplicar filtros
  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.emisorRut) {
    constraints.push(where('emisorRut', '==', filters.emisorRut));
  }
  if (filters.receptorRut) {
    constraints.push(where('receptorRut', '==', filters.receptorRut));
  }
  if (filters.dateFrom) {
    constraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
  }
  if (filters.dateTo) {
    constraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)));
  }
  
  // Ordenar por fecha descendente
  constraints.push(orderBy('date', 'desc'));
  
  // Paginación
  constraints.push(limit(pageSize + 1)); // +1 para saber si hay más
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  const q = query(invoicesRef, ...constraints);
  const snapshot = await getDocs(q);
  
  const hasMore = snapshot.docs.length > pageSize;
  const invoices = snapshot.docs
    .slice(0, pageSize)
    .map(doc => ({ id: doc.id, ...doc.data() })) as Invoice[];
  
  return {
    invoices,
    totalCount: invoices.length,
    hasMore,
    lastVisible: invoices.length > 0 ? snapshot.docs[pageSize - 1] : undefined
  };
};

/**
 * Escuchar cambios en tiempo real de las facturas de una empresa
 */
export const subscribeToInvoices = (
  companyId: string,
  callback: (invoices: Invoice[]) => void,
  filters: InvoiceFilters = {}
): Unsubscribe => {
  const invoicesRef = collection(db, 'companies', companyId, 'invoices');
  const constraints: QueryConstraint[] = [];
  
  // Aplicar filtros
  if (filters.type) {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(50)); // Limitar a 50 para performance
  
  const q = query(invoicesRef, ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invoice[];
    callback(invoices);
  });
};

/**
 * Obtener estadísticas de facturas de una empresa
 */
export const getInvoiceStats = async (companyId: string) => {
  const invoicesRef = collection(db, 'companies', companyId, 'invoices');
  
  // Total de facturas
  const allQuery = query(invoicesRef);
  const allSnapshot = await getDocs(allQuery);
  const totalInvoices = allSnapshot.size;
  
  // Facturas por procesar
  const pendingQuery = query(
    invoicesRef,
    where('status', '==', 'pending_ocr')
  );
  const pendingSnapshot = await getDocs(pendingQuery);
  const pendingInvoices = pendingSnapshot.size;
  
  // Calcular monto total
  let totalAmount = 0;
  allSnapshot.forEach(doc => {
    const invoice = doc.data() as Invoice;
    totalAmount += invoice.totalAmount || 0;
  });
  
  return {
    totalInvoices,
    pendingInvoices,
    totalAmount
  };
};

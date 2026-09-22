import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { 
  getFirestore, 
  setLogLevel,
  doc, 
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  type Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicialización de la aplicación de Firebase (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enviar enlace de restablecimiento / cambio de contraseña por correo electrónico
export async function enviarEnlaceRecuperacion(email: string): Promise<{ success: boolean; mensaje: string; tipo: 'ok' | 'err' }> {
  const emailLimpio = email.trim().toLowerCase();
  if (!emailLimpio || !emailLimpio.includes('@')) {
    return {
      success: false,
      mensaje: 'Por favor ingrese una dirección de correo o Gmail válida.',
      tipo: 'err'
    };
  }

  try {
    await sendPasswordResetEmail(auth, emailLimpio);
    return {
      success: true,
      mensaje: `¡Enlace de cambio de contraseña enviado exitosamente a ${emailLimpio}! Revisa tu bandeja de entrada o spam. Recuerda abrir el correo más reciente recibido.`,
      tipo: 'ok'
    };
  } catch (error: any) {
    console.warn('Firebase sendPasswordResetEmail error:', error);
    if (error.code === 'auth/user-not-found') {
      return {
        success: false,
        mensaje: `El correo "${emailLimpio}" no está registrado aún en Firebase Auth.`,
        tipo: 'err'
      };
    } else if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        mensaje: `El formato de correo "${emailLimpio}" no es válido.`,
        tipo: 'err'
      };
    } else if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        mensaje: 'Se han solicitado demasiados enlaces en poco tiempo. Por favor espera unos minutos antes de intentar de nuevo.',
        tipo: 'err'
      };
    } else {
      return {
        success: false,
        mensaje: error.message || 'No se pudo enviar el enlace en este momento.',
        tipo: 'err'
      };
    }
  }
}

// Verificar código de restablecimiento de contraseña
export async function verificarCodigoRestablecimiento(oobCode: string): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return { success: true, email };
  } catch (err: any) {
    console.warn('Error al verificar código de restablecimiento:', err);
    return {
      success: false,
      error: err?.code === 'auth/expired-action-code'
        ? 'El enlace de restablecimiento ha expirado o ya fue utilizado.'
        : 'El código de restablecimiento no es válido o ya caducó.'
    };
  }
}

// Confirmar cambio de contraseña usando el código recibido en el enlace
export async function restablecerPasswordConCodigo(oobCode: string, nuevaPassword: string): Promise<{ success: boolean; mensaje: string }> {
  try {
    await confirmPasswordReset(auth, oobCode, nuevaPassword);
    return {
      success: true,
      mensaje: '¡Contraseña actualizada exitosamente en Firebase! Ya puedes iniciar sesión con tu nueva contraseña.'
    };
  } catch (err: any) {
    console.warn('Error al confirmar nueva contraseña:', err);
    if (err?.code === 'auth/expired-action-code') {
      return {
        success: false,
        mensaje: 'El enlace ha expirado o ya fue utilizado. Por favor solicita uno nuevo.'
      };
    } else if (err?.code === 'auth/weak-password') {
      return {
        success: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres.'
      };
    }
    return {
      success: false,
      mensaje: err?.message || 'Error al restablecer la contraseña.'
    };
  }
}

// Silenciar avisos de desconexión transitoria / reconexión de Firestore en consola
try {
  setLogLevel('error');
} catch {
  // Ignorar en entornos donde no aplique
}

// Inicializar Firestore con la base de datos configurada en firebase-applet-config.json
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db: Firestore = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Validar la conexión con Firestore de manera opcional y no bloqueante
export async function validarConexionFirestore(): Promise<boolean> {
  try {
    const docSnap = await getDoc(doc(db, 'test', 'connection'));
    return docSnap.exists();
  } catch {
    return false;
  }
}

// Servicios de sincronización para entidades del sistema
export const firestoreSync = {
  // Guardar o actualizar un documento individual
  async guardarDocumento(coleccion: string, id: string, datos: any): Promise<void> {
    try {
      const docRef = doc(db, coleccion, String(id));
      await setDoc(docRef, { ...datos, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err: any) {
      if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
        console.warn(`Error al sincronizar con Firestore [${coleccion}/${id}]:`, err?.message || err);
      }
    }
  },

  // Eliminar un documento
  async eliminarDocumento(coleccion: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, coleccion, String(id));
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Error al eliminar de Firestore [${coleccion}/${id}]:`, err);
    }
  },

  // Obtener todos los documentos de una colección
  async obtenerColeccion<T>(coleccion: string): Promise<T[]> {
    try {
      const colRef = collection(db, coleccion);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(d => d.data() as T);
    } catch (err: any) {
      if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
        console.warn(`Sincronización Firestore [${coleccion}]:`, err?.message || err);
      }
      return [];
    }
  },

  // Guardar un lote de documentos (ej. importación o sincronización inicial)
  async guardarLote(coleccion: string, items: Array<{ id: string; data: any }>): Promise<void> {
    if (!items.length) return;
    try {
      const batch = writeBatch(db);
      for (const item of items.slice(0, 450)) { // Límite de 500 por batch en Firestore
        const ref = doc(db, coleccion, String(item.id));
        batch.set(ref, { ...item.data, updatedAt: new Date().toISOString() }, { merge: true });
      }
      await batch.commit();
    } catch (err: any) {
      if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
        console.warn(`Error en batch de Firestore [${coleccion}]:`, err?.message || err);
      }
    }
  }
};

'use client';

/**
 * Limpia todo el storage del navegador para evitar QuotaExceededError
 * Se ejecuta automáticamente al cargar la app
 */

export function clearAllStorage() {
   try {
     // Limpiar localStorage
     localStorage.clear();
     
     // Limpiar sessionStorage
     sessionStorage.clear();
     
     // Limpiar IndexedDB
     if (typeof indexedDB !== 'undefined') {
       indexedDB.databases().then(dbs => {
         dbs.forEach(db => {
           try {
             // ✅ Type guard: verificar que db.name no es undefined
             if (db.name) {
               indexedDB.deleteDatabase(db.name);
             }
           } catch (e) {
             console.error(`Failed to delete database ${db.name}:`, e);
           }
         });
       });
     }
     
     console.log('✅ Storage cleared successfully');
   } catch (error) {
     console.error('Error clearing storage:', error);
   }
}

/**
 * Limpia un item específico del localStorage de forma segura
 * Itera sobre todas las claves y las elimina una por una
 */
export function clearLocalStorageSafely() {
   try {
     // ✅ Iterar de forma segura verificando null
     for (let i = localStorage.length - 1; i >= 0; i--) {
       const key = localStorage.key(i);
       if (key) {  // ✅ Type guard: verificar que key no es null
         localStorage.removeItem(key);
       }
     }
     console.log('✅ LocalStorage cleared safely');
   } catch (error) {
     console.error('Error clearing localStorage safely:', error);
   }
}

// Auto-clear on first load if storage is corrupted
if (typeof window !== 'undefined') {
  try {
    localStorage.setItem('_test', '1');
    localStorage.removeItem('_test');
  } catch (e) {
    console.warn('⚠️  Storage quota exceeded, auto-clearing...');
    clearAllStorage();
  }
}

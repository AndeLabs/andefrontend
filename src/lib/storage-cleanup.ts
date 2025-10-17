'use client';

/**
 * Limpia localStorage de datos obsoletos de Wagmi/Firebase/Genkit
 * Se ejecuta una sola vez al cargar la app
 * 
 * Problemas que resuelve:
 * - QuotaExceededError: localStorage lleno por datos de múltiples wallets
 * - Conflictos de window.ethereum por múltiples extensiones
 */
export function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return;

  try {
    // Verificar si ya se ejecutó la limpieza en esta sesión
    const cleanupMarker = '__storage_cleanup_v1_done';
    if (localStorage.getItem(cleanupMarker) === 'true') {
      return;
    }

    // Claves a limpiar (Firebase, Genkit, SIWE, Wagmi antiguo, etc.)
    const keysToRemove = [
      'firebase:',
      'genkit',
      'siwe',
      'andechain-wallet.store', // Wagmi storage antiguo
      'andechain-wallet', // Wagmi storage antiguo
      '__FIREBASE_DEFAULTS__',
      '__FIREBASE_ANALYTICS_DISABLED__',
    ];

    let cleanedCount = 0;
    const keysToDelete: string[] = [];

    // Identificar claves a eliminar
    Object.keys(localStorage).forEach((key) => {
      if (keysToRemove.some((prefix) => key.startsWith(prefix))) {
        keysToDelete.push(key);
      }
    });

    // Eliminar claves
    keysToDelete.forEach((key) => {
      try {
        localStorage.removeItem(key);
        cleanedCount++;
        console.log(`[Storage] Cleaned: ${key}`);
      } catch (e) {
        console.warn(`[Storage] Failed to remove ${key}:`, e);
      }
    });

    // Marcar que la limpieza se ejecutó
    try {
      localStorage.setItem(cleanupMarker, 'true');
    } catch (e) {
      console.warn('[Storage] Could not set cleanup marker:', e);
    }

    if (cleanedCount > 0) {
      console.log(`[Storage] Cleanup complete: ${cleanedCount} items removed`);
    }
  } catch (e) {
    console.error('[Storage] Cleanup failed:', e);
  }
}

/**
 * Obtiene el tamaño aproximado del localStorage en bytes
 * Útil para debugging
 */
export function getLocalStorageSize(): number {
  if (typeof window === 'undefined') return 0;

  let size = 0;
  try {
    Object.keys(localStorage).forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    });
  } catch (e) {
    console.error('[Storage] Failed to calculate size:', e);
  }
  return size;
}

/**
 * Obtiene información de debugging del storage
 */
export function getStorageDebugInfo() {
  if (typeof window === 'undefined') return null;

  try {
    const size = getLocalStorageSize();
    const keys = Object.keys(localStorage);
    const largeKeys = keys
      .map((key) => ({
        key,
        size: (localStorage.getItem(key) || '').length,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    return {
      totalSize: size,
      totalKeys: keys.length,
      largestKeys: largeKeys,
      keys: keys,
    };
  } catch (e) {
    console.error('[Storage] Failed to get debug info:', e);
    return null;
  }
}

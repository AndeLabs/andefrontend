'use client';

/**
 * Storage Cleanup Utility
 * Cleans up legacy/corrupted storage without affecting Wagmi persistence
 */

const WAGMI_KEYS = [
  'wagmi.',
  'andechain-wagmi',
  'wc@2:',
  'WALLETCONNECT',
];

/**
 * Checks if a localStorage key should be preserved (Wagmi-related)
 */
function shouldPreserveKey(key: string): boolean {
  return WAGMI_KEYS.some(prefix => key.startsWith(prefix));
}

/**
 * Cleans up corrupted or legacy storage entries
 * Preserves Wagmi connection state for better UX
 */
export function clearAllStorage() {
  if (typeof window === 'undefined') return;

  try {
    // Clean localStorage selectively
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !shouldPreserveKey(key)) {
        keysToRemove.push(key);
      }
    }

    // Remove non-Wagmi keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Failed to remove ${key}:`, e);
      }
    });

    console.log(`✅ Cleaned ${keysToRemove.length} storage items (preserved Wagmi data)`);
  } catch (error) {
    console.error('Error cleaning storage:', error);
  }
}

/**
 * Clears ALL storage including Wagmi (use only for troubleshooting)
 */
export function clearAllStorageForce() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    if (typeof indexedDB !== 'undefined') {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
    
    console.log('⚠️ FORCE CLEAR: All storage cleared including wallet connection');
  } catch (error) {
    console.error('Error force clearing storage:', error);
  }
}

/**
 * Clears only legacy/corrupted entries safely
 */
export function clearLocalStorageSafely() {
  try {
    const keysToCheck = ['_legacy', '_old', 'temp_', 'cache_'];
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key) {
        // Remove known legacy keys
        if (keysToCheck.some(prefix => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      }
    }
    
    console.log('✅ Legacy storage items cleared');
  } catch (error) {
    console.error('Error clearing legacy storage:', error);
  }
}

// Only run cleanup on first load if there's a storage error
if (typeof window !== 'undefined') {
  try {
    // Test if storage is working
    localStorage.setItem('_test', '1');
    localStorage.removeItem('_test');
  } catch (e) {
    console.warn('⚠️ Storage quota exceeded, cleaning up...');
    clearAllStorage(); // Selective cleanup
  }
}

// Expose force clear to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__clearStorageForce = clearAllStorageForce;
  console.log('💡 Debug: Run __clearStorageForce() in console to reset all storage');
}
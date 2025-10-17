/**
 * Safe Storage Wrapper
 * 
 * Proporciona acceso seguro a localStorage con manejo de errores
 * para evitar QuotaExceededError y otros problemas de storage.
 * 
 * ✅ Maneja SSR (server-side rendering)
 * ✅ Captura QuotaExceededError
 * ✅ Verifica disponibilidad de espacio
 * ✅ Logging de errores para debugging
 */

import { logger } from './logger';

export const safeStorage = {
  /**
   * Obtener valor de localStorage de forma segura
   */
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (error) {
      logger.warn('localStorage.getItem error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  /**
   * Guardar valor en localStorage de forma segura
   */
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          logger.error('localStorage quota exceeded', {
            key,
            valueLength: value.length,
            error: error.message,
          });
        } else {
          logger.warn('localStorage.setItem error', {
            key,
            error: error.message,
          });
        }
      }
      return false;
    }
  },

  /**
   * Eliminar valor de localStorage de forma segura
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.warn('localStorage.removeItem error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },

  /**
   * Limpiar múltiples keys de localStorage
   */
  removeItems: (keys: string[]): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      logger.warn('localStorage.removeItems error', {
        keysCount: keys.length,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },

  /**
   * Verificar si hay espacio disponible en localStorage
   * Retorna: 1 si hay espacio, 0 si no hay espacio, -1 si hay error
   */
  checkAvailableSpace: (): number => {
    try {
      if (typeof window === 'undefined') return -1;

      const test = '__storage_test__';
      const testValue = 'test';

      // Intentar escribir
      localStorage.setItem(test, testValue);

      // Si llegamos aquí, hay espacio
      localStorage.removeItem(test);
      return 1;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.warn('localStorage quota exceeded', {
          error: error.message,
        });
        return 0;
      }
      logger.warn('localStorage space check error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return -1;
    }
  },

  /**
   * Obtener tamaño aproximado de localStorage en bytes
   */
  getApproximateSize: (): number => {
    try {
      if (typeof window === 'undefined') return 0;

      let size = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const item = localStorage.getItem(key);
          if (item) {
            size += key.length + item.length;
          }
        }
      }
      return size;
    } catch (error) {
      logger.warn('localStorage size calculation error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  },

  /**
   * Limpiar todo localStorage (usar con cuidado)
   */
  clear: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.clear();
      return true;
    } catch (error) {
      logger.warn('localStorage.clear error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },
};

/**
 * Storage keys para persistencia de wallet
 */
export const WALLET_STORAGE_KEYS = {
  // Wagmi maneja automáticamente estas keys:
  // - 'wagmi.store' - estado de conexión
  // - 'wagmi.cache' - cache de datos
  // - 'wagmi.recentConnectorId' - último conector usado

  // Keys personalizadas (si es necesario):
  LAST_CONNECTION_TIME: 'andechain-last-connection-time',
  SESSION_TIMEOUT: 'andechain-session-timeout',
  WALLET_PREFERENCES: 'andechain-wallet-preferences',
} as const;

/**
 * Configuración de sesión
 */
export const SESSION_CONFIG = {
  // Timeout de sesión: 24 horas
  TIMEOUT_MS: 24 * 60 * 60 * 1000,

  // Intervalo de actualización de timestamp: 5 minutos
  UPDATE_INTERVAL_MS: 5 * 60 * 1000,
} as const;

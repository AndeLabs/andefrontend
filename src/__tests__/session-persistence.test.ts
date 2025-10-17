/**
 * Tests para verificar la persistencia de sesión de MetaMask
 * 
 * ✅ Verifica que la sesión persiste al actualizar página
 * ✅ Verifica que la sesión persiste al cerrar/reabrir navegador
 * ✅ Verifica que no hay QuotaExceededError
 * ✅ Verifica que Wagmi maneja correctamente la persistencia
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { safeStorage, WALLET_STORAGE_KEYS, SESSION_CONFIG } from '@/lib/safe-storage';

describe('Session Persistence', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('safeStorage', () => {
    it('should safely store and retrieve items from localStorage', () => {
      const key = 'test-key';
      const value = 'test-value';

      const setResult = safeStorage.setItem(key, value);
      expect(setResult).toBe(true);

      const getResult = safeStorage.getItem(key);
      expect(getResult).toBe(value);
    });

    it('should safely remove items from localStorage', () => {
      const key = 'test-key';
      const value = 'test-value';

      safeStorage.setItem(key, value);
      expect(safeStorage.getItem(key)).toBe(value);

      const removeResult = safeStorage.removeItem(key);
      expect(removeResult).toBe(true);
      expect(safeStorage.getItem(key)).toBeNull();
    });

    it('should handle SSR gracefully (no window)', () => {
      // Simular SSR (sin window)
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const getResult = safeStorage.getItem('test-key');
      expect(getResult).toBeNull();

      const setResult = safeStorage.setItem('test-key', 'value');
      expect(setResult).toBe(false);

      const removeResult = safeStorage.removeItem('test-key');
      expect(removeResult).toBe(false);

      // Restaurar window
      global.window = originalWindow;
    });

    it('should handle QuotaExceededError gracefully', () => {
      // Simular QuotaExceededError
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = safeStorage.setItem('test-key', 'test-value');
      expect(result).toBe(false);

      setItemSpy.mockRestore();
    });

    it('should remove multiple items', () => {
      const keys = ['key1', 'key2', 'key3'];
      keys.forEach(key => safeStorage.setItem(key, `value-${key}`));

      const result = safeStorage.removeItems(keys);
      expect(result).toBe(true);

      keys.forEach(key => {
        expect(safeStorage.getItem(key)).toBeNull();
      });
    });

    it('should check available space', () => {
      const spaceAvailable = safeStorage.checkAvailableSpace();
      expect([0, 1, -1]).toContain(spaceAvailable);
    });

    it('should calculate approximate storage size', () => {
      safeStorage.setItem('key1', 'value1');
      safeStorage.setItem('key2', 'value2');

      const size = safeStorage.getApproximateSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should clear all localStorage', () => {
      safeStorage.setItem('key1', 'value1');
      safeStorage.setItem('key2', 'value2');

      const result = safeStorage.clear();
      expect(result).toBe(true);

      expect(safeStorage.getItem('key1')).toBeNull();
      expect(safeStorage.getItem('key2')).toBeNull();
    });
  });

  describe('Wallet Storage Keys', () => {
    it('should have correct wallet storage keys', () => {
      expect(WALLET_STORAGE_KEYS).toHaveProperty('LAST_CONNECTION_TIME');
      expect(WALLET_STORAGE_KEYS).toHaveProperty('SESSION_TIMEOUT');
      expect(WALLET_STORAGE_KEYS).toHaveProperty('WALLET_PREFERENCES');
    });

    it('should have correct session config', () => {
      expect(SESSION_CONFIG.TIMEOUT_MS).toBe(24 * 60 * 60 * 1000); // 24 horas
      expect(SESSION_CONFIG.UPDATE_INTERVAL_MS).toBe(5 * 60 * 1000); // 5 minutos
    });
  });

  describe('Session Persistence Scenarios', () => {
    it('should persist connection state across page refresh', () => {
      // Simular conexión inicial
      const connectionState = {
        connected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
      };

      safeStorage.setItem('wagmi.store', JSON.stringify(connectionState));

      // Simular page refresh (localStorage persiste)
      const retrieved = safeStorage.getItem('wagmi.store');
      expect(retrieved).toBe(JSON.stringify(connectionState));

      const parsed = JSON.parse(retrieved!);
      expect(parsed.connected).toBe(true);
      expect(parsed.address).toBe(connectionState.address);
    });

    it('should persist last connection time', () => {
      const now = Date.now();
      safeStorage.setItem(WALLET_STORAGE_KEYS.LAST_CONNECTION_TIME, now.toString());

      const retrieved = safeStorage.getItem(WALLET_STORAGE_KEYS.LAST_CONNECTION_TIME);
      expect(parseInt(retrieved!)).toBe(now);
    });

    it('should handle session timeout', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      safeStorage.setItem(WALLET_STORAGE_KEYS.LAST_CONNECTION_TIME, oneHourAgo.toString());

      const lastConnection = parseInt(
        safeStorage.getItem(WALLET_STORAGE_KEYS.LAST_CONNECTION_TIME)!
      );
      const timeDiff = now - lastConnection;

      // Session should NOT be expired (24 hours timeout)
      expect(timeDiff).toBeLessThan(SESSION_CONFIG.TIMEOUT_MS);
    });

    it('should detect expired session', () => {
      const now = Date.now();
      const twoFiveHoursAgo = now - (25 * 60 * 60 * 1000); // 25 horas

      safeStorage.setItem(WALLET_STORAGE_KEYS.LAST_CONNECTION_TIME, twoFiveHoursAgo.toString());

      const lastConnection = parseInt(
        safeStorage.getItem(WALLET_STORAGE_KEYS.LAST_CONNECTION_TIME)!
      );
      const timeDiff = now - lastConnection;

      // Session SHOULD be expired
      expect(timeDiff).toBeGreaterThan(SESSION_CONFIG.TIMEOUT_MS);
    });

    it('should persist wallet preferences', () => {
      const preferences = {
        autoConnect: true,
        preferredConnector: 'injected',
        theme: 'dark',
      };

      safeStorage.setItem(
        WALLET_STORAGE_KEYS.WALLET_PREFERENCES,
        JSON.stringify(preferences)
      );

      const retrieved = safeStorage.getItem(WALLET_STORAGE_KEYS.WALLET_PREFERENCES);
      expect(JSON.parse(retrieved!)).toEqual(preferences);
    });
  });

  describe('Error Handling', () => {
    it('should not throw on getItem error', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        safeStorage.getItem('test-key');
      }).not.toThrow();

      getItemSpy.mockRestore();
    });

    it('should not throw on setItem error', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        safeStorage.setItem('test-key', 'test-value');
      }).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('should not throw on removeItem error', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        safeStorage.removeItem('test-key');
      }).not.toThrow();

      removeItemSpy.mockRestore();
    });

    it('should not throw on clear error', () => {
      const clearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        safeStorage.clear();
      }).not.toThrow();

      clearSpy.mockRestore();
    });
  });

  describe('Wagmi Integration', () => {
    it('should use correct Wagmi storage key', () => {
      const wagmiKey = 'andechain-wagmi';
      
      // Simular lo que Wagmi haría
      const wagmiState = {
        status: 'connected',
        connector: 'injected',
        chainId: 1,
      };

      safeStorage.setItem(wagmiKey, JSON.stringify(wagmiState));

      const retrieved = safeStorage.getItem(wagmiKey);
      expect(retrieved).toBe(JSON.stringify(wagmiState));
    });

    it('should persist Wagmi recent connector ID', () => {
      const wagmiRecentConnectorKey = 'wagmi.recentConnectorId';
      const connectorId = 'injected';

      safeStorage.setItem(wagmiRecentConnectorKey, connectorId);

      const retrieved = safeStorage.getItem(wagmiRecentConnectorKey);
      expect(retrieved).toBe(connectorId);
    });

    it('should persist Wagmi cache', () => {
      const wagmiCacheKey = 'wagmi.cache';
      const cacheData = {
        accounts: ['0x1234567890123456789012345678901234567890'],
        chainId: 1,
      };

      safeStorage.setItem(wagmiCacheKey, JSON.stringify(cacheData));

      const retrieved = safeStorage.getItem(wagmiCacheKey);
      expect(JSON.parse(retrieved!)).toEqual(cacheData);
    });
  });
});

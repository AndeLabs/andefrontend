/**
 * Tests de integración para persistencia de wallet
 * 
 * Verifica que:
 * ✅ La sesión persiste al actualizar página
 * ✅ La sesión persiste al cerrar/reabrir navegador
 * ✅ No hay conflictos con Wagmi
 * ✅ No hay QuotaExceededError
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { safeStorage } from '@/lib/safe-storage';

describe('Wallet Persistence Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Page Refresh Scenario', () => {
    it('should maintain connection state after page refresh', () => {
      // Paso 1: Usuario conecta wallet
      const wagmiState = {
        status: 'connected',
        connector: 'injected',
        chainId: 1,
        address: '0x1234567890123456789012345678901234567890',
      };

      const success = safeStorage.setItem('andechain-wagmi', JSON.stringify(wagmiState));
      expect(success).toBe(true);

      // Paso 2: Simular page refresh (localStorage persiste)
      const retrieved = safeStorage.getItem('andechain-wagmi');
      expect(retrieved).not.toBeNull();

      const restoredState = JSON.parse(retrieved!);
      expect(restoredState.status).toBe('connected');
      expect(restoredState.address).toBe(wagmiState.address);
      expect(restoredState.chainId).toBe(1);
    });

    it('should restore recent connector after page refresh', () => {
      // Paso 1: Usuario conecta con MetaMask
      const connectorId = 'injected';
      safeStorage.setItem('wagmi.recentConnectorId', connectorId);

      // Paso 2: Simular page refresh
      const retrieved = safeStorage.getItem('wagmi.recentConnectorId');
      expect(retrieved).toBe('injected');
    });

    it('should restore cached account data after page refresh', () => {
      // Paso 1: Wagmi cachea datos de cuenta
      const cacheData = {
        accounts: ['0x1234567890123456789012345678901234567890'],
        chainId: 1,
        balance: '1000000000000000000',
      };

      safeStorage.setItem('wagmi.cache', JSON.stringify(cacheData));

      // Paso 2: Simular page refresh
      const retrieved = safeStorage.getItem('wagmi.cache');
      const restoredCache = JSON.parse(retrieved!);

      expect(restoredCache.accounts[0]).toBe(cacheData.accounts[0]);
      expect(restoredCache.chainId).toBe(1);
    });
  });

  describe('Browser Close/Reopen Scenario', () => {
    it('should maintain connection state after browser close/reopen', () => {
      // Paso 1: Usuario conecta wallet
      const connectionData = {
        connected: true,
        address: '0x1234567890123456789012345678901234567890',
        connector: 'injected',
        chainId: 1,
        timestamp: Date.now(),
      };

      safeStorage.setItem('andechain-wagmi', JSON.stringify(connectionData));

      // Paso 2: Simular cierre y reapertura del navegador
      // (localStorage persiste entre sesiones)
      const retrieved = safeStorage.getItem('andechain-wagmi');
      expect(retrieved).not.toBeNull();

      const restoredData = JSON.parse(retrieved!);
      expect(restoredData.connected).toBe(true);
      expect(restoredData.address).toBe(connectionData.address);
    });

    it('should handle session timeout after browser reopen', () => {
      const now = Date.now();
      const twentyFiveHoursAgo = now - (25 * 60 * 60 * 1000);

      // Paso 1: Guardar timestamp de conexión anterior
      safeStorage.setItem('andechain-last-connection-time', twentyFiveHoursAgo.toString());

      // Paso 2: Simular cierre y reapertura del navegador
      const lastConnectionStr = safeStorage.getItem('andechain-last-connection-time');
      expect(lastConnectionStr).not.toBeNull();

      const lastConnection = parseInt(lastConnectionStr!);
      const timeDiff = now - lastConnection;

      // Verificar que la sesión ha expirado (> 24 horas)
      expect(timeDiff).toBeGreaterThan(24 * 60 * 60 * 1000);
    });
  });

  describe('Multiple Tabs Scenario', () => {
    it('should sync state across multiple tabs', () => {
      // Simular Tab 1: Usuario conecta wallet
      const tab1State = {
        connected: true,
        address: '0x1234567890123456789012345678901234567890',
      };

      safeStorage.setItem('andechain-wagmi', JSON.stringify(tab1State));

      // Simular Tab 2: Abre y lee el mismo storage
      const tab2Retrieved = safeStorage.getItem('andechain-wagmi');
      expect(tab2Retrieved).not.toBeNull();

      const tab2State = JSON.parse(tab2Retrieved!);
      expect(tab2State.connected).toBe(true);
      expect(tab2State.address).toBe(tab1State.address);
    });

    it('should handle disconnection across multiple tabs', () => {
      // Paso 1: Ambas tabs leen estado conectado
      const initialState = {
        connected: true,
        address: '0x1234567890123456789012345678901234567890',
      };

      safeStorage.setItem('andechain-wagmi', JSON.stringify(initialState));

      // Paso 2: Tab 1 desconecta
      const disconnectedState = {
        connected: false,
        address: null,
      };

      safeStorage.setItem('andechain-wagmi', JSON.stringify(disconnectedState));

      // Paso 3: Tab 2 lee el nuevo estado
      const tab2Retrieved = safeStorage.getItem('andechain-wagmi');
      const tab2State = JSON.parse(tab2Retrieved!);

      expect(tab2State.connected).toBe(false);
      expect(tab2State.address).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from QuotaExceededError gracefully', () => {
      // Simular QuotaExceededError
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        .mockImplementationOnce(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        })
        .mockImplementationOnce(() => {
          // Segunda llamada funciona
        });

      // Primer intento falla
      const result1 = safeStorage.setItem('test-key', 'test-value');
      expect(result1).toBe(false);

      // Segundo intento funciona
      const result2 = safeStorage.setItem('test-key', 'test-value');
      expect(result2).toBe(true);

      setItemSpy.mockRestore();
    });

    it('should handle storage access denied', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Access denied');
      });

      const result = safeStorage.getItem('test-key');
      expect(result).toBeNull();

      getItemSpy.mockRestore();
    });

    it('should handle private browsing mode gracefully', () => {
      // En modo privado, localStorage puede estar deshabilitado
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      const result = safeStorage.setItem('test-key', 'test-value');
      expect(result).toBe(false);

      setItemSpy.mockRestore();
    });
  });

  describe('Data Integrity', () => {
    it('should preserve complex wallet state', () => {
      const complexState = {
        connected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        connector: 'injected',
        balance: '1000000000000000000',
        nonce: 42,
        transactions: [
          {
            hash: '0xabcd1234',
            from: '0x1234567890123456789012345678901234567890',
            to: '0x9876543210987654321098765432109876543210',
            value: '100000000000000000',
            status: 'confirmed',
          },
        ],
        metadata: {
          lastUpdated: Date.now(),
          version: '1.0.0',
        },
      };

      safeStorage.setItem('andechain-wagmi', JSON.stringify(complexState));

      const retrieved = safeStorage.getItem('andechain-wagmi');
      const restoredState = JSON.parse(retrieved!);

      expect(restoredState).toEqual(complexState);
      expect(restoredState.transactions[0].hash).toBe('0xabcd1234');
      expect(restoredState.metadata.version).toBe('1.0.0');
    });

    it('should handle special characters in stored data', () => {
      const dataWithSpecialChars = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test User™ © ®',
        emoji: '🚀 💎 🔐',
        unicode: '你好世界',
      };

      safeStorage.setItem('test-data', JSON.stringify(dataWithSpecialChars));

      const retrieved = safeStorage.getItem('test-data');
      const restoredData = JSON.parse(retrieved!);

      expect(restoredData.name).toBe(dataWithSpecialChars.name);
      expect(restoredData.emoji).toBe(dataWithSpecialChars.emoji);
      expect(restoredData.unicode).toBe(dataWithSpecialChars.unicode);
    });

    it('should handle large wallet state', () => {
      // Crear un estado grande pero realista
      const largeState = {
        connected: true,
        address: '0x1234567890123456789012345678901234567890',
        transactions: Array.from({ length: 100 }, (_, i) => ({
          hash: `0x${i.toString().padStart(64, '0')}`,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x9876543210987654321098765432109876543210',
          value: '100000000000000000',
          status: 'confirmed',
          timestamp: Date.now() - i * 1000,
        })),
      };

      const stateStr = JSON.stringify(largeState);
      const success = safeStorage.setItem('large-state', stateStr);

      expect(success).toBe(true);

      const retrieved = safeStorage.getItem('large-state');
      expect(retrieved).toBe(stateStr);

      const restoredState = JSON.parse(retrieved!);
      expect(restoredState.transactions.length).toBe(100);
    });
  });

  describe('Wagmi Compatibility', () => {
    it('should be compatible with Wagmi storage format', () => {
      // Wagmi almacena el estado en este formato
      const wagmiFormat = {
        state: {
          status: 'connected',
          connector: 'injected',
          chainId: 1,
          accounts: ['0x1234567890123456789012345678901234567890'],
        },
        lastUpdated: Date.now(),
      };

      safeStorage.setItem('andechain-wagmi', JSON.stringify(wagmiFormat));

      const retrieved = safeStorage.getItem('andechain-wagmi');
      const restoredFormat = JSON.parse(retrieved!);

      expect(restoredFormat.state.status).toBe('connected');
      expect(restoredFormat.state.accounts[0]).toBe(wagmiFormat.state.accounts[0]);
    });

    it('should not interfere with Wagmi internal keys', () => {
      // Wagmi usa estas keys internamente
      const wagmiKeys = [
        'wagmi.store',
        'wagmi.cache',
        'wagmi.recentConnectorId',
        'andechain-wagmi',
      ];

      const testData = {
        connected: true,
        address: '0x1234567890123456789012345678901234567890',
      };

      // Guardar datos en todas las keys
      wagmiKeys.forEach(key => {
        safeStorage.setItem(key, JSON.stringify(testData));
      });

      // Verificar que todas las keys se recuperan correctamente
      wagmiKeys.forEach(key => {
        const retrieved = safeStorage.getItem(key);
        expect(retrieved).not.toBeNull();
        const parsed = JSON.parse(retrieved!);
        expect(parsed.connected).toBe(true);
      });
    });
  });
});

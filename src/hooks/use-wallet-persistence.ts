'use client';

import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

/**
 * Hook para persistencia manual de conexión de wallet
 * Usa sessionStorage en lugar de localStorage (más pequeño y se limpia al cerrar tab)
 * 
 * Uso:
 * ```tsx
 * export function MyComponent() {
 *   useWalletPersistence();
 *   // ... resto del componente
 * }
 * ```
 */
export function useWalletPersistence() {
  const { address, isConnected } = useAccount();
  const { connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Guardar estado en sessionStorage (se limpia al cerrar tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isConnected && address) {
      try {
        sessionStorage.setItem('wallet_connected', 'true');
        sessionStorage.setItem('wallet_address', address);
        console.log('[Wallet] Persistence: saved connection state');
      } catch (e) {
        console.warn('[Wallet] Failed to save persistence state:', e);
      }
    } else {
      try {
        sessionStorage.removeItem('wallet_connected');
        sessionStorage.removeItem('wallet_address');
      } catch (e) {
        console.warn('[Wallet] Failed to clear persistence state:', e);
      }
    }
  }, [isConnected, address]);

  // Restaurar conexión si estaba conectado (opcional)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wasConnected = sessionStorage.getItem('wallet_connected') === 'true';
    const savedAddress = sessionStorage.getItem('wallet_address');

    if (wasConnected && !isConnected && connectors.length > 0) {
      console.log('[Wallet] Persistence: attempting to restore connection');
      // Nota: La reconexión automática está deshabilitada en web3-provider.tsx
      // para evitar conflictos. Si necesitas reconexión automática, descomenta:
      // connect({ connector: connectors[0] });
    }
  }, []);
}

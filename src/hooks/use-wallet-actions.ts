'use client';

import { useDisconnect } from 'wagmi';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

/**
 * Hook simplificado para acciones de wallet
 * Maneja desconexión y navegación sin dependencias de Firebase
 */
export function useWalletActions() {
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const router = useRouter();

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected successfully.',
    });
  };

  return { handleDisconnect };
}

'use client';

import { useEffect, useState } from 'react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { andechainTestnet as andechain } from '@/lib/chains';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Zap,
  HelpCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface NetworkErrorModalProps {
  /** Mostrar modal automáticamente cuando hay errores */
  autoShow?: boolean;
  /** Callback cuando se cierra el modal */
  onClose?: () => void;
}

/**
 * NetworkErrorModal - Modal para manejo de errores de red
 *
 * Muestra cuando:
 * - AndeChain RPC no responde
 * - Usuario está en red incorrecta por >10s
 * - Transacción falla por gas insuficiente
 *
 * Acciones:
 * - Botón para cambiar a AndeChain
 * - Botón para agregar AndeChain a MetaMask
 * - Link a documentación de troubleshooting
 */
export function NetworkErrorModal({ autoShow = true, onClose }: NetworkErrorModalProps) {
  const { state, isCorrectNetwork, switchToAndeChain, isLoading } = useWalletConnection();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [wrongNetworkDuration, setWrongNetworkDuration] = useState(0);
  const [rpcStatus, setRpcStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Verificar estado del RPC
  useEffect(() => {
    const checkRpcStatus = async () => {
      try {
        const rpcUrl = andechain.rpcUrls.default.http[0];
        if (!rpcUrl) {
          setRpcStatus('offline');
          return;
        }

        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
        });

        setRpcStatus(response.ok ? 'online' : 'offline');
      } catch (err) {
        setRpcStatus('offline');
      }
    };

    checkRpcStatus();
    const interval = setInterval(checkRpcStatus, 10000); // Verificar cada 10s
    return () => clearInterval(interval);
  }, []);

  // Rastrear duración en red incorrecta
  useEffect(() => {
    if (state === 'wrong-network') {
      const interval = setInterval(() => {
        setWrongNetworkDuration(prev => prev + 1);
      }, 1000);

      // Mostrar modal después de 10 segundos
      if (wrongNetworkDuration > 10 && autoShow) {
        setOpen(true);
      }

      return () => clearInterval(interval);
    } else {
      setWrongNetworkDuration(0);
    }
  }, [state, wrongNetworkDuration, autoShow]);

  // Mostrar modal si RPC está offline
  useEffect(() => {
    if (rpcStatus === 'offline' && autoShow) {
      setOpen(true);
    }
  }, [rpcStatus, autoShow]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToAndeChain();
      handleClose();
    } catch (err) {
      // Error ya manejado en el hook
    }
  };

  const handleAddNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'MetaMask not detected',
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${andechain.id.toString(16)}`,
            chainName: andechain.name,
            nativeCurrency: {
              name: andechain.nativeCurrency.name,
              symbol: andechain.nativeCurrency.symbol,
              decimals: andechain.nativeCurrency.decimals,
            },
            rpcUrls: andechain.rpcUrls.default.http,
            blockExplorerUrls: andechain.blockExplorers?.default.url
              ? [andechain.blockExplorers.default.url]
              : undefined,
          },
        ],
      });

      toast({
        title: 'Network Added',
        description: `${andechain.name} has been added to your wallet.`,
      });

      handleClose();
    } catch (err: any) {
      if (err.code !== 4001) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to add network',
        });
      }
    }
  };

  // ============================================================================
  // MODAL: RED INCORRECTA
  // ============================================================================
  if (state === 'wrong-network' && wrongNetworkDuration > 10) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Wrong Network Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are connected to the wrong network. Please switch to{' '}
              <span className="font-semibold text-foreground">{andechain.name}</span> to
              continue using AndeChain.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Network Mismatch
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              This application only works with {andechain.name}. Switching networks will
              ensure your transactions are processed correctly.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={handleSwitchNetwork}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Switch to {andechain.name}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleAddNetwork}
              className="w-full gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Add Network to MetaMask
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                window.open(
                  'https://docs.andechain.com/troubleshooting',
                  '_blank'
                )
              }
              className="w-full gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              View Troubleshooting Guide
            </Button>
          </div>

          <AlertDialogCancel>Dismiss</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // ============================================================================
  // MODAL: RPC OFFLINE
  // ============================================================================
  if (rpcStatus === 'offline') {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Network Connection Error
            </AlertDialogTitle>
            <AlertDialogDescription>
              Unable to connect to {andechain.name}. The RPC endpoint is currently
              unreachable. Please check your internet connection or try again later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>RPC Endpoint Offline</AlertTitle>
            <AlertDescription className="text-sm">
              {andechain.rpcUrls.default.http[0]}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setRpcStatus('checking');
                handleClose();
              }}
              className="w-full gap-2"
            >
              <Loader2 className="h-4 w-4" />
              Retry Connection
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  'https://docs.andechain.com/troubleshooting/rpc-connection',
                  '_blank'
                )
              }
              className="w-full gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Get Help
            </Button>
          </div>

          <AlertDialogCancel>Dismiss</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}

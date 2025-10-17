'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { andechain } from '@/lib/chains';
import {
  Wallet,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  LogOut,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  /** Variante visual del botón */
  variant?: 'default' | 'outline' | 'ghost';
  /** Tamaño del botón */
  size?: 'sm' | 'default' | 'lg';
  /** Mostrar balance ANDE al lado del botón */
  showBalance?: boolean;
  /** Callback cuando se conecta exitosamente */
  onConnected?: () => void;
  /** Callback cuando se desconecta */
  onDisconnected?: () => void;
  /** Clase CSS personalizada */
  className?: string;
}

/**
 * WalletButton - Componente mejorado para conexión de wallet
 *
 * Características:
 * - Prioridad MetaMask: Detecta e intenta conectar directamente
 * - Estados visuales claros: Disconnected, Connecting, Connected, Wrong Network
 * - Auto-switch: Ofrece cambiar a AndeChain si está en red incorrecta
 * - Feedback visual: Toast notifications para cada acción
 * - Responsive: Adapta texto en mobile
 * - Balance opcional: Muestra saldo ANDE si se habilita
 */
export function WalletButton({
  variant = 'default',
  size = 'default',
  showBalance = false,
  onConnected,
  onDisconnected,
  className,
}: WalletButtonProps) {
  const {
    state,
    address,
    isCorrectNetwork,
    connect,
    disconnect,
    switchToAndeChain,
    isLoading,
    error,
  } = useWalletConnection();

   const { toast } = useToast();
   const [copied, setCopied] = useState(false);
   const [showSwitchDialog, setShowSwitchDialog] = useState(false);
   const [isDebouncing, setIsDebouncing] = useState(false);

  // Obtener balance si está habilitado
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: andechain.id,
    query: {
      enabled: showBalance && !!address && isCorrectNetwork,
    },
  });

  // Formatear address para mostrar
  const formattedAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  // Formatear balance
  const formattedBalance = useMemo(() => {
    if (!balance) return '';
    const value = parseFloat(formatUnits(balance.value, balance.decimals));
    return value.toFixed(4);
  }, [balance]);

   // Manejar conexión con debouncing para prevenir double-click
   const handleConnect = useCallback(async () => {
     // Prevenir múltiples clics rápidos
     if (isDebouncing) {
       logger.warn('Connect button debounced - ignoring rapid click', {
         timestamp: Date.now(),
       });
       return;
     }

     setIsDebouncing(true);

     try {
       await connect();
       onConnected?.();
       toast({
         title: 'Wallet Connected',
         description: `Connected to ${andechain.name}`,
       });
     } catch (err) {
       // Error ya manejado en el hook
     } finally {
       // Cooldown de 2 segundos para prevenir clics rápidos
       setTimeout(() => setIsDebouncing(false), 2000);
     }
   }, [connect, onConnected, toast, isDebouncing]);

  // Manejar desconexión
  const handleDisconnect = useCallback(() => {
    disconnect();
    onDisconnected?.();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  }, [disconnect, onDisconnected, toast]);

  // Manejar cambio de red
  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchToAndeChain();
      setShowSwitchDialog(false);
      toast({
        title: 'Network Switched',
        description: `Connected to ${andechain.name}`,
      });
    } catch (err) {
      // Error ya manejado en el hook
    }
  }, [switchToAndeChain, toast]);

  // Copiar address
  const handleCopyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address, toast]);

  // Agregar token a MetaMask
  const handleAddTokenToMetaMask = useCallback(async () => {
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
        method: 'wallet_watchAsset',
        params: [
          {
            type: 'ERC20',
            options: {
              address: '0x0000000000000000000000000000000000000000', // TODO: Reemplazar con dirección real de ANDE
              symbol: 'ANDE',
              decimals: 18,
              image: 'https://andechain.com/icon.png',
            },
          },
        ],
      } as any);
      toast({
        title: 'Token Added',
        description: 'ANDE token added to MetaMask',
      });
    } catch (err) {
      // Usuario rechazó o error
    }
  }, [toast]);

  // Mostrar dialog de cambio de red cuando está en red incorrecta
  useEffect(() => {
    if (state === 'wrong-network' && !showSwitchDialog) {
      setShowSwitchDialog(true);
    }
  }, [state, showSwitchDialog]);

  // ============================================================================
  // ESTADO: CONECTADO Y RED CORRECTA
  // ============================================================================
  if (state === 'connected' && isCorrectNetwork && address) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={cn('gap-2', className)}
            >
              {/* Icono de wallet */}
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Wallet className="h-3 w-3 text-white" />
              </div>

              {/* Address - oculto en mobile si size es sm */}
              {size !== 'sm' && (
                <span className="font-mono text-sm hidden sm:inline">
                  {formattedAddress}
                </span>
              )}

              {/* Balance - solo en desktop y si está habilitado */}
              {showBalance && size !== 'sm' && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                  {isBalanceLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : (
                    `${formattedBalance} ANDE`
                  )}
                </span>
              )}

              {/* Solo icono en mobile */}
              {size === 'sm' && (
                <span className="sm:hidden font-mono text-xs">
                  {address?.slice(0, 4)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Wallet</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Mostrar address completa */}
            <DropdownMenuItem disabled className="font-mono text-xs">
              {address}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Copiar address */}
            <DropdownMenuItem onClick={handleCopyAddress}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </>
              )}
            </DropdownMenuItem>

            {/* Ver en explorer */}
            <DropdownMenuItem
              onClick={() => {
                const explorerUrl = andechain.blockExplorers?.default.url;
                if (explorerUrl) {
                  window.open(`${explorerUrl}/address/${address}`, '_blank');
                }
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </DropdownMenuItem>

            {/* Agregar token a MetaMask */}
            <DropdownMenuItem onClick={handleAddTokenToMetaMask}>
              <Zap className="mr-2 h-4 w-4" />
              Add ANDE Token
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Desconectar */}
            <DropdownMenuItem
              onClick={handleDisconnect}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  // ============================================================================
  // ESTADO: RED INCORRECTA
  // ============================================================================
  if (state === 'wrong-network' && address) {
    return (
      <>
        <Button
          variant="outline"
          size={size}
          onClick={() => setShowSwitchDialog(true)}
          disabled={isLoading}
          className={cn('gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20', className)}
        >
          <AlertTriangle className="h-4 w-4" />
          {size !== 'sm' && 'Wrong Network'}
        </Button>

        <AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Wrong Network
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are connected to the wrong network. Please switch to{' '}
                <span className="font-semibold text-foreground">{andechain.name}</span> to
                continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSwitchNetwork}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Switch Network
                  </>
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

   // ============================================================================
   // ESTADO: CONECTANDO O DESCONECTADO
   // ============================================================================
   return (
     <Button
       variant={variant}
       size={size}
       onClick={handleConnect}
       disabled={isLoading || isDebouncing}
       className={cn('gap-2', className)}
     >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {size !== 'sm' && 'Connecting...'}
        </>
      ) : (
        <>
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <Wallet className="h-3 w-3 text-white" />
          </div>
          {size !== 'sm' && 'Connect MetaMask'}
        </>
      )}
    </Button>
  );
}

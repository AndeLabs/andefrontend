'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { andechain } from '@/lib/chains';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showBalance?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  className?: string;
}

/**
 * WalletButton - Simplified wallet connection button
 * 
 * Features:
 * - Clean connection flow with MetaMask
 * - Clear visual states
 * - Optional balance display
 * - Dropdown menu when connected
 */
export function WalletButton({
  variant = 'default',
  size = 'default',
  showBalance = false,
  onConnected,
  onDisconnected,
  className,
}: WalletButtonProps) {
  const { toast } = useToast();
  
  // Guard para prevenir clicks múltiples
  const [isClicking, setIsClicking] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();
  
  const {
    state,
    address,
    chainId,
    isCorrectNetwork,
    connect,
    disconnect,
    switchToAndeChain,
    error,
    isLoading,
  } = useWalletConnection();

  const { data: balance } = useBalance({
    address,
    chainId: andechain.id,
    query: {
      enabled: !!address && isCorrectNetwork,
    },
  });

  // Handle successful connection
  useEffect(() => {
    if (state === 'connected' && address) {
      onConnected?.();
    }
  }, [state, address, onConnected]);

  // Handle disconnection
  useEffect(() => {
    if (state === 'disconnected') {
      onDisconnected?.();
    }
  }, [state, onDisconnected]);

  // Copy address to clipboard
  const copyAddress = useCallback(() => {
    if (!address) return;

    navigator.clipboard.writeText(address);
    toast({
      title: '✅ Copied!',
      description: 'Address copied to clipboard',
    });
  }, [address, toast]);

  // Handle connect button click con debouncing
  const handleConnect = useCallback(async () => {
    // Prevenir clicks múltiples
    if (isClicking) {
      console.log('🚫 Click ignored - already processing');
      return;
    }
    
    console.log('👆 Button clicked - connecting...');
    setIsClicking(true);
    
    // Clear timeout previo
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    try {
      await connect();
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      // Resetear después de 3 segundos
      clickTimeoutRef.current = setTimeout(() => {
        console.log('🔓 Button ready for new click');
        setIsClicking(false);
      }, 3000);
    }
  }, [connect, isClicking]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Handle network switch
  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchToAndeChain();
    } catch (err) {
      console.error('Network switch error:', err);
    }
  }, [switchToAndeChain]);

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Render loading state
  if (state === 'connecting' || isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn('gap-2', className)}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Connecting...</span>
        <span className="sm:hidden">Connecting</span>
      </Button>
    );
  }

  // Render wrong network state
  if (state === 'wrong-network') {
    return (
      <Button
        variant="destructive"
        size={size}
        onClick={handleSwitchNetwork}
        className={cn('gap-2', className)}
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="hidden sm:inline">Wrong Network</span>
        <span className="sm:hidden">Switch</span>
      </Button>
    );
  }

  // Render network switching state
  if (state === 'switching-network') {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn('gap-2', className)}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Switching Network...</span>
        <span className="sm:hidden">Switching</span>
      </Button>
    );
  }

  // Render error state
  if (state === 'error' && error) {
    return (
      <Button
        variant="destructive"
        size={size}
        onClick={handleConnect}
        className={cn('gap-2', className)}
      >
        <XCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Retry Connection</span>
        <span className="sm:hidden">Retry</span>
      </Button>
    );
  }

  // Render connected state with dropdown
  if (state === 'connected' && address) {
    return (
      <div className="flex items-center gap-2">
        {showBalance && balance && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
            <Wallet className="h-4 w-4" />
            <span className="font-medium">
              {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
            </span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={cn('gap-2', className)}
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">{formatAddress(address)}</span>
              <span className="sm:hidden">Connected</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Wallet</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Address */}
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded block">
                {formatAddress(address)}
              </code>
            </div>

            {/* Balance */}
            {balance && (
              <div className="px-2 py-2">
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className="text-sm font-semibold">
                  {parseFloat(formatEther(balance.value)).toFixed(6)} {balance.symbol}
                </p>
              </div>
            )}

            {/* Network */}
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground mb-1">Network</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <p className="text-sm">{andechain.name}</p>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Copy Address */}
            <DropdownMenuItem onClick={copyAddress}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
            </DropdownMenuItem>

            {/* View on Explorer */}
            <DropdownMenuItem asChild>
              <a
                href={`${andechain.blockExplorers?.default.url || 'http://localhost:4000'}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center cursor-pointer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Disconnect */}
            <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Render disconnected state (default)
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isClicking || isLoading}
      className={cn('gap-2', className)}
    >
      {isClicking ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Connecting...</span>
          <span className="sm:hidden">Wait</span>
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </>
      )}
    </Button>
  );
}
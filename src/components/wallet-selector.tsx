'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wallet, Loader2, ExternalLink } from 'lucide-react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useToast } from '@/hooks/use-toast';

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  installUrl?: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'injected',
    name: 'MetaMask',
    description: 'Connect using MetaMask browser extension',
    icon: '🦊',
    installUrl: 'https://metamask.io/download/',
  },
  {
    id: 'walletConnect',
    name: 'WalletConnect',
    description: 'Scan with mobile wallet',
    icon: '📱',
  },
  {
    id: 'coinbaseWallet',
    name: 'Coinbase Wallet',
    description: 'Connect using Coinbase Wallet',
    icon: '🔵',
    installUrl: 'https://www.coinbase.com/wallet/downloads',
  },
];

interface WalletSelectorProps {
  trigger?: React.ReactNode;
  onConnected?: () => void;
}

export function WalletSelector({ trigger, onConnected }: WalletSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const { connect, connectors, isLoading } = useWalletConnection();
  const { toast } = useToast();

  const handleConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    
    try {
      // Verificar si el conector está disponible
      const connector = connectors.find(c => c.id === walletId);
      
       if (!connector) {
         const wallet = WALLET_OPTIONS.find(w => w.id === walletId);
         if (wallet?.installUrl) {
           toast({
             title: `${wallet.name} Not Installed`,
             description: `Please install ${wallet.name} to continue.`,
             variant: 'destructive',
           });
           // Abrir en nueva pestaña
           window.open(wallet.installUrl, '_blank');
         }
         return;
       }

      await connect(walletId);
      setOpen(false);
      onConnected?.();
    } catch (error) {
      // Error ya manejado en el hook
    } finally {
      setSelectedWallet(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose your preferred wallet to connect to AndeChain
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
          {WALLET_OPTIONS.map((wallet) => {
            const connector = connectors.find(c => c.id === wallet.id);
            const isAvailable = !!connector;
            const isConnecting = selectedWallet === wallet.id && isLoading;

            return (
              <Button
                key={wallet.id}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => handleConnect(wallet.id)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="text-3xl">{wallet.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold flex items-center gap-2">
                      {wallet.name}
                      {!isAvailable && wallet.installUrl && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {!isAvailable && wallet.installUrl 
                        ? 'Not installed - Click to install' 
                        : wallet.description}
                    </div>
                  </div>
                  {isConnecting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2">
          New to Ethereum wallets?{' '}
          <a
            href="https://ethereum.org/en/wallets/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Learn more
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

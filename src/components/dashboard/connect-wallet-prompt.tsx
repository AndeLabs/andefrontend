'use client';

import { Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletButton } from '@/components/wallet-button';

export function ConnectWalletPrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect MetaMask to access your dashboard and manage your assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WalletButton 
            size="lg" 
            className="w-full h-12 text-base"
          />
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              100% Decentralized
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              No Personal Data Required
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
              Self-Custody Wallet
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

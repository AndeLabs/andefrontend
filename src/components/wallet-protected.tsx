"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

interface WalletProtectedProps {
  children: React.ReactNode;
}

export function WalletProtected({ children }: WalletProtectedProps) {
  const { isConnected, address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    // Check if wallet was previously connected
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    const savedAddress = localStorage.getItem('walletAddress');

    if (wasConnected && savedAddress && !isConnected) {
      // User was previously connected but wallet is not connected now
      // Redirect to login to reconnect
      router.push('/login');
    }
  }, [isConnected, router]);

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Wallet Required</h1>
            <p className="text-muted-foreground">
              Please connect your wallet to access this page.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full h-12" size="lg">
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>AndeChain is 100% decentralized</p>
            <p>Your wallet is your identity</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
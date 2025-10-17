
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, ArrowRight, Shield, Zap } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { andechain } from "@/lib/chains";

export default function LoginPage() {
  const router = useRouter();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);

  useEffect(() => {
    // Clear any previous connection state when entering login page
    // But don't disconnect if user is already connected
    if (!isConnected) {
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
    }
  }, [isConnected]);

  useEffect(() => {
    // If already connected, redirect immediately to dashboard
    if (isConnected && address) {
      router.push("/dashboard");
    }
  }, [isConnected, address, router]);

  const handleConnectWallet = async () => {
    if (isConnected) {
      // If already connected, disconnect
      disconnect();
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      toast({
        title: "Wallet Disconnected",
        description: "You have been disconnected from AndeChain.",
      });
      return;
    }

    setHasAttemptedConnection(true);
    
    if (typeof window !== 'undefined' && !window.ethereum) {
      toast({
        title: "Wallet Not Detected",
        description: "Please install MetaMask to connect to AndeChain.",
        variant: "destructive",
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      console.log("Attempting to connect wallet...");
      console.log("Window ethereum:", typeof window !== 'undefined' ? window.ethereum : 'undefined');
      
      await connect({ connector: injected() });
      
      toast({
        title: "Wallet Connected",
        description: "Welcome to AndeChain!",
      });
    } catch (error) {
      console.error("Connection error:", error);
      
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error name:", error.name);
        
        if (error.message.includes('User rejected') || error.message.includes('rejected')) {
          toast({
            title: "Connection Cancelled",
            description: "You rejected the connection request.",
            variant: "default",
          });
        } else {
          toast({
            title: "Connection Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } finally {
      setHasAttemptedConnection(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="flex items-center mb-8">
        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="ml-4 text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AndeChain
        </span>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to AndeChain</h1>
          <p className="text-muted-foreground">
            Connect your wallet to access the decentralized ecosystem
          </p>
        </div>

        {/* Wallet Connection Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Wallet className="h-5 w-5" />
              {isConnected ? "Wallet Connected" : "Connect Wallet"}
            </CardTitle>
            <CardDescription>
              {isConnected 
                ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                : "Use MetaMask to securely connect to AndeChain"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleConnectWallet}
              disabled={isPending || isConnecting || isLoading}
              className="w-full h-12 text-base"
              size="lg"
              variant={isConnected ? "outline" : "default"}
            >
              {(isPending || isConnecting || isLoading) && hasAttemptedConnection ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Disconnect Wallet
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect MetaMask
                </>
              )}
            </Button>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your wallet connection is secure and private. We never store your private keys.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            100% Decentralized
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            No Personal Data Required
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
            Self-Custody Wallet
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground px-8">
          By connecting your wallet, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

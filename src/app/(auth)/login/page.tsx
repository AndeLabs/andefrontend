
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, User, signInWithCustomToken } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { getNonce, verifySignature } from '@/ai/flows/siwe-flow';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { andechanTestnet } from "@/lib/chains";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);
  
  const createUserProfile = (user: User) => {
    const userProfileRef = doc(firestore, `users/${user.uid}/profile`);
    const userProfileData = {
        name: user.displayName || user.email || user.uid,
        avatar: user.photoURL || '',
        preferences: '{}',
        walletAddresses: user.providerData.some(p => p.providerId === 'siwe') ? [user.uid] : [],
    };
    setDocumentNonBlocking(userProfileRef, userProfileData, { merge: true });

    const userSettingsRef = doc(firestore, `users/${user.uid}/settings`);
    const userSettingsData = {
        theme: 'dark',
        language: 'en',
        notifications: {
            transactions: true,
            alerts: true,
        },
    };
    setDocumentNonBlocking(userSettingsRef, userSettingsData, { merge: true });
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      createUserProfile(userCredential.user);
      // Redirect will be handled by the useEffect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      createUserProfile(result.user);
       // Redirect will be handled by the useEffect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message,
      });
    }
  };
  
  const handleGitHubSignIn = async () => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      createUserProfile(result.user);
       // Redirect will be handled by the useEffect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "GitHub Sign-In Failed",
        description: error.message,
      });
    }
  };

  const handleSiweSignIn = async () => {
    setIsLoading(true);
    try {
      if (!address || !chainId) {
        throw new Error('Please connect your wallet first.');
      }
      
      // 1. Get nonce from server
      const nonce = await getNonce();

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to AndeChain Nexus.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });

      // 3. Sign message
      const serializedMessage = JSON.stringify(message.prepareMessage());
      const signature = await signMessageAsync({ message: serializedMessage });

      // 4. Verify signature and get Firebase custom token
      const { token } = await verifySignature({
        message: serializedMessage,
        signature,
      });

      // 5. Sign in with custom token
      const userCredential = await signInWithCustomToken(auth, token);
      createUserProfile(userCredential.user);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "SIWE Failed",
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Icons.logo className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex items-center mb-8">
        <Icons.logo className="h-8 w-8 text-primary" />
        <span className="ml-4 text-2xl font-bold">AndeChain Nexus</span>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
           <Button variant="outline" className="w-full" onClick={handleSiweSignIn} disabled={isLoading || !address}>
            <Icons.logo className="mr-2 h-4 w-4" />
            Sign in with Ethereum
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            Sign in with Google
          </Button>
           <Button variant="outline" className="w-full" onClick={handleGitHubSignIn} disabled={isLoading}>
            Sign in with GitHub
          </Button>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
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
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

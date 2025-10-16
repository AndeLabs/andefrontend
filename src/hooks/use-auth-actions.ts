
'use client';

import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useDisconnect } from 'wagmi';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

export function useAuthActions() {
  const auth = useAuth();
  const { disconnect: disconnectWagmi } = useDisconnect();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      disconnectWagmi();
      router.push('/login');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return { handleLogout };
}

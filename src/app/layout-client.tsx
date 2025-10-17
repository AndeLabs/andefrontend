'use client';

import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Web3Provider } from '@/lib/web3-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { cleanupLegacyStorage } from '@/lib/storage-cleanup';

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ejecutar limpieza de storage al montar el componente
  useEffect(() => {
    cleanupLegacyStorage();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <Web3Provider>
        {children}
      </Web3Provider>
      <Toaster />
    </ThemeProvider>
  );
}

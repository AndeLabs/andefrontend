'use client';

import { useAccount } from 'wagmi';
import { ConnectWalletPrompt } from '@/components/dashboard/connect-wallet-prompt';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  return <DashboardContent />;
}

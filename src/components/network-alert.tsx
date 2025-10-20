'use client';

import { useChainValidator } from '@/hooks/use-chain-validator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Network, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';

interface NetworkAlertProps {
  preferredChainId?: number; // 1234 for local, 2019 for testnet
  showWhenValid?: boolean; // Show info even when on correct network
  className?: string;
}

/**
 * NetworkAlert Component
 * 
 * Shows a warning when user is connected to wrong network
 * Provides button to switch to correct network
 * 
 * Usage:
 * ```tsx
 * <NetworkAlert preferredChainId={2019} />
 * ```
 */
export function NetworkAlert({
  preferredChainId = 2019, // Default to testnet
  showWhenValid = false,
  className,
}: NetworkAlertProps) {
  const { isConnected } = useAccount();
  const {
    isValidChain,
    isOnPreferredChain,
    chainId,
    currentChain,
    preferredChain,
    isSwitching,
    switchToPreferred,
  } = useChainValidator({
    showToast: false, // Don't auto-show toast, we have this component
    preferredChainId,
  });

  // Don't show if not connected
  if (!isConnected) {
    return null;
  }

  // Show info when on correct network (optional)
  if (isValidChain && isOnPreferredChain && showWhenValid) {
    return (
      <Alert className={className}>
        <Network className="h-4 w-4" />
        <AlertTitle>Connected to {currentChain?.name}</AlertTitle>
        <AlertDescription>
          You are on the correct network (chainId: {chainId})
        </AlertDescription>
      </Alert>
    );
  }

  // Don't show if on correct network and showWhenValid is false
  if (isValidChain && isOnPreferredChain) {
    return null;
  }

  // Show warning if on wrong AndeChain network
  if (isValidChain && !isOnPreferredChain) {
    return (
      <Alert variant="default" className={className}>
        <Network className="h-4 w-4" />
        <AlertTitle>Different AndeChain Network</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>
            You are connected to <strong>{currentChain?.name}</strong> (chainId: {chainId}).
            This app is configured for <strong>{preferredChain?.name}</strong> (chainId: {preferredChainId}).
          </p>
          <Button
            onClick={switchToPreferred}
            disabled={isSwitching}
            size="sm"
            className="w-fit"
          >
            {isSwitching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <Network className="mr-2 h-4 w-4" />
                Switch to {preferredChain?.name}
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show error if on completely wrong network (not AndeChain at all)
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Wrong Network</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>
          You are connected to an unsupported network (chainId: {chainId}).
          Please switch to <strong>{preferredChain?.name}</strong> (chainId: {preferredChainId}).
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">Supported Networks:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>AndeChain Local (chainId: 1234) - Development</li>
            <li>AndeChain Mocha (chainId: 2019) - Testnet with EVOLVE + Celestia</li>
          </ul>
        </div>
        <Button
          onClick={switchToPreferred}
          disabled={isSwitching}
          size="sm"
          className="w-fit"
        >
          {isSwitching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Switching...
            </>
          ) : (
            <>
              <Network className="mr-2 h-4 w-4" />
              Switch to {preferredChain?.name}
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact version that just shows a badge
 */
export function NetworkBadge({ preferredChainId = 2019 }: { preferredChainId?: number }) {
  const { isConnected } = useAccount();
  const { isValidChain, isOnPreferredChain, chainId, currentChain } = useChainValidator({
    showToast: false,
    preferredChainId,
  });

  if (!isConnected) {
    return null;
  }

  if (!isValidChain) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm">
        <AlertTriangle className="h-3 w-3" />
        <span>Wrong Network (chainId: {chainId})</span>
      </div>
    );
  }

  if (!isOnPreferredChain) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-sm">
        <Network className="h-3 w-3" />
        <span>{currentChain?.name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 text-sm">
      <Network className="h-3 w-3" />
      <span>{currentChain?.name}</span>
    </div>
  );
}
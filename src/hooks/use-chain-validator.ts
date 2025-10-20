'use client';

import { useEffect } from 'react';
import { useChainId, useAccount, useSwitchChain } from 'wagmi';
import { isAndeChain, getChainById, andechainTestnet, andechainLocal } from '@/lib/chains';
import { useToast } from './use-toast';

interface UseChainValidatorOptions {
  showToast?: boolean;
  autoSwitch?: boolean;
  preferredChainId?: number; // 1234 for local, 2019 for testnet
}

/**
 * Hook to validate if user is connected to a valid AndeChain network
 * 
 * Features:
 * - Validates chainId is 1234 (local) or 2019 (testnet)
 * - Shows toast notification if on wrong network
 * - Optionally auto-switches to correct network
 * - Provides helpers to switch networks
 * 
 * Usage:
 * ```tsx
 * const { isValidChain, currentChain, switchToTestnet } = useChainValidator({
 *   showToast: true,
 *   preferredChainId: 2019
 * });
 * ```
 */
export function useChainValidator(options: UseChainValidatorOptions = {}) {
  const {
    showToast = true,
    autoSwitch = false,
    preferredChainId = 2019, // Default to testnet
  } = options;

  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { toast } = useToast();

  const isValidChain = isAndeChain(chainId);
  const currentChain = getChainById(chainId);
  const isOnPreferredChain = chainId === preferredChainId;

  // Show warning if on wrong network
  useEffect(() => {
    if (!isConnected) return;

    if (!isValidChain && showToast) {
      toast({
        title: '⚠️ Wrong Network',
        description: `Please switch to AndeChain network (chainId: ${preferredChainId})`,
        variant: 'destructive',
      });
    }

    // Auto-switch if enabled
    if (!isValidChain && autoSwitch && switchChain) {
      switchChain({ chainId: preferredChainId });
    }
  }, [isConnected, isValidChain, chainId, showToast, autoSwitch, preferredChainId, switchChain, toast]);

  // Helper functions
  const switchToLocal = () => {
    if (switchChain) {
      switchChain({ chainId: 1234 });
    }
  };

  const switchToTestnet = () => {
    if (switchChain) {
      switchChain({ chainId: 2019 });
    }
  };

  const switchToPreferred = () => {
    if (switchChain) {
      switchChain({ chainId: preferredChainId });
    }
  };

  return {
    // Status
    isValidChain,
    isOnPreferredChain,
    chainId,
    currentChain,
    isSwitching,

    // Helpers
    switchToLocal,
    switchToTestnet,
    switchToPreferred,

    // Chain info
    preferredChainId,
    preferredChain: getChainById(preferredChainId),
    
    // Raw switch function
    switchChain,
  };
}

/**
 * Simpler hook that just checks if on valid AndeChain
 */
export function useIsValidAndeChain() {
  const chainId = useChainId();
  return isAndeChain(chainId);
}

/**
 * Hook that returns current AndeChain info or null
 */
export function useCurrentAndeChain() {
  const chainId = useChainId();
  const isValid = isAndeChain(chainId);
  
  if (!isValid) return null;
  
  return getChainById(chainId);
}
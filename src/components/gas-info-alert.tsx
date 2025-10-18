'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink, Fuel } from 'lucide-react';
import { useGasCheck } from '@/hooks/use-gas-check';
import Link from 'next/link';

interface GasInfoAlertProps {
  showAlways?: boolean;
  className?: string;
}

/**
 * Componente que muestra información sobre el gas y guía al usuario
 * cuando no tiene suficiente balance nativo para pagar transacciones
 */
export function GasInfoAlert({ showAlways = false, className }: GasInfoAlertProps) {
  const { hasEnoughGas, formattedNativeBalance, getGasErrorMessage } = useGasCheck();

  // Solo mostrar si no hay suficiente gas, o si showAlways está activo
  if (!showAlways && hasEnoughGas) {
    return null;
  }

  const gasError = getGasErrorMessage();

  return (
    <Alert 
      variant={hasEnoughGas ? 'default' : 'destructive'}
      className={className}
    >
      <Fuel className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {hasEnoughGas ? 'Gas Information' : '⚠️ Insufficient Gas for Transactions'}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div>
          {hasEnoughGas ? (
            <p className="text-sm">
              You have <span className="font-bold">{formattedNativeBalance} ANDE</span> available for transaction fees.
            </p>
          ) : (
            <p className="text-sm">
              {gasError || 'You need native ANDE to pay for transaction fees (gas).'}
            </p>
          )}
        </div>

        {!hasEnoughGas && (
          <>
            <div className="text-sm space-y-1">
              <p className="font-medium">What is gas?</p>
              <p className="text-xs opacity-90">
                Gas is the fee required to process transactions on the blockchain. 
                You need native ANDE in your wallet to pay for these fees, even when 
                staking or transferring ANDE tokens.
              </p>
            </div>

            <div className="text-sm space-y-1">
              <p className="font-medium">How to get gas?</p>
              <ul className="text-xs list-disc list-inside space-y-1 opacity-90">
                <li>Get ANDE from the faucet (recommended for testing)</li>
                <li>The faucet gives you both tokens and native ANDE for gas</li>
                <li>Minimum recommended: 0.01 ANDE for gas</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button asChild size="sm" variant="default">
                <Link href="/faucet">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Go to Faucet
                </Link>
              </Button>
            </div>
          </>
        )}

        {hasEnoughGas && showAlways && (
          <div className="text-xs space-y-1 opacity-75">
            <p className="font-medium">💡 Tip:</p>
            <p>
              Each transaction (approve, stake, unstake, claim) requires a small amount 
              of ANDE for gas. If you run out, visit the faucet to get more.
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Componente más pequeño que solo muestra el balance de gas actual
 */
export function GasBalanceBadge() {
  const { formattedNativeBalance, hasEnoughGas } = useGasCheck();

  return (
    <div className="flex items-center gap-2 text-sm">
      <Fuel className={`h-4 w-4 ${hasEnoughGas ? 'text-green-500' : 'text-red-500'}`} />
      <span className="text-muted-foreground">
        Gas: <span className={hasEnoughGas ? 'text-foreground font-medium' : 'text-red-500 font-medium'}>
          {formattedNativeBalance} ANDE
        </span>
      </span>
      {!hasEnoughGas && (
        <Link href="/faucet" className="text-xs underline text-blue-500 hover:text-blue-600">
          Get more
        </Link>
      )}
    </div>
  );
}

/**
 * Componente de info colapsable sobre gas (para modals o tooltips)
 */
export function GasInfoPopover({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">About Transaction Fees (Gas)</p>
          <p>
            Every blockchain transaction requires a small fee called "gas". 
            On AndeChain, you pay this fee in native ANDE.
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
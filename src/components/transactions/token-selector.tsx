'use client';

import { useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useWalletTokens, type TokenInfo } from '@/hooks/use-wallet-tokens';
import { isAddress, type Address } from 'viem';

interface TokenSelectorProps {
  selectedToken: TokenInfo | null;
  onSelectToken: (token: TokenInfo) => void;
  disabled?: boolean;
}

export function TokenSelector({ selectedToken, onSelectToken, disabled }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [isAddingToken, setIsAddingToken] = useState(false);
  const { toast } = useToast();

  const {
    tokens,
    isLoading,
    nativeBalance,
    addCustomToken,
    removeToken,
  } = useWalletTokens();

  const allTokens = nativeBalance ? [nativeBalance, ...tokens] : tokens;

  const handleSelectToken = (token: TokenInfo) => {
    onSelectToken(token);
    setOpen(false);
  };

  const handleAddToken = async () => {
    if (!newTokenAddress || !isAddress(newTokenAddress)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid token contract address',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingToken(true);
    try {
      const success = await addCustomToken(newTokenAddress as Address);
      if (success) {
        toast({
          title: 'Token Added',
          description: 'Token has been added to your list',
        });
        setNewTokenAddress('');
        setShowAddToken(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add token. Please check the address.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add token',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToken(false);
    }
  };

  const handleRemoveToken = (address: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    removeToken(address);
    toast({
      title: 'Token Removed',
      description: 'Token has been removed from your list',
    });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedToken ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                  <span className="text-xs font-bold">{selectedToken.symbol[0]}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedToken.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    Balance: {parseFloat(selectedToken.balanceFormatted).toFixed(4)}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select token...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex items-center justify-between p-3 border-b">
            <h4 className="font-semibold text-sm">Select Token</h4>
            <Dialog open={showAddToken} onOpenChange={setShowAddToken}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Token</DialogTitle>
                  <DialogDescription>
                    Enter the contract address of the ERC20 token you want to add
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-address">Token Contract Address</Label>
                    <Input
                      id="token-address"
                      placeholder="0x..."
                      value={newTokenAddress}
                      onChange={(e) => setNewTokenAddress(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <Button
                    onClick={handleAddToken}
                    disabled={isAddingToken || !newTokenAddress}
                    className="w-full"
                  >
                    {isAddingToken ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Adding Token...
                      </>
                    ) : (
                      'Add Token'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="p-2 space-y-1">
                {allTokens.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No tokens found. Add a custom token to get started.
                  </div>
                ) : (
                  allTokens.map((token) => (
                    <div
                      key={token.address}
                      className={`
                        flex items-center justify-between p-3 rounded-lg cursor-pointer
                        hover:bg-accent transition-colors group
                        ${selectedToken?.address === token.address ? 'bg-accent' : ''}
                      `}
                      onClick={() => handleSelectToken(token)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <span className="text-sm font-bold">{token.symbol[0]}</span>
                        </div>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.symbol}</span>
                            {token.isNative && (
                              <Badge variant="secondary" className="text-xs">
                                Native
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {token.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-mono">
                              {parseFloat(token.balanceFormatted).toFixed(4)}
                            </span>
                            {token.totalSupply && (
                              <span className="text-xs text-muted-foreground">
                                Supply: {(Number(token.totalSupply) / Math.pow(10, token.decimals)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedToken?.address === token.address && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {!token.isNative && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleRemoveToken(token.address, e)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
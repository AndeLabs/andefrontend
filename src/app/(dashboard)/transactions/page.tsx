'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { useAndeBalance } from '@/hooks/use-ande-balance';
import { useGasCheck } from '@/hooks/use-gas-check';
import { parseEther, parseUnits, isAddress, encodeFunctionData, type Address, type Hash } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { andechainTestnet as andechain } from '@/lib/chains';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { useWalletTokens } from '@/hooks/use-wallet-tokens';
import { TokenSelector } from '@/components/transactions/token-selector';
import { TransactionHistoryTable } from '@/components/transactions/transaction-history-table';
import {
  ArrowRightLeft,
  Send,
  Eye,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Coins,
  TrendingUp,
  Wallet,
  Info,
  Zap,
} from 'lucide-react';

const ERC20_TRANSFER_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();
  const { balance: nativeBalance } = useAndeBalance();
  const { getGasErrorMessage, hasEnoughGas, formattedNativeBalance } = useGasCheck();
  const { toast } = useToast();

  // Transaction history
  const {
    transactions,
    isLoading: isLoadingHistory,
    addPendingTransaction,
    updateTransactionStatus,
    refreshTransactions,
  } = useTransactionHistory();

  // Token management
  const {
    tokens,
    nativeBalance: nativeTokenInfo,
    isLoading: isLoadingTokens,
    refreshTokens,
  } = useWalletTokens();

  // Send form state
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendData, setSendData] = useState('');
  const [estimatedGas, setEstimatedGas] = useState<string>('');
  
  // Transaction tracking
  const [pendingTxHash, setPendingTxHash] = useState<Hash | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Send transaction hooks
  const {
    data: hash,
    isPending: isSending,
    error: sendError,
    sendTransaction,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: pendingTxHash || undefined,
  });

  // Initialize with native token
  useEffect(() => {
    if (nativeTokenInfo && !selectedToken) {
      setSelectedToken(nativeTokenInfo);
    }
  }, [nativeTokenInfo, selectedToken]);

  // Track transaction hash
  useEffect(() => {
    if (hash) {
      setPendingTxHash(hash);
      
      // Add to pending transactions
      addPendingTransaction({
        hash,
        to: sendToAddress as Address,
        value: parseEther(sendAmount || '0'),
      });

      const explorerLink = andechain.blockExplorers?.default?.url;
      
      toast({
        title: '🚀 Transaction Submitted',
        description: (
          <div className="space-y-2">
            <p>Your transaction has been submitted to the network</p>
            <code className="text-xs bg-muted px-2 py-1 rounded">{hash.slice(0, 20)}...{hash.slice(-10)}</code>
            {explorerLink && (
              <a
                href={`${explorerLink}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
              >
                View on Explorer →
              </a>
            )}
          </div>
        ),
        duration: 10000,
      });
    }
  }, [hash, addPendingTransaction, sendToAddress, sendAmount, toast]);

  // Handle confirmation
  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setShowSuccess(true);
      updateTransactionStatus(pendingTxHash);
      
      const explorerLink = andechain.blockExplorers?.default?.url;
      
      toast({
        title: '✅ Transaction Confirmed',
        description: (
          <div className="space-y-2">
            <p>Your transaction has been confirmed on the blockchain!</p>
            {explorerLink && (
              <a
                href={`${explorerLink}/tx/${pendingTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on Block Explorer →
              </a>
            )}
          </div>
        ),
        duration: 8000,
      });

      // Reset form
      setSendToAddress('');
      setSendAmount('');
      setSendData('');
      setPendingTxHash(null);

      // Refresh balances and transactions
      setTimeout(() => {
        refreshTokens();
        refreshTransactions();
        setShowSuccess(false);
      }, 2000);
    }
  }, [isConfirmed, pendingTxHash, updateTransactionStatus, refreshTokens, refreshTransactions, toast]);

  // Handle errors
  useEffect(() => {
    if (sendError) {
      console.error('Send transaction error:', sendError);
      
      let errorMessage = sendError.message || 'Failed to send transaction';
      
      // Parse common error patterns
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
        errorMessage = 'Insufficient ANDE for gas fees. Visit the faucet to get more ANDE.';
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
        errorMessage = 'Transaction was rejected in your wallet.';
      } else if (errorMessage.includes('execution reverted')) {
        errorMessage = 'Transaction would fail. Check your balance and gas.';
      } else if (errorMessage.includes('gasLimit')) {
        errorMessage = 'Gas estimation failed. You may not have enough ANDE for gas fees.';
      }
      
      toast({
        title: '❌ Transaction Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    if (confirmError) {
      console.error('Transaction confirmation error:', confirmError);
      toast({
        title: '⚠️ Confirmation Error',
        description: confirmError.message || 'Transaction may have failed',
        variant: 'destructive',
      });
    }
  }, [sendError, confirmError, toast]);

  const handleSend = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    // Check if user has enough gas
    const gasError = getGasErrorMessage();
    if (gasError) {
      toast({
        title: '⚠️ Insufficient Gas',
        description: gasError + ' Visit the faucet to get ANDE for gas fees.',
        variant: 'destructive',
      });
      return;
    }

    if (!sendToAddress || !isAddress(sendToAddress)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid recipient address',
        variant: 'destructive',
      });
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedToken) {
      toast({
        title: 'No Token Selected',
        description: 'Please select a token to send',
        variant: 'destructive',
      });
      return;
    }

    try {
      const amountBigInt = parseUnits(sendAmount, selectedToken.decimals);

      // Check balance
      if (amountBigInt > selectedToken.balance) {
        toast({
          title: 'Insufficient Balance',
          description: `You only have ${selectedToken.balanceFormatted} ${selectedToken.symbol}`,
          variant: 'destructive',
        });
        return;
      }

      console.log('Sending transaction:', {
        token: selectedToken.symbol,
        tokenAddress: selectedToken.address,
        to: sendToAddress,
        amount: sendAmount,
        amountBigInt: amountBigInt.toString(),
        balance: selectedToken.balanceFormatted,
        decimals: selectedToken.decimals,
      });

      // ✅ ANDE es NATIVO en sovereign rollup - usar value field
      if (selectedToken.isNative) {
        console.log('Native ANDE transfer:', {
          to: sendToAddress,
          value: amountBigInt.toString(),
        });

        sendTransaction({
          to: sendToAddress as Address,
          value: amountBigInt,
        });
      } else {
        // Fallback para otros tokens ERC-20
        const transferData = encodeFunctionData({
          abi: ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args: [sendToAddress as Address, amountBigInt],
        }) as `0x${string}`;

        sendTransaction({
          to: selectedToken.address,
          data: transferData,
        });
      }
    } catch (error) {
      console.error('Send error:', error);
      
      let errorMessage = 'Failed to send transaction';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Parse common errors
        if (errorMessage.includes('insufficient funds')) {
          errorMessage = 'Insufficient ANDE for gas fees. Get more from the faucet.';
        } else if (errorMessage.includes('user rejected')) {
          errorMessage = 'Transaction was rejected in wallet.';
        } else if (errorMessage.includes('execution reverted')) {
          errorMessage = 'Transaction failed: contract execution reverted. Check balance and gas.';
        }
      }
      
      toast({
        title: '❌ Transaction Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: 'Copied!',
        description: 'Your address has been copied to clipboard',
      });
    }
  };

  const handleMaxAmount = () => {
    if (selectedToken) {
      setSendAmount(selectedToken.balanceFormatted);
    }
  };

  const explorerUrl = andechain.blockExplorers?.default?.url;

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-2">
            Send tokens and view your transaction history
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to send transactions and view your history.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-2">
          Send tokens and manage your transaction history on {andechain.name}
        </p>
      </div>

      {/* Gas Warning */}
      {!hasEnoughGas && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ Insufficient Gas for Transactions</AlertTitle>
          <AlertDescription>
            {getGasErrorMessage()}
            {' '}
            <a 
              href="/faucet" 
              className="underline font-medium hover:text-foreground"
            >
              Get ANDE from the faucet
            </a>
            {' '}to pay for transaction fees.
            <div className="mt-2 text-xs">
              Native balance for gas: {formattedNativeBalance} ANDE
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Transaction Confirmed!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            Your transaction has been successfully confirmed on the blockchain.
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Address</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono flex-1 truncate">{address}</code>
              <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="h-6 w-6 p-0">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Native Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : '0.0000'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{andechain.nativeCurrency.symbol}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter(tx => tx.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Transaction Confirmed!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            Your transaction has been successfully confirmed on the blockchain.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Send Transaction
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        {/* Send Transaction Tab */}
        <TabsContent value="send" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Transaction</CardTitle>
                  <CardDescription>
                    Transfer tokens to another address on the {andechain.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Token Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="token">Token to Send</Label>
                    <TokenSelector
                      selectedToken={selectedToken}
                      onSelectToken={setSelectedToken}
                      disabled={isSending || isConfirming}
                    />
                    {selectedToken && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Info className="h-4 w-4" />
                        <span>
                          Available: {parseFloat(selectedToken.balanceFormatted).toFixed(6)} {selectedToken.symbol}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Recipient Address */}
                  <div className="space-y-2">
                    <Label htmlFor="to">Recipient Address</Label>
                    <Input
                      id="to"
                      placeholder="0x..."
                      value={sendToAddress}
                      onChange={(e) => setSendToAddress(e.target.value)}
                      disabled={isSending || isConfirming}
                      className="font-mono"
                    />
                    {sendToAddress && !isAddress(sendToAddress) && (
                      <p className="text-xs text-red-500">Invalid address format</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex gap-2">
                      <Input
                        id="amount"
                        type="number"
                        step="0.000001"
                        placeholder="0.0"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        disabled={isSending || isConfirming}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={handleMaxAmount}
                        disabled={isSending || isConfirming || !selectedToken}
                      >
                        Max
                      </Button>
                    </div>
                    {sendAmount && selectedToken && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {(parseFloat(sendAmount) * 1).toFixed(2)} USD (estimated)
                      </p>
                    )}
                  </div>

                  {/* Optional Data */}
                  <div className="space-y-2">
                    <Label htmlFor="data">
                      Transaction Data (Optional)
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Advanced
                      </Badge>
                    </Label>
                    <Textarea
                      id="data"
                      placeholder="0x... (hex data for contract interaction)"
                      value={sendData}
                      onChange={(e) => setSendData(e.target.value)}
                      disabled={isSending || isConfirming || !selectedToken?.isNative}
                      className="font-mono text-xs"
                      rows={3}
                    />
                    {!selectedToken?.isNative && (
                      <p className="text-xs text-muted-foreground">
                        Transaction data only available for native token transfers
                      </p>
                    )}
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSend}
                    disabled={
                      isSending ||
                      isConfirming ||
                      !sendToAddress ||
                      !sendAmount ||
                      !selectedToken ||
                      !isAddress(sendToAddress)
                    }
                    className="w-full"
                    size="lg"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Transaction
                      </>
                    )}
                  </Button>

                  {/* Transaction Status */}
                  {(isSending || isConfirming || pendingTxHash) && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>
                        {isSending && 'Awaiting Signature...'}
                        {isConfirming && 'Transaction Pending...'}
                      </AlertTitle>
                      <AlertDescription>
                        {isSending && 'Please confirm the transaction in your wallet'}
                        {isConfirming && (
                          <div className="space-y-2">
                            <p>Your transaction is being processed on the blockchain</p>
                            {pendingTxHash && (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-muted p-1 rounded flex-1 truncate">
                                    {pendingTxHash}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      navigator.clipboard.writeText(pendingTxHash);
                                      toast({ title: 'Copied!', description: 'Transaction hash copied to clipboard' });
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/tx/${pendingTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    View Transaction on Block Explorer
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Transaction Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Network</span>
                      <Badge variant="outline">{andechain.name}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Chain ID</span>
                      <span className="font-mono">{andechain.id}</span>
                    </div>
                    {selectedToken && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Token</span>
                          <span className="font-semibold">{selectedToken.symbol}</span>
                        </div>
                        {!selectedToken.isNative && (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Contract</span>
                            <code className="text-xs bg-muted p-1 rounded break-all">
                              {selectedToken.address}
                            </code>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>• Double-check the recipient address before sending</p>
                  <p>• Transactions cannot be reversed once confirmed</p>
                  <p>• Keep some ANDE for gas fees</p>
                  <p>• Use "Max" to send your entire balance</p>
                  <p>• ERC20 transfers require gas in ANDE</p>
                </CardContent>
              </Card>

              {tokens.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your Tokens</CardTitle>
                    <CardDescription className="text-xs">
                      {tokens.length} token{tokens.length !== 1 ? 's' : ''} detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshTokens}
                      disabled={isLoadingTokens}
                      className="w-full"
                    >
                      <RefreshCw className={`h-3 w-3 mr-2 ${isLoadingTokens ? 'animate-spin' : ''}`} />
                      Refresh Tokens
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={refreshTransactions}
              disabled={isLoadingHistory}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <TransactionHistoryTable
            transactions={transactions}
            isLoading={isLoadingHistory}
            emptyMessage="No transactions found. Send your first transaction to get started!"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { andeUrls, andeNetworkInfo, andechainTestnet } from '@/lib/chains';
import {
  Code2,
  Copy,
  CheckCircle2,
  Book,
  Wallet,
  Network,
  Terminal,
  GitBranch,
  Zap,
  Shield,
  Database,
  Globe,
  ExternalLink,
  Info,
  Cpu,
  Activity,
} from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

function CodeBlock({ code, language, title }: CodeBlockProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: '✅ Copied!',
      description: 'Code copied to clipboard',
    });
  };

  return (
    <div className="relative">
      {title && (
        <div className="bg-muted px-4 py-2 rounded-t-lg border-b">
          <span className="text-sm font-medium">{title}</span>
        </div>
      )}
      <div className="relative">
        <pre className={`bg-black text-green-400 p-4 rounded-${title ? 'b' : ''}-lg overflow-x-auto text-sm font-mono`}>
          <code>{code}</code>
        </pre>
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2"
          onClick={copyCode}
        >
          {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function IntegrationPage() {
  const { toast } = useToast();

  const addToMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: 'MetaMask Not Detected',
        description: 'Please install MetaMask to add the network',
        variant: 'destructive',
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${andechainTestnet.id.toString(16)}`,
            chainName: andechainTestnet.name,
            nativeCurrency: {
              name: andechainTestnet.nativeCurrency.name,
              symbol: andechainTestnet.nativeCurrency.symbol,
              decimals: andechainTestnet.nativeCurrency.decimals,
            },
            rpcUrls: [andeUrls.rpc.http],
            blockExplorerUrls: [andeUrls.explorer],
          },
        ],
      });

      toast({
        title: '✅ Network Added!',
        description: `${andechainTestnet.name} has been added to MetaMask`,
      });
    } catch (error: any) {
      console.error('Error adding network:', error);
      toast({
        title: 'Failed to Add Network',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Code2 className="h-8 w-8 text-purple-500" />
            Developer Integration Guide
          </h1>
          <p className="text-muted-foreground mt-2">
            Everything you need to integrate with {andechainTestnet.name}
          </p>
        </div>
        <Button onClick={addToMetaMask} size="lg">
          <Wallet className="mr-2 h-5 w-5" />
          Add to MetaMask
        </Button>
      </div>

      {/* Quick Start Alert */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>Quick Start</AlertTitle>
        <AlertDescription>
          AndeChain is a sovereign EVM rollup on Celestia with advanced features like Token Duality,
          Parallel EVM, and MEV integration. Start building in minutes!
        </AlertDescription>
      </Alert>

      {/* Network Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Information
          </CardTitle>
          <CardDescription>Essential connection details for AndeChain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network Name</span>
                <span className="font-mono font-semibold">{andeNetworkInfo.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chain ID</span>
                <Badge variant="outline" className="font-mono">
                  {andeNetworkInfo.chainId}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Symbol</span>
                <span className="font-semibold">{andeNetworkInfo.symbol}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Block Time</span>
                <span className="font-mono">{andeNetworkInfo.blockTime}s</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consensus</span>
                <span className="text-sm">{andeNetworkInfo.consensus}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data Availability</span>
                <span className="text-sm">{andeNetworkInfo.dataAvailability}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Execution Layer</span>
                <span className="text-sm">{andeNetworkInfo.executionLayer}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <span className="text-sm font-medium">RPC Endpoints</span>
            <div className="grid gap-2">
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">HTTP</span>
                </div>
                <code className="text-xs font-mono">{andeUrls.rpc.http}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(andeUrls.rpc.http);
                    toast({ title: 'Copied!', description: 'RPC URL copied' });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">WebSocket</span>
                </div>
                <code className="text-xs font-mono">{andeUrls.rpc.ws}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(andeUrls.rpc.ws);
                    toast({ title: 'Copied!', description: 'WebSocket URL copied' });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <span className="text-sm font-medium">Unique Features</span>
            <div className="flex flex-wrap gap-2">
              {andeNetworkInfo.features.map((feature, idx) => (
                <Badge key={idx} variant="secondary">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Tabs */}
      <Tabs defaultValue="quickstart" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="web3">Web3.js</TabsTrigger>
          <TabsTrigger value="ethers">Ethers.js</TabsTrigger>
          <TabsTrigger value="viem">Viem</TabsTrigger>
          <TabsTrigger value="hardhat">Hardhat</TabsTrigger>
        </TabsList>

        {/* Quick Start Tab */}
        <TabsContent value="quickstart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Quick Start Guide</CardTitle>
              <CardDescription>Get started with AndeChain in 3 simple steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Add Network to MetaMask</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Click the button above or manually add the network with these details:
                    </p>
                    <CodeBlock
                      language="json"
                      code={JSON.stringify(
                        {
                          chainId: andeNetworkInfo.chainId,
                          chainName: andeNetworkInfo.name,
                          rpcUrls: [andeUrls.rpc.http],
                          nativeCurrency: {
                            name: 'ANDE',
                            symbol: 'ANDE',
                            decimals: 18,
                          },
                          blockExplorerUrls: [andeUrls.explorer],
                        },
                        null,
                        2
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Get Testnet ANDE</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Request testnet tokens from our faucet:
                    </p>
                    <Button variant="outline" asChild>
                      <a href={andeUrls.faucet} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Faucet
                      </a>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Start Building</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Deploy your first contract or interact with the chain. Check the other tabs for code examples.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Web3.js Tab */}
        <TabsContent value="web3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Web3.js Integration</CardTitle>
              <CardDescription>Connect to AndeChain using Web3.js</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                language="bash"
                title="Install Web3.js"
                code="npm install web3"
              />

              <CodeBlock
                language="javascript"
                title="Connect to AndeChain"
                code={`import Web3 from 'web3';

// Connect to AndeChain
const web3 = new Web3('${andeUrls.rpc.http}');

// Check connection
const isConnected = await web3.eth.net.isListening();
console.log('Connected:', isConnected);

// Get latest block
const blockNumber = await web3.eth.getBlockNumber();
console.log('Latest block:', blockNumber);

// Get balance
const balance = await web3.eth.getBalance('0xYourAddress');
console.log('Balance:', web3.utils.fromWei(balance, 'ether'), 'ANDE');`}
              />

              <CodeBlock
                language="javascript"
                title="Send Transaction"
                code={`// Send ANDE tokens
const tx = {
  from: '0xYourAddress',
  to: '0xRecipientAddress',
  value: web3.utils.toWei('1', 'ether'), // 1 ANDE
  gas: 21000,
};

const receipt = await web3.eth.sendTransaction(tx);
console.log('Transaction hash:', receipt.transactionHash);`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ethers.js Tab */}
        <TabsContent value="ethers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ethers.js Integration</CardTitle>
              <CardDescription>Connect to AndeChain using Ethers.js v6</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                language="bash"
                title="Install Ethers.js"
                code="npm install ethers"
              />

              <CodeBlock
                language="javascript"
                title="Connect to AndeChain"
                code={`import { JsonRpcProvider } from 'ethers';

// Connect to AndeChain
const provider = new JsonRpcProvider('${andeUrls.rpc.http}');

// Get network info
const network = await provider.getNetwork();
console.log('Chain ID:', network.chainId);

// Get latest block
const blockNumber = await provider.getBlockNumber();
console.log('Latest block:', blockNumber);

// Get balance
const balance = await provider.getBalance('0xYourAddress');
console.log('Balance:', ethers.formatEther(balance), 'ANDE');`}
              />

              <CodeBlock
                language="javascript"
                title="Send Transaction with Wallet"
                code={`import { Wallet, parseEther } from 'ethers';

// Create wallet (use your private key)
const wallet = new Wallet('YOUR_PRIVATE_KEY', provider);

// Send transaction
const tx = await wallet.sendTransaction({
  to: '0xRecipientAddress',
  value: parseEther('1.0'), // 1 ANDE
});

console.log('Transaction hash:', tx.hash);

// Wait for confirmation
const receipt = await tx.wait();
console.log('Confirmed in block:', receipt.blockNumber);`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Viem Tab */}
        <TabsContent value="viem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Viem Integration</CardTitle>
              <CardDescription>Modern TypeScript library for AndeChain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                language="bash"
                title="Install Viem"
                code="npm install viem"
              />

              <CodeBlock
                language="typescript"
                title="Define AndeChain"
                code={`import { defineChain } from 'viem';

export const andechain = defineChain({
  id: ${andeNetworkInfo.chainId},
  name: '${andeNetworkInfo.name}',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { http: ['${andeUrls.rpc.http}'] },
    public: { http: ['${andeUrls.rpc.http}'] },
  },
  blockExplorers: {
    default: { name: 'AndeScan', url: '${andeUrls.explorer}' },
  },
  testnet: true,
});`}
              />

              <CodeBlock
                language="typescript"
                title="Use with Wagmi + Viem"
                code={`import { createPublicClient, http } from 'viem';
import { andechain } from './chains';

// Create public client
const client = createPublicClient({
  chain: andechain,
  transport: http(),
});

// Get block number
const blockNumber = await client.getBlockNumber();
console.log('Block:', blockNumber);

// Get balance
const balance = await client.getBalance({ 
  address: '0xYourAddress' 
});
console.log('Balance:', balance);`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hardhat Tab */}
        <TabsContent value="hardhat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hardhat Configuration</CardTitle>
              <CardDescription>Deploy contracts to AndeChain with Hardhat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock
                language="bash"
                title="Install Hardhat"
                code="npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox"
              />

              <CodeBlock
                language="javascript"
                title="hardhat.config.js"
                code={`require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",
  networks: {
    andechain: {
      url: "${andeUrls.rpc.http}",
      chainId: ${andeNetworkInfo.chainId},
      accounts: [process.env.PRIVATE_KEY], // Add your private key to .env
      gasPrice: 1000000000, // 1 Gwei
    },
  },
  etherscan: {
    apiKey: {
      andechain: "not-needed",
    },
    customChains: [
      {
        network: "andechain",
        chainId: ${andeNetworkInfo.chainId},
        urls: {
          apiURL: "${andeUrls.explorer}/api",
          browserURL: "${andeUrls.explorer}",
        },
      },
    ],
  },
};`}
              />

              <CodeBlock
                language="bash"
                title="Deploy Contract"
                code={`# Deploy to AndeChain
npx hardhat run scripts/deploy.js --network andechain

# Verify contract (if explorer supports it)
npx hardhat verify --network andechain DEPLOYED_CONTRACT_ADDRESS "Constructor Arg 1"`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resources */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={andeUrls.docs} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Documentation
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={andeUrls.explorer} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Block Explorer
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={andeUrls.faucet} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Testnet Faucet
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={andeUrls.support} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Discord Support
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Advanced Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Token Duality</h4>
              <p className="text-xs text-muted-foreground">
                ANDE exists as both native gas token and ERC20. Precompile at{' '}
                <code className="text-xs">0x...00FD</code>
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Parallel EVM</h4>
              <p className="text-xs text-muted-foreground">
                16x concurrent transaction execution with automatic conflict detection
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">MEV Integration</h4>
              <p className="text-xs text-muted-foreground">
                Built-in MEV detection and equitable distribution to stakers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

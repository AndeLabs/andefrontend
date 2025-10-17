'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient, useWriteContract, useReadContract } from 'wagmi';
import { parseAbi, parseEther, formatEther, isAddress, encodeFunctionData, decodeFunctionResult } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { andechain } from '@/lib/chains';
import {
  Code2,
  Upload,
  Play,
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileCode,
  Settings,
  Zap,
  Book,
  Terminal,
  FileText,
  Cpu,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DeployedContract {
  address: string;
  name: string;
  abi: string;
  deployedAt: number;
  txHash: string;
}

interface ContractCall {
  method: string;
  params: string[];
  result?: string;
  timestamp: number;
  success: boolean;
}

const SAMPLE_CONTRACTS = {
  simpleStorage: {
    name: 'SimpleStorage',
    bytecode: '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea2646970667358221220e9b8b3f3c0e3e9c0e3e9c0e3e9c0e3e9c0e3e9c0e3e9c0e3e9c0e364736f6c63430008110033',
    abi: [
      'function store(uint256 num) public',
      'function retrieve() public view returns (uint256)',
    ],
  },
  erc20Token: {
    name: 'SimpleERC20',
    bytecode: '0x60806040523480156200001157600080fd5b5060405162001a9038038062001a908339818101604052810190620000379190620001f7565b818181600390816200004a919062000493565b5080600490816200005c919062000493565b50505062000079336200008360201b60201c565b50505062000657565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603620000f5576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620000ec90620005db565b60405180910390fd5b806005806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a350565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620001f082620001a5565b810181811067ffffffffffffffff82111715620002125762000211620001b6565b5b80604052505050565b6000620002276200018c565b9050620002358282620001e5565b919050565b600067ffffffffffffffff821115620002585762000257620001b6565b5b620002638262000493565b9050602081019050919050565b60005b838110156200029057808201518184015260208101905062000273565b60008484015250505050565b6000620002b3620002ad846200023a565b6200021b565b905082815260208101848484011115620002d257620002d1620001a0565b5b620002df84828562000270565b509392505050565b600082601f830112620002ff57620002fe6200019b565b5b81516200031184826020860162000296565b91505092915050565b600080604083850312156200033457620003336200018c565b5b600083015167ffffffffffffffff81111562000355576200035462000196565b5b6200036385828601620002e7565b925050602083015167ffffffffffffffff81111562000387576200038662000196565b5b6200039585828601620002e7565b9150509250929050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680620003f257607f821691505b602082108103620004085762000407620003aa565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026200047c7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826200043d565b6200048886836200043d565b95508019841693508086168417925050509392505050565b6000620004af826200039f565b9050919050565b82818337600083830152505050565b6000620004dc620004d6620004d0846200039f565b6200041f565b620004a4565b9050919050565b6000620004f08262000429565b9050919050565b60006200050482620004e3565b9050919050565b60006200051882620004f7565b9050919050565b6000620005306200052a846200050b565b62000429565b9050919050565b60006200054462000429565b90506200055282826200044a565b919050565b60008190508160005260206000209050919050565b60006200057982620005c3565b90508091505092915050565b60008190508160005260206000209050919050565b6000620005a782620004e3565b9050919050565b6000620005bb8262000557565b9050919050565b6000620005cf82620005ae565b9050919050565b60006020820190508181036000830152620005f1816200056c565b9050919050565b61142980620006076000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461016857806370a082311461019857806395d89b41146101c8578063a457c2d7146101e6578063a9059cbb14610216578063dd62ed3e14610246576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a578063313ce5671461014a575b600080fd5b6100b6610276565b6040516100c3919061038c565b60405180910390f35b6100e660048036038101906100e191906103e0565b610308565b6040516100f3919061043b565b60405180910390f35b61010461032b565b6040516101119190610465565b60405180910390f35b610134600480360381019061012f9190610480565b610335565b604051610141919061043b565b60405180910390f35b610152610364565b60405161015f91906104ef565b60405180910390f35b610182600480360381019061017d91906103e0565b61036d565b60405161018f919061043b565b60405180910390f35b6101b260048036038101906101ad919061050a565b6103a4565b6040516101bf9190610465565b60405180910390f35b6101d06103ec565b6040516101dd919061038c565b60405180910390f35b61020060048036038101906101fb91906103e0565b61047e565b60405161020d919061043b565b60405180910390f35b610230600480360381019061022b91906103e0565b6104f5565b60405161023d919061043b565b60405180910390f35b610260600480360381019061025b9190610537565b610518565b60405161026d9190610465565b60405180910390f35b60606003805461028590610593565b80601f01602080910402602001604051908101604052809291908181526020018280546102b190610593565b80156102fe5780601f106102d3576101008083540402835291602001916102fe565b820191906000526020600020905b8154815290600101906020018083116102e157829003601f168201915b5050505050905090565b60008061031361059f565b90506103208185856105a7565b600191505092915050565b6000600254905090565b60008061034061059f565b905061034d858285610770565b6103588585856107fc565b60019150509392505050565b60006012905090565b60008061037861059f565b905061039981858561038a8589610518565b61039491906105f3565b6105a7565b600191505092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6060600480546103fb90610593565b80601f016020809104026020016040519081016040528092919081815260200182805461042790610593565b80156104745780601f1061044957610100808354040283529160200191610474565b820191906000526020600020905b81548152906001019060200180831161045757829003601f168201915b5050505050905090565b60008061048961059f565b9050600061049782866105518565b9050838110156104dc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104d390610699565b60405180910390fd5b6104e982868684036105a7565b60019250505092915050565b60008061050061059f565b905061050d8185856107fc565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600081600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516106ef9190610465565b60405180910390a3600190509392505050565b6000610778600073ffffffffffffffffffffffffffffffffffffffff16565b905090565b6000819050919050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006107e8826107bd565b9050919050565b6107f8816107dd565b811461080357600080fd5b50565b600081359050610815816107ef565b92915050565b6000610826826107af565b9050919050565b6108368161081b565b811461084157600080fd5b50565b6000813590506108538161082d565b92915050565b600080604083850312156108705761086f6107b8565b5b600061087e85828601610806565b925050602061088f85828601610844565b9150509250929050565b60008115159050919050565b6108ae81610899565b82525050565b60006020820190506108c960008301846108a5565b92915050565b6108d88161081b565b82525050565b60006020820190506108f360008301846108cf565b92915050565b6000806000606084860312156109125761091161072565b5b600061092086828701610806565b935050602061093186828701610806565b925050604061094286828701610844565b9150509250925092565b600060ff82169050919050565b6109628161094c565b82525050565b600060208201905061097d6000830184610959565b92915050565b60006020828403121561099957610998610725565b5b60006109a784828501610806565b91505092915050565b600080604083850312156109c7576109c6610725565b5b60006109d585828601610806565b92505060206109e685828601610806565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610a3757607f821691505b602082108103610a4a57610a496109f0565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610a8a8261081b565b9150610a958361081b565b9250828201905080821115610aad57610aac610a50565b5b92915050565b7f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760008201527f207a65726f000000000000000000000000000000000000000000000000000000602082015250565b6000610b0f602583610773565b9150610b1a82610ab3565b604082019050919050565b60006020820190508181036000830152610b3e81610b02565b905091905056fea264697066735822122019f8c2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f064736f6c63430008110033',
    abi: [
      'constructor(string memory name, string memory symbol)',
      'function name() public view returns (string)',
      'function symbol() public view returns (string)',
      'function decimals() public view returns (uint8)',
      'function totalSupply() public view returns (uint256)',
      'function balanceOf(address account) public view returns (uint256)',
      'function transfer(address to, uint256 amount) public returns (bool)',
      'function allowance(address owner, address spender) public view returns (uint256)',
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function transferFrom(address from, address to, uint256 amount) public returns (bool)',
    ],
  },
};

export default function DeveloperPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: andechain.id });
  const { data: walletClient } = useWalletClient({ chainId: andechain.id });
  const { toast } = useToast();

  // Deploy state
  const [selectedContract, setSelectedContract] = useState<'simpleStorage' | 'erc20Token'>('simpleStorage');
  const [customBytecode, setCustomBytecode] = useState('');
  const [customAbi, setCustomAbi] = useState('');
  const [contractName, setContractName] = useState('');
  const [constructorArgs, setConstructorArgs] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([]);

  // Interact state
  const [interactAddress, setInteractAddress] = useState('');
  const [interactAbi, setInteractAbi] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('');
  const [functionParams, setFunctionParams] = useState('');
  const [callResult, setCallResult] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callHistory, setCallHistory] = useState<ContractCall[]>([]);

  // Encode/Decode state
  const [encodeFunction, setEncodeFunction] = useState('');
  const [encodeParams, setEncodeParams] = useState('');
  const [encodedData, setEncodedData] = useState('');
  const [decodeAbi, setDecodeAbi] = useState('');
  const [decodeData, setDecodeData] = useState('');
  const [decodedResult, setDecodedResult] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✅ Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const handleDeploy = async () => {
    if (!walletClient || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to deploy contracts',
        variant: 'destructive',
      });
      return;
    }

    setIsDeploying(true);
    try {
      let bytecode: `0x${string}`;
      let abi: string[];
      let name: string;

      if (selectedContract === 'simpleStorage') {
        bytecode = SAMPLE_CONTRACTS.simpleStorage.bytecode as `0x${string}`;
        abi = SAMPLE_CONTRACTS.simpleStorage.abi;
        name = SAMPLE_CONTRACTS.simpleStorage.name;
      } else if (selectedContract === 'erc20Token') {
        bytecode = SAMPLE_CONTRACTS.erc20Token.bytecode as `0x${string}`;
        abi = SAMPLE_CONTRACTS.erc20Token.abi;
        name = SAMPLE_CONTRACTS.erc20Token.name;
      } else {
        bytecode = customBytecode as `0x${string}`;
        abi = JSON.parse(customAbi);
        name = contractName || 'Custom Contract';
      }

      const hash = await walletClient.deployContract({
        abi: parseAbi(abi),
        bytecode,
        account: address,
      });

      toast({
        title: 'Deployment Submitted',
        description: `Transaction hash: ${hash.slice(0, 10)}...`,
      });

      // Wait for transaction receipt
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.contractAddress) {
        const newContract: DeployedContract = {
          address: receipt.contractAddress,
          name,
          abi: JSON.stringify(abi),
          deployedAt: Date.now(),
          txHash: hash,
        };

        setDeployedContracts((prev) => [newContract, ...prev]);

        toast({
          title: '✅ Contract Deployed!',
          description: `Address: ${receipt.contractAddress}`,
        });
      }
    } catch (error) {
      console.error('Deploy error:', error);
      toast({
        title: 'Deployment Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCallFunction = async () => {
    if (!interactAddress || !interactAbi || !selectedFunction) {
      toast({
        title: 'Missing Information',
        description: 'Please provide contract address, ABI, and select a function',
        variant: 'destructive',
      });
      return;
    }

    setIsCalling(true);
    try {
      const abi = parseAbi(JSON.parse(interactAbi));
      const params = functionParams ? JSON.parse(`[${functionParams}]`) : [];

      const functionAbi = abi.find((item) => item.type === 'function' && item.name === selectedFunction);

      if (!functionAbi || functionAbi.type !== 'function') {
        throw new Error('Function not found in ABI');
      }

      // Check if function is view/pure (read-only)
      if (functionAbi.stateMutability === 'view' || functionAbi.stateMutability === 'pure') {
        // Read-only call
        const result = await publicClient!.readContract({
          address: interactAddress as `0x${string}`,
          abi,
          functionName: selectedFunction,
          args: params,
        });

        const resultString = JSON.stringify(result, (_, v) =>
          typeof v === 'bigint' ? v.toString() : v
        );
        setCallResult(resultString);

        setCallHistory((prev) => [
          {
            method: selectedFunction,
            params: params.map(String),
            result: resultString,
            timestamp: Date.now(),
            success: true,
          },
          ...prev.slice(0, 9),
        ]);

        toast({
          title: '✅ Function Called',
          description: `Result: ${resultString}`,
        });
      } else {
        // Write transaction
        if (!walletClient) {
          throw new Error('Wallet not connected');
        }

        const hash = await walletClient.writeContract({
          address: interactAddress as `0x${string}`,
          abi,
          functionName: selectedFunction,
          args: params,
          account: address!,
        });

        toast({
          title: 'Transaction Submitted',
          description: `Hash: ${hash.slice(0, 10)}...`,
        });

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });

        setCallResult(`Transaction confirmed in block ${receipt.blockNumber}`);

        setCallHistory((prev) => [
          {
            method: selectedFunction,
            params: params.map(String),
            result: `TX: ${hash}`,
            timestamp: Date.now(),
            success: receipt.status === 'success',
          },
          ...prev.slice(0, 9),
        ]);

        toast({
          title: '✅ Transaction Confirmed',
          description: `Block: ${receipt.blockNumber}`,
        });
      }
    } catch (error) {
      console.error('Call error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setCallHistory((prev) => [
        {
          method: selectedFunction,
          params: functionParams ? JSON.parse(`[${functionParams}]`).map(String) : [],
          timestamp: Date.now(),
          success: false,
        },
        ...prev.slice(0, 9),
      ]);

      toast({
        title: 'Function Call Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsCalling(false);
    }
  };

  const handleEncode = () => {
    try {
      const abi = parseAbi([encodeFunction]);
      const params = JSON.parse(`[${encodeParams}]`);
      const functionName = encodeFunction.match(/function\s+(\w+)/)?.[1];

      if (!functionName) {
        throw new Error('Invalid function signature');
      }

      const encoded = encodeFunctionData({
        abi,
        functionName,
        args: params,
      });

      setEncodedData(encoded);
      toast({
        title: '✅ Encoded Successfully',
        description: 'Function data encoded',
      });
    } catch (error) {
      console.error('Encode error:', error);
      toast({
        title: 'Encoding Failed',
        description: error instanceof Error ? error.message : 'Invalid input',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Code2 className="h-8 w-8 text-purple-500" />
          Developer Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          Deploy and interact with smart contracts on {andechain.name}
        </p>
      </div>

      <Tabs defaultValue="deploy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deploy">Deploy Contract</TabsTrigger>
          <TabsTrigger value="interact">Interact</TabsTrigger>
          <TabsTrigger value="encode">Encode/Decode</TabsTrigger>
          <TabsTrigger value="deployed">Deployed</TabsTrigger>
        </TabsList>

        {/* Deploy Contract Tab */}
        <TabsContent value="deploy" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Deploy Smart Contract
                </CardTitle>
                <CardDescription>
                  Deploy a new contract to the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isConnected ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Wallet Not Connected</AlertTitle>
                    <AlertDescription>
                      Please connect your wallet to deploy contracts
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="contract-type">Contract Template</Label>
                      <Select
                        value={selectedContract}
                        onValueChange={(value: any) => setSelectedContract(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contract template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simpleStorage">
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4 w-4" />
                              <span>Simple Storage</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="erc20Token">
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4 w-4" />
                              <span>ERC20 Token</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedContract === 'simpleStorage' && (
                      <Alert>
                        <FileCode className="h-4 w-4" />
                        <AlertTitle>Simple Storage Contract</AlertTitle>
                        <AlertDescription>
                          A basic contract that stores and retrieves a single uint256 value.
                          <br />
                          <span className="text-xs font-mono">store(uint256) & retrieve()</span>
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedContract === 'erc20Token' && (
                      <Alert>
                        <FileCode className="h-4 w-4" />
                        <AlertTitle>ERC20 Token Contract</AlertTitle>
                        <AlertDescription>
                          Standard ERC20 token implementation with transfer, approve, and allowance.
                          <br />
                          <span className="text-xs font-mono">Requires: name and symbol</span>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="constructor-args">Constructor Arguments (JSON array)</Label>
                      <Textarea
                        id="constructor-args"
                        value={constructorArgs}
                        onChange={(e) => setConstructorArgs(e.target.value)}
                        placeholder='["MyToken", "MTK"]'
                        className="font-mono text-xs"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        For ERC20: ["Token Name", "SYMBOL"]
                      </p>
                    </div>

                    <Button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="w-full"
                      size="lg"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Deploying Contract...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          Deploy Contract
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Deployment Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <p className="text-sm text-muted-foreground">
                      {andechain.name} (Chain ID: {andechain.id})
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>RPC Endpoint</Label>
                    <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                      {andechain.rpcUrls.default.http[0]}
                    </code>
                  </div>

                  {deployedContracts.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Latest Deployed Contract</Label>
                        <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                          {deployedContracts[0].address}
                        </code>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { andechain } from '@/lib/chains';
import {
  Gavel,
  Plus,
  Vote,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  Target,
  BarChart3,
} from 'lucide-react';

interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  startTime: number;
  endTime: number;
  quorum: number;
  category: 'treasury' | 'protocol' | 'governance' | 'development';
  hasVoted: boolean;
  userVote?: 'for' | 'against';
}

interface VoteHistory {
  proposalId: number;
  proposalTitle: string;
  vote: 'for' | 'against';
  votingPower: number;
  timestamp: number;
}

export default function GovernancePage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address, chainId: andechain.id });
  const { toast } = useToast();

  // State
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [voteHistory, setVoteHistory] = useState<VoteHistory[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  // Create proposal form
  const [newProposalTitle, setNewProposalTitle] = useState('');
  const [newProposalDescription, setNewProposalDescription] = useState('');
  const [newProposalCategory, setNewProposalCategory] = useState<Proposal['category']>('protocol');

  // Governance stats
  const [governanceStats, setGovernanceStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    totalVoters: 0,
    votingPower: 0,
    participationRate: 0,
  });

  // Load mock data
  useEffect(() => {
    if (isConnected) {
      const mockProposals: Proposal[] = [
        {
          id: 1,
          title: 'Increase Staking Rewards by 2%',
          description: 'Proposal to increase the base staking APR from 10% to 12% to incentivize more long-term holders and improve network security.',
          proposer: '0x1234...5678',
          status: 'active',
          votesFor: 12500,
          votesAgainst: 3200,
          totalVotes: 15700,
          startTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
          endTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
          quorum: 10000,
          category: 'protocol',
          hasVoted: false,
        },
        {
          id: 2,
          title: 'Treasury Allocation for Marketing',
          description: 'Allocate 50,000 ANDE tokens from the treasury for Q1 2025 marketing initiatives including partnerships, events, and community growth.',
          proposer: '0xabcd...efgh',
          status: 'active',
          votesFor: 8900,
          votesAgainst: 6100,
          totalVotes: 15000,
          startTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
          endTime: Date.now() + 6 * 24 * 60 * 60 * 1000,
          quorum: 10000,
          category: 'treasury',
          hasVoted: false,
        },
        {
          id: 3,
          title: 'Implement EIP-4844 Blob Transactions',
          description: 'Integrate EIP-4844 blob transactions to reduce gas costs for L2 data availability and improve scalability.',
          proposer: '0x9876...4321',
          status: 'passed',
          votesFor: 18500,
          votesAgainst: 2100,
          totalVotes: 20600,
          startTime: Date.now() - 10 * 24 * 60 * 60 * 1000,
          endTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
          quorum: 10000,
          category: 'development',
          hasVoted: true,
          userVote: 'for',
        },
        {
          id: 4,
          title: 'Reduce Governance Proposal Threshold',
          description: 'Lower the minimum token requirement for creating proposals from 10,000 ANDE to 5,000 ANDE to enable broader community participation.',
          proposer: '0x5555...6666',
          status: 'rejected',
          votesFor: 4200,
          votesAgainst: 8900,
          totalVotes: 13100,
          startTime: Date.now() - 15 * 24 * 60 * 60 * 1000,
          endTime: Date.now() - 8 * 24 * 60 * 60 * 1000,
          quorum: 10000,
          category: 'governance',
          hasVoted: true,
          userVote: 'against',
        },
      ];

      setProposals(mockProposals);
      setGovernanceStats({
        totalProposals: 4,
        activeProposals: 2,
        totalVoters: 342,
        votingPower: 100,
        participationRate: 68.5,
      });

      const mockHistory: VoteHistory[] = [
        {
          proposalId: 3,
          proposalTitle: 'Implement EIP-4844 Blob Transactions',
          vote: 'for',
          votingPower: 100,
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
        {
          proposalId: 4,
          proposalTitle: 'Reduce Governance Proposal Threshold',
          vote: 'against',
          votingPower: 100,
          timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
        },
      ];

      setVoteHistory(mockHistory);
    }
  }, [isConnected]);

  const handleCreateProposal = async () => {
    if (!newProposalTitle || !newProposalDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // Simulate proposal creation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newProposal: Proposal = {
        id: proposals.length + 1,
        title: newProposalTitle,
        description: newProposalDescription,
        proposer: address || '0x0000...0000',
        status: 'pending',
        votesFor: 0,
        votesAgainst: 0,
        totalVotes: 0,
        startTime: Date.now() + 24 * 60 * 60 * 1000,
        endTime: Date.now() + 8 * 24 * 60 * 60 * 1000,
        quorum: 10000,
        category: newProposalCategory,
        hasVoted: false,
      };

      setProposals((prev) => [newProposal, ...prev]);
      setGovernanceStats((prev) => ({ ...prev, totalProposals: prev.totalProposals + 1 }));

      toast({
        title: '✅ Proposal Created',
        description: 'Your proposal has been submitted successfully',
      });

      // Reset form
      setNewProposalTitle('');
      setNewProposalDescription('');
      setNewProposalCategory('protocol');
    } catch (error) {
      console.error('Create proposal error:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (proposalId: number, vote: 'for' | 'against') => {
    setIsVoting(true);
    setSelectedProposal(proposalId);

    try {
      // Simulate voting
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setProposals((prev) =>
        prev.map((p) => {
          if (p.id === proposalId) {
            const votePower = governanceStats.votingPower;
            return {
              ...p,
              votesFor: vote === 'for' ? p.votesFor + votePower : p.votesFor,
              votesAgainst: vote === 'against' ? p.votesAgainst + votePower : p.votesAgainst,
              totalVotes: p.totalVotes + votePower,
              hasVoted: true,
              userVote: vote,
            };
          }
          return p;
        })
      );

      const proposal = proposals.find((p) => p.id === proposalId);
      if (proposal) {
        const newVote: VoteHistory = {
          proposalId,
          proposalTitle: proposal.title,
          vote,
          votingPower: governanceStats.votingPower,
          timestamp: Date.now(),
        };
        setVoteHistory((prev) => [newVote, ...prev]);
      }

      toast({
        title: '✅ Vote Recorded',
        description: `Successfully voted ${vote === 'for' ? 'FOR' : 'AGAINST'} the proposal`,
      });
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: 'Vote Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsVoting(false);
      setSelectedProposal(null);
    }
  };

  const getStatusBadge = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'passed':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Passed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getCategoryBadge = (category: Proposal['category']) => {
    const colors = {
      treasury: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      protocol: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      governance: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      development: 'bg-green-500/10 text-green-500 border-green-500/20',
    };

    return (
      <Badge variant="outline" className={colors[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const calculateProgress = (votesFor: number, totalVotes: number): number => {
    if (totalVotes === 0) return 0;
    return (votesFor / totalVotes) * 100;
  };

  const formatTimeRemaining = (endTime: number): string => {
    const diff = endTime - Date.now();
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Gavel className="h-8 w-8 text-purple-500" />
          Governance
        </h1>
        <p className="text-muted-foreground mt-2">
          Participate in {andechain.name} governance by creating and voting on proposals
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{governanceStats.totalProposals}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{governanceStats.activeProposals}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently voting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{governanceStats.totalVoters}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Voting Power</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{governanceStats.votingPower}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on ANDE balance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="proposals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
          <TabsTrigger value="history">My Votes</TabsTrigger>
        </TabsList>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-6">
          {!isConnected ? (
            <Card>
              <CardContent className="py-8">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wallet Not Connected</AlertTitle>
                  <AlertDescription>
                    Please connect your wallet to view and vote on proposals
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : proposals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No proposals found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(proposal.status)}
                          {getCategoryBadge(proposal.category)}
                          <Badge variant="outline" className="text-xs">
                            #{proposal.id}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {proposal.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Proposer</p>
                        <code className="text-xs font-mono">{proposal.proposer}</code>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Time Remaining</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTimeRemaining(proposal.endTime)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Voting Progress */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Votes</span>
                        <span className="font-semibold">
                          {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()} (Quorum)
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-500 flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            For
                          </span>
                          <span className="font-semibold">
                            {proposal.votesFor.toLocaleString()} (
                            {proposal.totalVotes > 0
                              ? ((proposal.votesFor / proposal.totalVotes) * 100).toFixed(1)
                              : 0}
                            %)
                          </span>
                        </div>
                        <Progress value={calculateProgress(proposal.votesFor, proposal.totalVotes)} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-500 flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3" />
                            Against
                          </span>
                          <span className="font-semibold">
                            {proposal.votesAgainst.toLocaleString()} (
                            {proposal.totalVotes > 0
                              ? ((proposal.votesAgainst / proposal.totalVotes) * 100).toFixed(1)
                              : 0}
                            %)
                          </span>
                        </div>
                        <Progress
                          value={
                            proposal.totalVotes > 0
                              ? (proposal.votesAgainst / proposal.totalVotes) * 100
                              : 0
                          }
                          className="[&>*]:bg-red-500"
                        />
                      </div>
                    </div>

                    {/* Voting Buttons */}
                    {proposal.status === 'active' && (
                      <>
                        <Separator />
                        {proposal.hasVoted ? (
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>You voted {proposal.userVote?.toUpperCase()}</AlertTitle>
                            <AlertDescription>
                              Your vote has been recorded with {governanceStats.votingPower} voting
                              power
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => handleVote(proposal.id, 'for')}
                              disabled={isVoting}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {isVoting && selectedProposal === proposal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <ThumbsUp className="mr-2 h-4 w-4" />
                                  Vote For
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleVote(proposal.id, 'against')}
                              disabled={isVoting}
                              variant="destructive"
                            >
                              {isVoting && selectedProposal === proposal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <ThumbsDown className="mr-2 h-4 w-4" />
                                  Vote Against
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Proposal Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Proposal
              </CardTitle>
              <CardDescription>
                Submit a proposal for the community to vote on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wallet Not Connected</AlertTitle>
                  <AlertDescription>
                    Please connect your wallet to create proposals
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="proposal-title">Proposal Title</Label>
                    <Input
                      id="proposal-title"
                      value={newProposalTitle}
                      onChange={(e) => setNewProposalTitle(e.target.value)}
                      placeholder="Enter a clear and concise title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proposal-description">Description</Label>
                    <Textarea
                      id="proposal-description"
                      value={newProposalDescription}
                      onChange={(e) => setNewProposalDescription(e.target.value)}
                      placeholder="Provide detailed information about your proposal, including rationale and expected impact..."
                      rows={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['treasury', 'protocol', 'governance', 'development'] as const).map(
                        (cat) => (
                          <Button
                            key={cat}
                            variant={newProposalCategory === cat ? 'default' : 'outline'}
                            onClick={() => setNewProposalCategory(cat)}
                            className="justify-start"
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <Separator />

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Proposal Requirements</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Minimum 10,000 ANDE tokens required</li>
                        <li>Voting period: 7 days</li>
                        <li>Quorum requirement: 10,000 votes</li>
                        <li>Cannot be cancelled once created</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleCreateProposal}
                    disabled={isCreating || !newProposalTitle || !newProposalDescription}
                    className="w-full"
                    size="lg"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Proposal...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Create Proposal
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vote History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                My Voting History
              </CardTitle>
              <CardDescription>View your past votes and participation</CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wallet Not Connected</AlertTitle>
                  <AlertDescription>
                    Please connect your wallet to view your voting history
                  </AlertDescription>
                </Alert>
              ) : voteHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No voting history yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start participating in governance by voting on active proposals
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {voteHistory.map((vote, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">#{vote.proposalId}</Badge>
                          {vote.vote === 'for' ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              For
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Against
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{vote.proposalTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(vote.timestamp).toLocaleDateString()} • Voting Power:{' '}
                          {vote.votingPower}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
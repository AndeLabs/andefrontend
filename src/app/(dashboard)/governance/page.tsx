
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Lightbulb, UserCheck, UserX } from 'lucide-react';

const proposals = [
  {
    id: 'AIP-001',
    title: 'Increase Sequencer Node Rewards by 5%',
    status: 'Active',
    endDate: 'in 3 days',
    votesFor: 72,
    votesAgainst: 28,
    description: 'This proposal aims to incentivize sequencer node operators by increasing staking rewards, thus enhancing network security and performance.',
  },
  {
    id: 'AIP-002',
    title: 'Fund a Community-Led Marketing Initiative',
    status: 'Active',
    endDate: 'in 10 days',
    votesFor: 85,
    votesAgainst: 15,
    description: 'Allocate 50,000 AND from the treasury to fund a 3-month marketing campaign managed by community-elected members.',
  },
    {
    id: 'AIP-003',
    title: 'Integrate a New Liquidity Protocol',
    status: 'Passed',
    endDate: '2 weeks ago',
    votesFor: 91,
    votesAgainst: 9,
    description: 'Partner with LiquiFi to add new yield farming opportunities for AND token holders.',
  },
];

export default function GovernancePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Governance</h1>
            <Button size="lg">
                <Lightbulb className="mr-2" />
                Create Proposal
            </Button>
        </div>
        
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Proposals</h2>
            {proposals.filter(p => p.status === 'Active').map(proposal => (
                <Card key={proposal.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{proposal.id}: {proposal.title}</CardTitle>
                                <CardDescription className="mt-1">{proposal.description}</CardDescription>
                            </div>
                            <Badge variant={proposal.status === 'Active' ? 'default' : 'secondary'}
                                   className={proposal.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : ''}>
                                {proposal.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-1">
                                    <span>For ({proposal.votesFor}%)</span>
                                    <span>Against ({proposal.votesAgainst}%)</span>
                                </div>
                                <Progress value={proposal.votesFor} />
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">Voting ends {proposal.endDate}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm"><UserCheck className="mr-2" /> Vote For</Button>
                                    <Button variant="destructive" size="sm"><UserX className="mr-2" /> Vote Against</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>My Voting Power</CardTitle>
                <CardDescription>Based on your staked AND and governance participation.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-4xl font-bold">12,500.75</p>
                <p className="text-muted-foreground">votes</p>
                <Button variant="secondary" className="w-full mt-4">Delegate Votes</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>How Governance Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Any user with over 1,000 voting power can create a proposal.</p>
                <p>2. Proposals are voted on by the community for a 14-day period.</p>
                <p>3. A proposal passes if it reaches a quorum of 20% participation and over 50% 'For' votes.</p>
                <Button variant="link" className="p-0 h-auto">Read Full Documentation</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Passed Proposals</CardTitle>
            </CardHeader>
             <CardContent>
                <ul className="space-y-3">
                    {proposals.filter(p => p.status === 'Passed').map(p => (
                        <li key={p.id} className="flex items-center gap-3 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground"/>
                            <span className="font-medium">{p.id}:</span>
                            <span className="text-muted-foreground truncate">{p.title}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

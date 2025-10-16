
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
import { FileText, Lightbulb, UserCheck, UserX, Vote } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Governance</h1>
            <p className="text-muted-foreground">Participate in the future of AndeChain.</p>
          </div>
          <Button size="lg">
              <Lightbulb className="mr-2" />
              Create Proposal
          </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Active Proposals</h2>
            {proposals.filter(p => p.status === 'Active').map(proposal => (
                <Card key={proposal.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge variant="secondary" className="mb-2">
                                  {proposal.id}
                                </Badge>
                                <CardTitle className="text-lg">{proposal.title}</CardTitle>
                                <CardDescription className="mt-2 text-sm">{proposal.description}</CardDescription>
                            </div>
                            <Badge variant={proposal.status === 'Active' ? 'default' : 'secondary'}
                                   className={proposal.status === 'Active' ? 'bg-green-600/10 text-green-400 border-green-400/20' : ''}>
                                {proposal.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="flex items-center gap-2 text-green-500"><UserCheck size={16} /> For</span>
                                    <span className="flex items-center gap-2 text-red-500">Against <UserX size={16} /></span>
                                </div>
                                <Progress value={proposal.votesFor} className="h-2"/>
                                <div className="flex justify-between text-xs font-bold mt-1">
                                    <span>{proposal.votesFor}%</span>
                                    <span>{proposal.votesAgainst}%</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">Voting ends {proposal.endDate}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">Vote For</Button>
                                    <Button variant="destructive" size="sm">Vote Against</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="text-center">
              <CardHeader>
                  <CardTitle>My Voting Power</CardTitle>
              </CardHeader>
              <CardContent>
                  <Vote className="w-12 h-12 mx-auto text-primary mb-2"/>
                  <p className="text-4xl font-bold">12,500.75</p>
                  <p className="text-muted-foreground text-sm">votes</p>
                  <Button variant="secondary" className="w-full mt-4">Delegate Votes</Button>
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
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0"/>
                            <div>
                              <span className="font-medium">{p.id}:</span>
                              <span className="text-muted-foreground ml-1">{p.title}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

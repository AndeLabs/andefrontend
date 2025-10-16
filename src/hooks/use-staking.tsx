
'use client';

import { useState, useMemo } from 'react';
import { Shield, BarChart, Zap } from 'lucide-react';

export const tiers = [
  {
    id: 'sequencer',
    name: 'Sequencer',
    description: 'Help secure the network by running a sequencer node.',
    apy: 12.5,
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'governance',
    name: 'Governance',
    description: 'Participate in proposals and vote on the future of the protocol.',
    apy: 8.2,
    icon: <BarChart className="w-5 h-5" />,
  },
  {
    id: 'liquidity',
    name: 'Liquidity',
    description: 'Provide liquidity to the ecosystem and earn rewards.',
    apy: 15.0,
    icon: <Zap className="w-5 h-5" />,
  },
];

export const lockPeriods = [
  { months: 3, multiplier: 1.1 },
  { months: 6, multiplier: 1.25 },
  { months: 12, multiplier: 1.5 },
  { months: 24, multiplier: 2.0 },
];

export function useStaking() {
  const [selectedTier, setSelectedTier] = useState(tiers[0]);
  const [amount, setAmount] = useState('1000');
  const [lockPeriodIndex, setLockPeriodIndex] = useState(2); // Default to 12 months

  const { lockDetails, finalApy, yearlyReward, monthlyReward } = useMemo(() => {
    const lockDetails = lockPeriods[lockPeriodIndex];
    const finalApy = selectedTier.apy * lockDetails.multiplier;
    const yearlyReward = (parseFloat(amount) * finalApy) / 100;
    const monthlyReward = yearlyReward / 12;
    return { lockDetails, finalApy, yearlyReward, monthlyReward };
  }, [selectedTier, amount, lockPeriodIndex]);

  return {
    selectedTier,
    setSelectedTier,
    amount,
    setAmount,
    lockPeriodIndex,
    setLockPeriodIndex,
    lockDetails,
    finalApy,
    yearlyReward,
    monthlyReward,
  };
}

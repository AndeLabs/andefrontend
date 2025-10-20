#!/usr/bin/env node

/**
 * Network Health Verification Script
 * 
 * This script tests the RPC endpoint and verifies that the blockchain
 * is producing blocks correctly.
 * 
 * Usage: node scripts/test-network-health.js
 */

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
const CHECK_INTERVAL = 2000; // 2 seconds
const MAX_CHECKS = 10;

console.log('🔍 AndeChain Network Health Test\n');
console.log(`RPC Endpoint: ${RPC_URL}\n`);

let checkCount = 0;
let lastBlockNumber = null;
let lastBlockTime = Date.now();
const blockTimes = [];

async function rpcCall(method, params = []) {
  const startTime = Date.now();
  
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return { result: data.result, latency };
}

async function checkNetworkHealth() {
  try {
    // Get block number
    const { result: blockNumberHex, latency: blockLatency } = await rpcCall('eth_blockNumber');
    const blockNumber = parseInt(blockNumberHex, 16);

    // Get chain ID
    const { result: chainIdHex } = await rpcCall('eth_chainId');
    const chainId = parseInt(chainIdHex, 16);

    // Get gas price
    const { result: gasPriceHex } = await rpcCall('eth_gasPrice');
    const gasPrice = parseInt(gasPriceHex, 16);

    // Get latest block details
    const { result: block } = await rpcCall('eth_getBlockByNumber', ['latest', false]);
    
    const now = Date.now();
    let blockAge = 0;
    let newBlock = false;

    if (lastBlockNumber !== null) {
      if (blockNumber > lastBlockNumber) {
        const timeSinceLastBlock = (now - lastBlockTime) / 1000;
        blockTimes.push(timeSinceLastBlock);
        blockAge = 0;
        newBlock = true;
        lastBlockTime = now;
      } else {
        blockAge = Math.floor((now - lastBlockTime) / 1000);
      }
    } else {
      lastBlockTime = now;
    }

    lastBlockNumber = blockNumber;

    // Calculate average block time
    const avgBlockTime = blockTimes.length > 0
      ? blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length
      : 0;

    // Determine health status
    let healthStatus = '✅ HEALTHY';
    let healthColor = '\x1b[32m'; // Green

    if (blockAge > 10) {
      healthStatus = '❌ STALLED';
      healthColor = '\x1b[31m'; // Red
    } else if (blockAge > 6) {
      healthStatus = '⚠️  SLOW';
      healthColor = '\x1b[33m'; // Yellow
    }

    // Determine latency status
    let latencyStatus = 'Excellent';
    if (blockLatency > 100 && blockLatency < 300) {
      latencyStatus = 'Good';
    } else if (blockLatency >= 300) {
      latencyStatus = 'Poor';
    }

    // Print status
    console.log(`\n${healthColor}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
    console.log(`${healthColor}Check #${checkCount + 1}/${MAX_CHECKS} - ${healthStatus}\x1b[0m`);
    console.log(`${healthColor}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
    
    console.log(`\n📊 Network Metrics:`);
    console.log(`   Block Number:     ${blockNumber} ${newBlock ? '🆕' : ''}`);
    console.log(`   Chain ID:         ${chainId}`);
    console.log(`   Gas Price:        ${gasPrice} wei (${(gasPrice / 1e9).toFixed(4)} Gwei)`);
    console.log(`   Transactions:     ${block.transactions.length}`);
    console.log(`   Gas Used:         ${parseInt(block.gasUsed, 16).toLocaleString()}`);
    console.log(`   Gas Limit:        ${parseInt(block.gasLimit, 16).toLocaleString()}`);
    
    console.log(`\n⏱️  Timing:`);
    console.log(`   RPC Latency:      ${blockLatency}ms (${latencyStatus})`);
    console.log(`   Block Age:        ${blockAge}s`);
    if (avgBlockTime > 0) {
      console.log(`   Avg Block Time:   ${avgBlockTime.toFixed(2)}s`);
    }
    
    const blockTimestamp = parseInt(block.timestamp, 16);
    const blockDate = new Date(blockTimestamp * 1000);
    const systemTime = new Date();
    const timeDiff = Math.abs(systemTime - blockDate) / 1000;
    
    console.log(`\n🕐 Timestamps:`);
    console.log(`   Block Time:       ${blockDate.toISOString()}`);
    console.log(`   System Time:      ${systemTime.toISOString()}`);
    console.log(`   Time Diff:        ${timeDiff.toFixed(0)}s`);
    
    if (timeDiff > 60) {
      console.log(`   ⚠️  Block timestamp is ${Math.floor(timeDiff)}s ${blockDate < systemTime ? 'behind' : 'ahead'} of system time`);
      console.log(`   ℹ️  This is normal after chain restart - health uses block progression instead`);
    }

    checkCount++;

    if (checkCount < MAX_CHECKS) {
      console.log(`\n⏳ Waiting ${CHECK_INTERVAL / 1000}s for next check...`);
      setTimeout(checkNetworkHealth, CHECK_INTERVAL);
    } else {
      console.log('\n\n' + '='.repeat(50));
      console.log('📈 Final Statistics:');
      console.log('='.repeat(50));
      console.log(`Total Checks:     ${checkCount}`);
      console.log(`Blocks Produced:  ${blockTimes.length}`);
      if (blockTimes.length > 0) {
        console.log(`Avg Block Time:   ${avgBlockTime.toFixed(2)}s`);
        console.log(`Min Block Time:   ${Math.min(...blockTimes).toFixed(2)}s`);
        console.log(`Max Block Time:   ${Math.max(...blockTimes).toFixed(2)}s`);
      }
      
      const successRate = (blockTimes.length / (checkCount - 1)) * 100;
      console.log(`\n✅ Block Production Rate: ${successRate.toFixed(1)}%`);
      
      if (successRate >= 80) {
        console.log('\n🎉 Network is HEALTHY and producing blocks regularly!');
      } else if (successRate >= 50) {
        console.log('\n⚠️  Network is SLOW - block production is inconsistent');
      } else {
        console.log('\n❌ Network appears to be STALLED - very few new blocks');
      }
      
      console.log('\n💡 Frontend should use block progression (not timestamps) for health checks');
      console.log('   This avoids false positives when chain has old block timestamps.\n');
    }

  } catch (error) {
    console.error(`\n❌ Error checking network health:`, error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify blockchain is running: make start (in andechain/)');
    console.error('   2. Check RPC endpoint is accessible: curl ' + RPC_URL);
    console.error('   3. Verify firewall/network settings');
    process.exit(1);
  }
}

console.log('Starting network health monitoring...');
console.log(`Will perform ${MAX_CHECKS} checks at ${CHECK_INTERVAL / 1000}s intervals\n`);

checkNetworkHealth();
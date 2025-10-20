import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check API Route for AndeChain Frontend
 * 
 * This endpoint provides a health status for the frontend application
 * and can perform basic connectivity checks to ensure the app is ready.
 */

export async function GET(request: NextRequest) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'andechain-frontend',
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      checks: {
        server: 'ok',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      } as any
    };

    // Optional: Check blockchain connectivity if RPC_URL is available
    if (process.env.NEXT_PUBLIC_RPC_URL) {
      try {
        const rpcResponse = await fetch(process.env.NEXT_PUBLIC_RPC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (rpcResponse.ok) {
          const rpcData = await rpcResponse.json();
          (healthData.checks as any).blockchain = {
            status: 'connected',
            rpc_url: process.env.NEXT_PUBLIC_RPC_URL,
            latest_block: rpcData.result || 'unknown'
          };
        } else {
          (healthData.checks as any).blockchain = {
            status: 'disconnected',
            rpc_url: process.env.NEXT_PUBLIC_RPC_URL,
            error: `HTTP ${rpcResponse.status}`
          };
        }
      } catch (blockchainError) {
        (healthData.checks as any).blockchain = {
          status: 'error',
          rpc_url: process.env.NEXT_PUBLIC_RPC_URL,
          error: blockchainError instanceof Error ? blockchainError.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'andechain-frontend',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        server: 'error'
      }
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
/**
 * RPC Proxy Route - Professional Production Implementation
 * 
 * This API route acts as a proxy to the AndeChain RPC endpoint,
 * solving CORS issues and providing centralized error handling,
 * rate limiting, and monitoring for production deployments.
 * 
 * Features:
 * - CORS handling
 * - Request validation
 * - Error handling with retry logic
 * - Request logging
 * - Rate limiting ready
 * - Health checks
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_HTTP || 'http://189.28.81.202:8545';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

// Type definitions
interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: any[];
  id: number | string;
}

interface JsonRpcResponse {
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string;
}

/**
 * Validate JSON-RPC request format
 */
function validateJsonRpcRequest(body: any): body is JsonRpcRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    body.jsonrpc === '2.0' &&
    typeof body.method === 'string' &&
    (body.id === undefined || typeof body.id === 'number' || typeof body.id === 'string')
  );
}

/**
 * Create JSON-RPC error response
 */
function createErrorResponse(id: number | string, code: number, message: string): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    error: {
      code,
      message,
    },
    id,
  };
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Forward request to RPC endpoint with retry logic
 */
async function forwardToRpc(request: JsonRpcRequest, attempt = 1): Promise<JsonRpcResponse> {
  try {
    const response = await fetchWithTimeout(
      RPC_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      REQUEST_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`RPC responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    // Retry logic
    if (attempt < MAX_RETRIES) {
      console.warn(`RPC request failed, retrying... (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      return forwardToRpc(request, attempt + 1);
    }

    // Max retries reached, return error
    console.error('RPC request failed after retries:', error.message);
    return createErrorResponse(
      request.id,
      -32603,
      `Internal error: ${error.message}`
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET handler for health checks
 */
export async function GET(req: NextRequest) {
  try {
    // Perform health check
    const healthCheck = await fetchWithTimeout(
      RPC_ENDPOINT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      },
      5000
    );

    const isHealthy = healthCheck.ok;

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        rpcEndpoint: RPC_ENDPOINT,
        timestamp: new Date().toISOString(),
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * POST handler for JSON-RPC requests
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate JSON-RPC format
    if (!validateJsonRpcRequest(body)) {
      return NextResponse.json(
        createErrorResponse(
          body?.id || 0,
          -32600,
          'Invalid JSON-RPC request'
        ),
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Log request (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RPC Proxy] ${body.method}`, body.params);
    }

    // Forward to RPC endpoint
    const rpcResponse = await forwardToRpc(body);

    // Log response errors
    if (rpcResponse.error) {
      console.error('[RPC Proxy] Error:', rpcResponse.error);
    }

    return NextResponse.json(rpcResponse, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[RPC Proxy] Unexpected error:', error);

    return NextResponse.json(
      createErrorResponse(
        0,
        -32603,
        'Internal server error'
      ),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

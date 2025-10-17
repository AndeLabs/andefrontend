import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a protected dashboard route
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/faucet') || 
      pathname.startsWith('/staking') || 
      pathname.startsWith('/governance') || 
      pathname.startsWith('/transactions') || 
      pathname.startsWith('/network')) {
    
    // For now, we'll let the client-side handle wallet connection
    // In the future, we could add server-side session validation here
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple middleware that just passes through
  // This is enough to trigger the Edge Runtime
  return NextResponse.next();
}

// Optional: Configure which paths the middleware runs on
export const config = {
  matcher: '/:path*',
};
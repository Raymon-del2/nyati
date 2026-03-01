import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hashKey } from '@/lib/keygen';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function middleware(request: NextRequest) {
  // Skip validation for docs (public)
  if (request.nextUrl.pathname.startsWith('/docs')) {
    return NextResponse.next();
  }

  // Skip validation for public API endpoints
  if (request.nextUrl.pathname.startsWith('/api/search') || 
      request.nextUrl.pathname.startsWith('/api/scrape')) {
    return NextResponse.next();
  }

  // Skip validation for proxy endpoint (handles its own validation)
  if (request.nextUrl.pathname.startsWith('/api/v1/proxy')) {
    return NextResponse.next();
  }

  // Skip validation for ping endpoint
  if (request.nextUrl.pathname.startsWith('/api/v1/ping')) {
    return NextResponse.next();
  }

  // Skip validation for AI endpoint (uses Ollama locally, no API key needed)
  if (request.nextUrl.pathname.startsWith('/api/v1/ai')) {
    return NextResponse.next();
  }

  // Skip validation for internal AI endpoint (developer chat uses this directly)
  if (request.nextUrl.pathname.startsWith('/api/internal/ai')) {
    return NextResponse.next();
  }

  // Skip validation for test endpoint
  if (request.nextUrl.pathname.startsWith('/api/test-hf')) {
    return NextResponse.next();
  }

  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 });
  }

  const rawKey = authHeader.split(' ')[1];

  try {
    const hashedIncomingKey = await hashKey(rawKey);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/api_keys?secret_hash=eq.${hashedIncomingKey}&is_active=eq.true&select=id,user_id,tier`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const matchedKeys = await res.json();

    if (!matchedKeys || matchedKeys.length === 0) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', matchedKeys[0].user_id);
    requestHeaders.set('x-key-tier', matchedKeys[0].tier);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const config = {
  matcher: '/api/:path*',
};

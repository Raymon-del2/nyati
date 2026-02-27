import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const keyTier = request.headers.get('x-key-tier');

  return NextResponse.json({
    message: 'Nyati API is running!',
    user_id: userId,
    tier: keyTier,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      user_id: userId,
      received: body,
      message: 'Data processed by Nyati'
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

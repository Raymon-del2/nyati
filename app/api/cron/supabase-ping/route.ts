import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Keep-Alive endpoint for Supabase
 * Prevents the 7-day pause by performing a tiny read operation every 24 hours
 * Should be called by Cron-job.org with the CRON_SECRET header
 */

export async function GET(request: NextRequest) {
  // Security check: Only allow cron-job with valid secret
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured on server' },
      { status: 500 }
    );
  }

  if (cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Keep Supabase awake with a tiny "ghost activity"
    // Also serves as a health check
    const { data, error, count } = await supabase
      .from('keys')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('Supabase ping failed:', error);
      return NextResponse.json(
        { error: 'Database ping failed', details: error.message },
        { status: 500 }
      );
    }

    // Return useful info for monitoring
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_keys: count || 0,
      message: 'Supabase kept alive ✓'
    });

  } catch (err) {
    console.error('Keep-alive error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST in case cron-job prefers it
export async function POST(request: NextRequest) {
  return GET(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashKeyWithSalt, constantTimeCompare } from '@/lib/keygen';

export const runtime = 'edge';

// Validate API key and get user info
async function validateKey(apiKey: string): Promise<{ valid: boolean; keyId?: string; userId?: string }> {
  try {
    console.log('[SEARCH VALIDATE] Starting validation for key:', apiKey.substring(0, 10) + '...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('[SEARCH VALIDATE] Missing Supabase config');
      return { valid: false };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const prefix = apiKey.substring(0, 4);
    const lastFour = apiKey.substring(apiKey.length - 4);
    const keyHint = `${prefix}...${lastFour}`;
    console.log('[SEARCH VALIDATE] Key hint:', keyHint);
    
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('id, user_id, salt, secret_hash, is_active')
      .eq('key_hint', keyHint)
      .eq('is_active', true)
      .maybeSingle();
    
    console.log('[SEARCH VALIDATE] Key data found:', !!keyData);
    console.log('[SEARCH VALIDATE] Supabase error:', error);
    
    if (!keyData) {
      console.log('[SEARCH VALIDATE] No key data found for hint:', keyHint);
      return { valid: false };
    }
    
    const computedHash = await hashKeyWithSalt(apiKey, keyData.salt);
    const isValid = await constantTimeCompare(computedHash, keyData.secret_hash);
    console.log('[SEARCH VALIDATE] Hash comparison result:', isValid);
    
    return { valid: isValid, keyId: isValid ? keyData.id : undefined, userId: isValid ? keyData.user_id : undefined };
  } catch (e) {
    console.log('[SEARCH VALIDATE] Exception:', e);
    return { valid: false };
  }
}

// Check daily rate limit
async function checkDailyRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetTime: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create daily limit record
    const { data: record, error } = await supabase
      .from('daily_rate_limits')
      .select('requests_used')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    
    if (error) {
      console.log('[SEARCH RATE LIMIT] Error checking rate limit:', error);
      return { allowed: true, remaining: 100, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
    }
    
    const requestsUsed = record?.requests_used || 0;
    const dailyLimit = 100;
    const remaining = Math.max(0, dailyLimit - requestsUsed);
    
    if (requestsUsed >= dailyLimit) {
      return { allowed: false, remaining: 0, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
    }
    
    // Increment usage
    if (record) {
      await supabase
        .from('daily_rate_limits')
        .update({ requests_used: requestsUsed + 1 })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabase
        .from('daily_rate_limits')
        .insert({ user_id: userId, date: today, requests_used: 1 });
    }
    
    return { allowed: true, remaining: remaining - 1, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
  } catch (e) {
    console.log('[SEARCH RATE LIMIT] Exception:', e);
    return { allowed: true, remaining: 100, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
  }
}

// Simulate search results for test keys
async function simulateSearch(query: string): Promise<any[]> {
  // Mock search results - in production, this would query your actual search index
  const mockResults = [
    {
      id: 'result_1',
      title: `Search result for: ${query}`,
      content: `This is a mock search result content related to ${query}. In production, this would be actual indexed content.`,
      url: `https://example.com/search?q=${encodeURIComponent(query)}`,
      score: 0.95
    },
    {
      id: 'result_2',
      title: `Another result about ${query}`,
      content: `Additional search result content for ${query}. This demonstrates the structured JSON format.`,
      url: `https://example.com/another-result`,
      score: 0.87
    },
    {
      id: 'result_3',
      title: `Related topic: ${query}`,
      content: `Third search result showing how multiple results are returned in the JSON array.`,
      url: `https://example.com/related-topic`,
      score: 0.73
    }
  ];
  
  return mockResults;
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    
    // Validate API key and get user info
    const validation = await validateKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check daily rate limit
    const rateLimitCheck = await checkDailyRateLimit(validation.userId!);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily rate limit exceeded',
          usage: {
            requests_remaining: 0,
            reset_time: rateLimitCheck.resetTime
          }
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { query, type = 'json' } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // For test keys, return mock search results
    if (apiKey.startsWith('tk_')) {
      const results = await simulateSearch(query);
      
      return NextResponse.json({
        results: results,
        total: results.length,
        usage: {
          requests_remaining: rateLimitCheck.remaining - 1,
          reset_time: rateLimitCheck.resetTime
        }
      });
    }

    // For other key types (when they're implemented)
    return NextResponse.json(
      { error: 'Key type not yet supported' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

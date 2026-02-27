import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ry_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    if (!apiKey.startsWith('ry_')) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 401 });
    }

    const prefix = apiKey.substring(0, 4);
    const lastFour = apiKey.substring(apiKey.length - 4);
    const keyHint = `${prefix}...${lastFour}`;

    // Check Supabase for real key validation
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('id, user_id, is_active, key_hint')
      .eq('key_hint', keyHint)
      .eq('is_active', true)
      .maybeSingle();

    // If key found in DB and is active - use real validation
    if (keyData) {
      const { data: usageData } = await supabase
        .from('api_usage')
        .select('request_count')
        .eq('api_key_id', keyData.id)
        .single();

      const requestCount = usageData?.request_count || 0;

      await supabase
        .from('api_usage')
        .upsert({
          api_key_id: keyData.id,
          request_count: requestCount + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'api_key_id' });

      return NextResponse.json({
        success: true,
        message: 'Nyati API is running',
        key_hint: keyHint,
        requests: requestCount + 1,
        timestamp: new Date().toISOString()
      });
    }

    // If no keys in DB, allow demo mode (for development)
    const { data: allKeys } = await supabase.from('api_keys').select('key_hint');
    if (!allKeys || allKeys.length === 0) {
      // Demo mode - no keys in DB yet
      return NextResponse.json({
        success: true,
        message: 'Nyati API is running (Demo Mode)',
        key_hint: keyHint,
        requests: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
        mode: 'demo'
      });
    }

    // Key not found in DB - reject
    return NextResponse.json(
      { error: 'Invalid or revoked API key', hint: keyHint },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ry_')) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    if (!apiKey.startsWith('ry_')) {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 401 });
    }

    const prefix = apiKey.substring(0, 4);
    const lastFour = apiKey.substring(apiKey.length - 4);
    const keyHint = `${prefix}...${lastFour}`;

    const supabase = getSupabase();

    // Try to find in DB, if not found still allow for demo
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('id, user_id, is_active, key_hint')
      .eq('key_hint', keyHint)
      .maybeSingle();

    // For demo: create a mock response even if key not in DB
    const requestCount = keyData ? (await supabase.from('api_usage').select('request_count').eq('api_key_id', keyData.id).single()).data?.request_count || 0 : 0;

    return NextResponse.json({
      key_hint: keyHint,
      requests: requestCount,
      status: 'active'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

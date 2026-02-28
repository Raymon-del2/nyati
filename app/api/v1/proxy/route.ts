import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashKeyWithSalt, constantTimeCompare } from '@/lib/keygen';

// High-performance validation with timing attack protection
async function validateApiKey(apiKey: string): Promise<{ valid: boolean; keyId?: string; latency: number }> {
  const startTime = performance.now();
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract key hint for lookup
    const prefix = apiKey.substring(0, 4);
    const lastFour = apiKey.substring(apiKey.length - 4);
    const keyHint = `${prefix}...${lastFour}`;
    
    // Retrieve key data with salt
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('id, salt, secret_hash, is_active')
      .eq('key_hint', keyHint)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!keyData) {
      const endTime = performance.now();
      return { valid: false, latency: endTime - startTime };
    }
    
    // Hash the provided key with stored salt
    const computedHash = await hashKeyWithSalt(apiKey, keyData.salt);
    
    // Constant-time comparison to prevent timing attacks
    const isValid = await constantTimeCompare(computedHash, keyData.secret_hash);
    
    const endTime = performance.now();
    
    return {
      valid: isValid,
      keyId: isValid ? keyData.id : undefined,
      latency: endTime - startTime
    };
  } catch (error) {
    const endTime = performance.now();
    return { valid: false, latency: endTime - startTime };
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ry_')) {
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.replace('Bearer ', '');
  
  // High-performance validation
  const validation = await validateApiKey(apiKey);
  
  // Log latency for optimization
  if (validation.latency > 10) {
    console.warn(`[NYATI] Slow validation: ${validation.latency.toFixed(2)}ms`);
  }
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }
  
  // Success response with rate-limit headers
  const response = NextResponse.json({
    success: true,
    message: 'Nyati Security Proxy',
    timestamp: new Date().toISOString(),
    validation_latency_ms: validation.latency.toFixed(2)
  });
  
  // Add rate-limit headers
  response.headers.set('X-Nyati-Limit-Remaining', '999');
  response.headers.set('X-Nyati-Limit-Reset', new Date(Date.now() + 3600000).toISOString());
  
  return response;
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Nyati Security Proxy v1.0.0',
    endpoint: '/v1/proxy',
    methods: ['POST'],
    security: 'Salted SHA-256 with constant-time comparison'
  });
}

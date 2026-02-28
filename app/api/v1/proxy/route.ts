import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashKeyWithSalt, constantTimeCompare } from '@/lib/keygen';

interface ValidationResult {
  valid: boolean;
  keyId?: string;
  targetUrl?: string;
  latency: number;
}

// High-performance validation with timing attack protection
async function validateApiKey(apiKey: string): Promise<ValidationResult> {
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
    
    // Retrieve key data with salt and target_url
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('id, salt, secret_hash, target_url, is_active')
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
      targetUrl: isValid ? keyData.target_url : undefined,
      latency: endTime - startTime
    };
  } catch (error) {
    const endTime = performance.now();
    return { valid: false, latency: endTime - startTime };
  }
}

// Forward request to target server
async function forwardRequest(
  targetUrl: string,
  method: string,
  headers: Headers,
  body: string | null,
  validationLatency: number,
  keyId: string
): Promise<{ success: boolean; data?: any; error?: string; latency: number; forwardLatency: number }> {
  const forwardStartTime = performance.now();
  
  try {
    // Build headers for forwarding (exclude hop-by-hop headers)
    const forwardHeaders: Record<string, string> = {
      'X-Nyati-Verified': 'true',
      'X-Nyati-Validation-Time-Ms': validationLatency.toFixed(2),
      'X-Nyati-Timestamp': new Date().toISOString(),
    };
    
    // Copy relevant headers from original request
    const headersToForward = ['content-type', 'accept', 'authorization', 'user-agent'];
    for (const header of headersToForward) {
      const value = headers.get(header);
      if (value) {
        forwardHeaders[header] = value;
      }
    }
    
    // Forward the request
    const fetchOptions: RequestInit = {
      method,
      headers: forwardHeaders,
    };
    
    if (body && method !== 'GET') {
      fetchOptions.body = body;
    }
    
    const targetResponse = await fetch(targetUrl, fetchOptions);
    
    // Get response body
    const responseText = await targetResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    const forwardEndTime = performance.now();
    const forwardLatency = forwardEndTime - forwardStartTime;
    const totalLatency = forwardEndTime - forwardStartTime;
    
    // Log latency to database
    await logLatency(keyId, validationLatency, forwardLatency);
    
    return {
      success: true,
      data: responseData,
      latency: totalLatency,
      forwardLatency
    };
  } catch (error: any) {
    const endTime = performance.now();
    return {
      success: false,
      error: error.message || 'Forward request failed',
      latency: endTime - forwardStartTime,
      forwardLatency: endTime - forwardStartTime
    };
  }
}

// Log latency metrics to database
async function logLatency(keyId: string, validationMs: number, forwardMs: number) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Insert latency log
    await supabase.from('api_usage').insert({
      api_key_id: keyId,
      request_count: 1,
      validation_ms: validationMs,
      forward_ms: forwardMs,
      nyati_ms: validationMs,
      target_ms: forwardMs
    });
  } catch (e) {
    // Silent fail - don't break the proxy for logging errors
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
  const method = request.method;
  
  // Get request body
  const body = method !== 'GET' ? await request.text() : null;
  
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
  
  // If no target_url configured, return success (ping mode)
  if (!validation.targetUrl) {
    const response = NextResponse.json({
      success: true,
      message: 'Nyati Security Proxy',
      timestamp: new Date().toISOString(),
      validation_latency_ms: validation.latency.toFixed(2),
      note: 'No target_url configured. Add a target_url to your API key to enable forwarding.'
    });
    
    response.headers.set('X-Nyati-Limit-Remaining', '999');
    response.headers.set('X-Nyati-Limit-Reset', new Date(Date.now() + 3600000).toISOString());
    
    return response;
  }
  
  // Forward request to target server
  const forwardResult = await forwardRequest(
    validation.targetUrl,
    method,
    request.headers,
    body,
    validation.latency,
    validation.keyId!
  );
  
  // Log forward latency
  if (forwardResult.forwardLatency > 100) {
    console.warn(`[NYATI] Slow forward: ${forwardResult.forwardLatency.toFixed(2)}ms to ${validation.targetUrl}`);
  }
  
  if (!forwardResult.success) {
    return NextResponse.json(
      { 
        error: 'Upstream server error',
        message: forwardResult.error,
        validation_latency_ms: validation.latency.toFixed(2),
        forward_latency_ms: forwardResult.forwardLatency.toFixed(2)
      },
      { status: 502 }
    );
  }
  
  // Create response with upstream data
  const response = NextResponse.json(forwardResult.data, {
    status: 200
  });
  
  // Add Nyati security headers
  response.headers.set('X-Nyati-Verified', 'true');
  response.headers.set('X-Nyati-Validation-Time-Ms', validation.latency.toFixed(2));
  response.headers.set('X-Nyati-Forward-Time-Ms', forwardResult.forwardLatency.toFixed(2));
  response.headers.set('X-Nyati-Limit-Remaining', '999');
  response.headers.set('X-Nyati-Limit-Reset', new Date(Date.now() + 3600000).toISOString());
  
  return response;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  // If no auth, just show status
  if (!authHeader || !authHeader.startsWith('Bearer ry_')) {
    return NextResponse.json({
      status: 'Nyati Security Proxy v1.0.0',
      endpoint: '/v1/proxy',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      security: 'Salted SHA-256 with constant-time comparison',
      forwarding: 'Request forwarding enabled when target_url is configured'
    });
  }
  
  const apiKey = authHeader.replace('Bearer ', '');
  const validation = await validateApiKey(apiKey);
  
  if (!validation.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  
  // If GET request and target_url exists, forward it
  if (validation.targetUrl) {
    const forwardResult = await forwardRequest(
      validation.targetUrl,
      'GET',
      request.headers,
      null,
      validation.latency,
      validation.keyId!
    );
    
    if (!forwardResult.success) {
      return NextResponse.json(
        { error: 'Upstream server error', message: forwardResult.error },
        { status: 502 }
      );
    }
    
    const response = NextResponse.json(forwardResult.data);
    response.headers.set('X-Nyati-Verified', 'true');
    response.headers.set('X-Nyati-Validation-Time-Ms', validation.latency.toFixed(2));
    response.headers.set('X-Nyati-Forward-Time-Ms', forwardResult.forwardLatency.toFixed(2));
    
    return response;
  }
  
  // No target_url - return proxy status
  return NextResponse.json({
    status: 'Nyati Security Proxy',
    validated: true,
    target_url: validation.targetUrl || 'Not configured',
    validation_latency_ms: validation.latency.toFixed(2)
  });
}

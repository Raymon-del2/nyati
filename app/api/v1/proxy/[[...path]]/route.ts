import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashKeyWithSalt, constantTimeCompare } from '@/lib/keygen';

export const runtime = 'edge';

// In-memory cache for validated keys (Edge function instance reuse)
const keyCache = new Map<string, { keyId: string; targetUrl: string; salt: string; secretHash: string; expires: number }>();
const CACHE_TTL = 30000; // 30 seconds

interface ValidationResult {
  valid: boolean;
  keyId?: string;
  targetUrl?: string;
  latency: number;
}

// High-performance validation with caching
async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  const startTime = performance.now();
  
  // Check cache first
  const cached = keyCache.get(apiKey);
  if (cached && cached.expires > Date.now()) {
    const endTime = performance.now();
    return {
      valid: true,
      keyId: cached.keyId,
      targetUrl: cached.targetUrl,
      latency: endTime - startTime
    };
  }
  
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
    
    // Cache the validated key
    if (isValid) {
      keyCache.set(apiKey, {
        keyId: keyData.id,
        targetUrl: keyData.target_url,
        salt: keyData.salt,
        secretHash: keyData.secret_hash,
        expires: Date.now() + CACHE_TTL
      });
    }
    
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

// AI Provider endpoints mapping
const AI_PROVIDERS: Record<string, { baseUrl: string; authHeader: string }> = {
  'openai': { baseUrl: 'https://api.openai.com/v1', authHeader: 'Authorization' },
  'anthropic': { baseUrl: 'https://api.anthropic.com/v1', authHeader: 'x-api-key' },
  'groq': { baseUrl: 'https://api.groq.com/openai/v1', authHeader: 'Authorization' },
  'openrouter': { baseUrl: 'https://openrouter.ai/api/v1', authHeader: 'Authorization' },
};

// Groq API keys - use environment variables only
function getNextGroqKey(): string | undefined {
  const envKeys = process.env.GROQ_API_KEYS;
  if (envKeys) {
    const keys = envKeys.split(',').map(k => k.trim()).filter(k => k.startsWith('gsk_'));
    if (keys.length > 0) {
      return keys[Math.floor(Math.random() * keys.length)];
    }
  }
  const singleKey = process.env.GROQ_API_KEY;
  if (singleKey && singleKey.startsWith('gsk_')) return singleKey;
  return undefined;
}

// Get AI provider from URL path
function getAiProvider(path: string): string | null {
  for (const provider of Object.keys(AI_PROVIDERS)) {
    if (path.includes(`/proxy/${provider}`)) {
      return provider;
    }
  }
  return null;
}

// Truncate max_tokens to 500 for protection
function truncateTokens(body: string | null): { body: string | null; truncated: boolean } {
  if (!body) return { body: null, truncated: false };
  try {
    const parsed = JSON.parse(body);
    if (parsed.max_tokens && parsed.max_tokens > 500) {
      parsed.max_tokens = 500;
      return { body: JSON.stringify(parsed), truncated: true };
    }
    if (!parsed.max_tokens) {
      parsed.max_tokens = 500;
      return { body: JSON.stringify(parsed), truncated: true };
    }
    return { body, truncated: false };
  } catch {
    return { body, truncated: false };
  }
}

// Check rate limit using Supabase
async function checkRateLimit(keyId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return { allowed: true, remaining: 999 };
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current minute timestamp
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    
    // Check current count for this key + minute
    const { data: limitData } = await supabase
      .from('rate_limits')
      .select('count')
      .eq('api_key_id', keyId)
      .eq('minute_key', minuteKey)
      .maybeSingle();
    
    const currentCount = limitData?.count || 0;
    const maxRequests = 5; // 5 requests per minute
    
    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment or insert
    if (limitData) {
      await supabase.from('rate_limits')
        .update({ count: currentCount + 1 })
        .eq('api_key_id', keyId)
        .eq('minute_key', minuteKey);
    } else {
      await supabase.from('rate_limits').insert({
        api_key_id: keyId,
        minute_key: minuteKey,
        count: 1
      });
    }
    
    return { allowed: true, remaining: maxRequests - currentCount - 1 };
  } catch {
    // Fail open - allow request if rate limit check fails
    return { allowed: true, remaining: 999 };
  }
}

// Forward request to target server - optimized streaming with AI support
async function forwardRequest(
  targetUrl: string,
  method: string,
  headers: Headers,
  body: string | null,
  validationLatency: number,
  keyId: string,
  aiProvider?: string,
  aiApiKey?: string
): Promise<{ success: boolean; response?: Response; error?: string; latency: number; forwardLatency: number }> {
  const forwardStartTime = performance.now();
  
  try {
    // Build headers for forwarding
    const forwardHeaders: Record<string, string> = {
      'X-Nyati-Verified': 'true',
      'X-Nyati-Validation-Time-Ms': validationLatency.toFixed(2),
      'X-Nyati-Timestamp': new Date().toISOString(),
    };
    
    // Copy relevant headers from original request (exclude authorization - we'll handle it)
    const headersToForward = ['content-type', 'accept', 'user-agent'];
    for (const header of headersToForward) {
      const value = headers.get(header);
      if (value) {
        forwardHeaders[header] = value;
      }
    }
    
    // Handle AI Provider authentication
    if (aiProvider && aiApiKey) {
      const provider = AI_PROVIDERS[aiProvider];
      if (provider) {
        forwardHeaders[provider.authHeader] = provider.authHeader === 'Authorization' 
          ? `Bearer ${aiApiKey}` 
          : aiApiKey;
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
    
    const forwardEndTime = performance.now();
    const forwardLatency = forwardEndTime - forwardStartTime;
    
    // Log latency to database (async, don't wait)
    logLatency(keyId, validationLatency, forwardLatency).catch(() => {});
    
    return {
      success: true,
      response: targetResponse,
      latency: forwardEndTime - forwardStartTime,
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
  
  // Check if this is an AI provider request
  const url = new URL(request.url);
  const pathname = url.pathname;
  const aiProvider = getAiProvider(pathname);
  let targetUrl = validation.targetUrl;
  let aiApiKey: string | undefined;
  
  // If AI provider endpoint, construct target URL from provider config
  if (aiProvider) {
    const provider = AI_PROVIDERS[aiProvider];
    if (provider) {
      // Extract the path after /proxy/{provider}/
      // For catch-all route: /api/v1/proxy/groq/chat/completions
      const providerIndex = pathname.indexOf(`/proxy/${aiProvider}`);
      const afterProvider = pathname.substring(providerIndex + `/proxy/${aiProvider}`.length);
      const apiPath = afterProvider || '';
      targetUrl = `${provider.baseUrl}${apiPath}${url.search}`;
    }
  }
  
  // If no target_url and not an AI provider, return ping mode
  if (!targetUrl) {
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
  
  // Check rate limit before forwarding (Nyati Shield)
  const rateLimit = await checkRateLimit(validation.keyId!);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: 'Nyati Shield: Maximum 5 requests per minute exceeded. Please slow down.',
        retry_after: 60
      },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-Nyati-Rate-Limit': '5/min'
        }
      }
    );
  }
  
  // Truncate tokens for AI requests (Nyati Shield protection)
  let truncatedBody = body;
  let wasTruncated = false;
  if (aiProvider === 'groq') {
    const truncation = truncateTokens(body);
    truncatedBody = truncation.body;
    wasTruncated = truncation.truncated;
  }
  
  // If Groq, use random key selection
  if (aiProvider === 'groq') {
    aiApiKey = getNextGroqKey();
  }
  
  // Forward request to target server
  const forwardResult = await forwardRequest(
    targetUrl,
    method,
    request.headers,
    truncatedBody,
    validation.latency,
    validation.keyId!,
    aiProvider || undefined,
    aiApiKey
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
  
  // Create response - stream directly without JSON parsing
  const responseHeaders: Record<string, string> = {
    'Content-Type': forwardResult.response?.headers.get('Content-Type') || 'application/json',
    'X-Nyati-Verified': 'true',
    'X-Nyati-Validation-Time-Ms': validation.latency.toFixed(2),
    'X-Nyati-Forward-Time-Ms': forwardResult.forwardLatency.toFixed(2),
    'X-Nyati-Limit-Remaining': String(rateLimit.remaining),
    'X-Nyati-Provider': aiProvider || 'custom',
  };
  
  // Add token truncation header if applicable
  if (wasTruncated) {
    responseHeaders['X-Nyati-Max-Tokens'] = '500';
    responseHeaders['X-Nyati-Shield'] = 'tokens-truncated';
  }
  
  const response = new Response(forwardResult.response?.body, {
    status: 200,
    headers: responseHeaders
  });
  
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
    
    const response = new Response(forwardResult.response?.body, {
      status: 200,
      headers: {
        'Content-Type': forwardResult.response?.headers.get('Content-Type') || 'application/json',
        'X-Nyati-Verified': 'true',
        'X-Nyati-Validation-Time-Ms': validation.latency.toFixed(2),
        'X-Nyati-Forward-Time-Ms': forwardResult.forwardLatency.toFixed(2),
      }
    });
    
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

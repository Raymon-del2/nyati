import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashKeyWithSalt, constantTimeCompare } from '@/lib/keygen';

// Allow up to 60 seconds for HF Space cold start
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Get AI service URL
function getAIServiceUrl(): string {
  return process.env.OLLAMA_URL || 'http://localhost:11434';
}

// Sensitive words to redact in stream
const SENSITIVE_WORDS = ['password', 'secret', 'token', 'key', 'api_key', 'private'];

// Transform stream to redact sensitive data
function createTransformStream(): TransformStream<Uint8Array, Uint8Array> {
  let buffer = '';
  
  return new TransformStream({
    transform(chunk: Uint8Array, controller) {
      const text = new TextDecoder().decode(chunk);
      buffer += text;
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(new TextEncoder().encode(line + '\n'));
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices) {
              for (const choice of parsed.choices) {
                if (choice.delta?.content) {
                  let content = choice.delta.content;
                  for (const word of SENSITIVE_WORDS) {
                    const regex = new RegExp(word, 'gi');
                    content = content.replace(regex, '[REDACTED]');
                  }
                  choice.delta.content = content;
                }
              }
            }
            const modified = 'data: ' + JSON.stringify(parsed) + '\n';
            controller.enqueue(new TextEncoder().encode(modified));
          } catch {
            controller.enqueue(new TextEncoder().encode(line + '\n'));
          }
        } else {
          controller.enqueue(new TextEncoder().encode(line + '\n'));
        }
      }
    },
    flush(controller) {
      if (buffer) {
        controller.enqueue(new TextEncoder().encode(buffer));
      }
    }
  });
}

// Validate API key and get user info
async function validateKey(apiKey: string): Promise<{ valid: boolean; keyId?: string; userId?: string }> {
  try {
    console.log('[VALIDATE] Starting validation for key:', apiKey.substring(0, 10) + '...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    console.log('[VALIDATE] Supabase URL exists:', !!supabaseUrl);
    console.log('[VALIDATE] Supabase Key exists:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('[VALIDATE] Missing Supabase config');
      return { valid: false };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const prefix = apiKey.substring(0, 4);
    const lastFour = apiKey.substring(apiKey.length - 4);
    const keyHint = `${prefix}...${lastFour}`;
    console.log('[VALIDATE] Key hint:', keyHint);
    
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('id, user_id, salt, secret_hash, is_active')
      .eq('key_hint', keyHint)
      .eq('is_active', true)
      .maybeSingle();
    
    console.log('[VALIDATE] Key data found:', !!keyData);
    console.log('[VALIDATE] Supabase error:', error);
    
    if (!keyData) {
      console.log('[VALIDATE] No key data found for hint:', keyHint);
      return { valid: false };
    }
    
    const computedHash = await hashKeyWithSalt(apiKey, keyData.salt);
    const isValid = await constantTimeCompare(computedHash, keyData.secret_hash);
    console.log('[VALIDATE] Hash comparison result:', isValid);
    
    return { valid: isValid, keyId: isValid ? keyData.id : undefined, userId: isValid ? keyData.user_id : undefined };
  } catch (e) {
    console.log('[VALIDATE] Exception:', e);
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
      console.log('[RATE LIMIT] Error checking rate limit:', error);
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
    console.log('[RATE LIMIT] Exception:', e);
    return { allowed: true, remaining: 100, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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

    const body = await request.json();
    const { message, model = 'llama3.2:1b' } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // For test keys, enforce short conversation limits
    if (apiKey.startsWith('tk_')) {
      // Limit message length for test keys
      if (message.length > 500) {
        return NextResponse.json(
          { error: 'Test keys limited to short messages (max 500 characters)' },
          { status: 400 }
        );
      }
    }
    
    const aiUrl = getAIServiceUrl();
    
    console.log('[NYATI AI] Using AI service at:', aiUrl);
    console.log('[NYATI AI] Model:', model);
    
    // Convert to AI service format
    const aiBody = {
      model: model,
      message: message,
      options: {
        temperature: 0.7,
        num_predict: 500
      }
    };
    
    // Forward to AI service
    const res = await fetch(`${aiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(aiBody)
    });
    
    console.log('[NYATI AI] AI service response status:', res.status);
    
    if (!res.ok) {
      const error = await res.text();
      console.log('[NYATI AI] AI service error:', error);
      return NextResponse.json({ 
        error: 'AI service error', 
        details: error.substring(0, 500),
        ai_url: aiUrl
      }, { status: res.status });
    }
    
    // Read response as text
    const responseText = await res.text();
    console.log('[NYATI AI] Raw response:', responseText.substring(0, 200));
    
    // Parse response
    const lines = responseText.trim().split('\n').filter(line => line.trim());
    let fullContent = '';
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          fullContent += parsed.message.content;
        }
      } catch (e) {
        console.log('[NYATI AI] Failed to parse line:', line.substring(0, 50));
      }
    }
    
    // Convert to response format
    const openaiResponse = {
      content: fullContent,
      type: 'text',
      model: model,
      usage: {
        requests_remaining: rateLimitCheck.remaining,
        reset_time: rateLimitCheck.resetTime
      }
    };
    
    return NextResponse.json(openaiResponse, {
      headers: {
        'X-Nyati-Provider': 'nyati-core01',
        'X-Nyati-Shield': 'active'
      }
    });
  } catch (error: any) {
    console.log('[NYATI AI] Error:', error.message);
    return NextResponse.json({ 
      error: 'Request failed', 
      message: error.message 
    }, { status: 500 });
  }
}

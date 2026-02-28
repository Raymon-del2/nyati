import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashKeyWithSalt, constantTimeCompare } from '@/lib/keygen';

export const runtime = 'edge';

// Get Groq API keys from environment (Edge compatible)
function getGroqKeys(): string[] {
  const envKeys = process.env.GROQ_API_KEYS;
  if (envKeys) {
    const keys = envKeys.split(',').map(k => k.trim()).filter(k => k.startsWith('gsk_'));
    if (keys.length > 0) return keys;
  }
  const singleKey = process.env.GROQ_API_KEY;
  if (singleKey && singleKey.startsWith('gsk_')) return [singleKey];
  return [];
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

// Validate API key
async function validateKey(apiKey: string): Promise<{ valid: boolean; keyId?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return { valid: false };
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const prefix = apiKey.substring(0, 4);
    const lastFour = apiKey.substring(apiKey.length - 4);
    const keyHint = `${prefix}...${lastFour}`;
    
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('id, salt, secret_hash, is_active')
      .eq('key_hint', keyHint)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!keyData) return { valid: false };
    
    const computedHash = await hashKeyWithSalt(apiKey, keyData.salt);
    const isValid = await constantTimeCompare(computedHash, keyData.secret_hash);
    
    return { valid: isValid, keyId: isValid ? keyData.id : undefined };
  } catch {
    return { valid: false };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }
  
  const apiKey = authHeader.replace('Bearer ', '');
  
  // Demo mode: allow ry_live_demo_key for testing
  if (apiKey !== 'ry_live_demo_key') {
    const validation = await validateKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
    }
  }
  
  try {
    const body = await request.json();
    const isStreaming = body.stream === true;
    
    // Truncate max_tokens to 500
    if (body.max_tokens && body.max_tokens > 500) {
      body.max_tokens = 500;
    }
    if (!body.max_tokens) {
      body.max_tokens = 500;
    }
    
    const groqKeys = getGroqKeys();
    if (groqKeys.length === 0) {
      return NextResponse.json({ error: 'No Groq API keys configured' }, { status: 500 });
    }
    const groqKey = groqKeys[Math.floor(Math.random() * groqKeys.length)];
    
    // Forward to Groq with streaming
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
        'User-Agent': 'Nyati-Proxy/1.0',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: body.model || 'llama3-8b-8192',
        messages: body.messages,
        max_tokens: body.max_tokens,
        temperature: body.temperature || 0.7,
        stream: isStreaming
      })
    });
    
    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ 
        error: 'Groq API error', 
        details: error.substring(0, 200)
      }, { status: res.status });
    }
    
    // Stream response
    if (isStreaming && res.body) {
      const transformStream = createTransformStream();
      
      return new NextResponse(
        res.body.pipeThrough(transformStream),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Nyati-Provider': 'groq',
            'X-Nyati-Shield': 'active',
            'X-Nyati-Start-Time': startTime.toString()
          }
        }
      );
    }
    
    // Non-streaming
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'X-Nyati-Provider': 'groq',
        'X-Nyati-Shield': 'active'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Request failed', 
      message: error.message 
    }, { status: 500 });
  }
}

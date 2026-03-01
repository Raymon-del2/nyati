import { NextRequest, NextResponse } from 'next/server';

// Allow up to 60 seconds for HF Space cold start
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Get Nyati AI endpoint URL
function getAIServiceUrl(): string {
  return process.env.OLLAMA_URL || 'https://nyaticore.vercel.app/api/v1/ai';
}

// Nyati Knowledge Base - System Context
const NYATI_KNOWLEDGE = `You are Nyati AI, an expert assistant for the Nyati platform. You have complete knowledge of the platform.

## Nyati Overview:
Nyati is an AI-powered data platform with steel-protected API keys, AI chat (Nyati-core01 model built from scratch as a small, efficient model), JSON search API, and developer tools.

## Key Features:
- API Keys: tk_ (Test Key - active), sk_, pk_, rk_, mk_, Cor_ (coming soon)
- Rate Limit: 100 requests/day per account (shared across all keys)
- AI Chat: /api/v1/ai endpoint with Nyati-core01 model
- JSON Search: /api/v1/search endpoint for building search engines
- Developer Chat: Internal endpoint for testing (no API key needed)

## Platform Navigation:
- Overview: Dashboard with stats
- API Keys: Generate keys (only tk_ works now, others show "Soon")
- Usage: View API statistics  
- Developer: AI chat interface (internal, no credits used)
- Devdocs: Documentation
- Settings: Account management
- Billing: Subscription management

## Common Issues & Fixes:
1. HTTP 401: Invalid API key → Generate new tk_ key
2. HTTP 429: Rate limit exceeded → Wait for next day (100/day limit per account, not per key)
3. "Short messages only" → Keep under 500 characters for test keys
4. AI not responding → Check your internet connection

## Integration Example:
fetch('https://api.nyati.io/v1/ai', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer tk_your_key', 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', model: 'nyati-core01' })
})

## Coming Soon:
- sk_ (Secret Key) for production use
- pk_ (Public Key) for frontend
- rk_ (Restricted Key) for limited access
- mk_ (Management Key) for admin
- Cor_ (Core AI) for advanced capabilities
- Paid tiers with higher limits

Important: 
- Nyati-core01 is built from scratch as a small, efficient model
- No need to install anything - just use the API endpoint
- Rate limit is per account, not per key - making new keys won't reset your limit

Always be helpful, concise, and reference specific Nyati features when relevant.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = 'llama3.2:1b', temperature = 0.7, max_tokens = 500 } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const aiUrl = getAIServiceUrl();
    
    console.log('[INTERNAL AI] Using Nyati AI at:', aiUrl);
    console.log('[INTERNAL AI] Model:', model);
    
    // Prepend system message with Nyati knowledge
    const messagesWithContext = [
      {
        role: 'system',
        content: NYATI_KNOWLEDGE
      },
      ...messages
    ];
    
    // Forward to Nyati AI service
    const res = await fetch(`${aiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        message: messagesWithContext[messagesWithContext.length - 1].content,
        stream: false,
        options: {
          temperature: temperature,
          num_predict: max_tokens
        }
      })
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.log('[INTERNAL AI] Nyati AI error:', error);
      return NextResponse.json({ 
        error: 'Nyati AI service error', 
        details: error.substring(0, 500)
      }, { status: res.status });
    }
    
    // Read response (non-streaming, single JSON)
    const responseText = await res.text();
    
    let fullContent = '';
    try {
      const parsed = JSON.parse(responseText);
      fullContent = parsed.message?.content || parsed.response || '';
    } catch (e) {
      console.error('[INTERNAL AI] Failed to parse response:', e);
    }
    
    console.log('[INTERNAL AI] Extracted content:', fullContent.substring(0, 100));
    
    // Return in standard format
    return NextResponse.json({
      choices: [{
        message: {
          role: 'assistant',
          content: fullContent
        },
        index: 0
      }],
      model: model,
      provider: 'nyati-core01'
    });

  } catch (error: any) {
    console.log('[INTERNAL AI] Error:', error.message);
    return NextResponse.json({ 
      error: 'Request failed', 
      message: error.message 
    }, { status: 500 });
  }
}

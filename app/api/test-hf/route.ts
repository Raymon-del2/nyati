import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const aiUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    console.log('[TEST] Pinging HF Space at:', aiUrl);
    
    const res = await fetch(`${aiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        message: 'Say hello',
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 50
        }
      })
    });
    
    console.log('[TEST] Response status:', res.status);
    console.log('[TEST] Response headers:', Object.fromEntries(res.headers.entries()));
    
    const responseText = await res.text();
    console.log('[TEST] Raw response:', responseText);
    
    return NextResponse.json({
      status: res.status,
      rawResponse: responseText,
      parsed: (() => {
        try {
          return JSON.parse(responseText);
        } catch (e) {
          return { error: 'Failed to parse', message: (e as Error).message };
        }
      })()
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

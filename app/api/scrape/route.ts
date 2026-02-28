import { NextRequest, NextResponse } from 'next/server';

// Scrape endpoint - stores URLs in index (no API key required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, kind = 'web' } = body;

    if (!urls) {
      return NextResponse.json({ error: 'URLs are required' }, { status: 400 });
    }

    const urlList = urls.split('\n').map((u: string) => u.trim()).filter(Boolean);

    // In production, this would actually scrape the URLs
    // For demo, we return mock success
    const results = urlList.map((url: string) => ({
      url,
      title: `Scraped: ${new URL(url).hostname}`,
      snippet: 'Content scraped and stored in index',
      kind: kind || 'web'
    }));

    return NextResponse.json({
      success: true,
      message: `Successfully scraped and stored ${results.length} URLs`,
      results,
      note: 'Demo mode - in production this would scrape real content'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

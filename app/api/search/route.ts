import { NextRequest, NextResponse } from 'next/server';

// Mock data for demo - in production this would come from a database
const mockSearchResults: Record<string, any[]> = {
  web: [
    { url: 'https://nextjs.org', title: 'Next.js - The React Framework', snippet: 'Next.js gives you the best developer experience with all the features you need.', thumb: '', kind: 'web' },
    { url: 'https://react.dev', title: 'React', snippet: 'The library for web and native user interfaces.', thumb: '', kind: 'web' },
    { url: 'https://typescriptlang.org', title: 'TypeScript', snippet: 'JavaScript with syntax for types.', thumb: '', kind: 'web' },
  ],
  images: [
    { url: 'https://picsum.photos/400/300?random=1', title: 'Mountain Landscape', snippet: 'Beautiful mountain view at sunset', thumb: 'https://picsum.photos/100/100?random=1', kind: 'images' },
    { url: 'https://picsum.photos/400/300?random=2', title: 'Ocean Waves', snippet: 'Peaceful ocean waves on beach', thumb: 'https://picsum.photos/100/100?random=2', kind: 'images' },
    { url: 'https://picsum.photos/400/300?random=3', title: 'Forest Path', snippet: 'Green forest path in morning light', thumb: 'https://picsum.photos/100/100?random=3', kind: 'images' },
  ],
  videos: [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Learn React in 1 Hour', snippet: 'Complete React tutorial for beginners', thumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg', kind: 'videos' },
    { url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', title: 'JavaScript Crash Course', snippet: 'Learn JavaScript fundamentals fast', thumb: 'https://img.youtube.com/vi/W6NZfCO5SIk/default.jpg', kind: 'videos' },
  ],
  news: [
    { url: 'https://techcrunch.com', title: 'Tech Industry News', snippet: 'Latest updates from the tech world', thumb: '', kind: 'news' },
    { url: 'https://wired.com', title: 'Wired - Innovation News', snippet: 'Stories about tech, science, and business', thumb: '', kind: 'news' },
  ],
  shopping: [
    { url: 'https://amazon.com/product/1', title: 'Wireless Headphones', snippet: '$99.99 - High quality wireless headphones', thumb: 'https://picsum.photos/100/100?random=10', kind: 'shopping' },
    { url: 'https://amazon.com/product/2', title: 'Smart Watch', snippet: '$199.99 - Latest smart watch with health tracking', thumb: 'https://picsum.photos/100/100?random=11', kind: 'shopping' },
  ],
  tmdb: [
    { url: 'https://themoviedb.org/movie/550', title: 'Fight Club', snippet: '1999 - A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.', thumb: 'https://image.tmdb.org/t/p/w200/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg', kind: 'tmdb' },
    { url: 'https://themoviedb.org/movie/680', title: 'Pulp Fiction', snippet: '1994 - The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', thumb: 'https://image.tmdb.org/t/p/w200/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', kind: 'tmdb' },
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'web';

  try {
    // Fetch from compassb database
    const compassUrl = `https://compassb.vercel.app/search?q=${encodeURIComponent(query)}${type !== 'web' ? `&type=${type}` : ''}`;
    const response = await fetch(compassUrl, {
      headers: {
        'User-Agent': 'Nyati/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback to mock if compassb fails
    return NextResponse.json({
      error: 'Compassb unavailable',
      query,
      type,
      results: []
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch from compassb',
      query,
      type,
      results: []
    }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, query, kind } = body;

    // For now, return mock data - in production you'd call Serper/TMDB APIs
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key required for fresh content',
        message: 'Get a free Serper API key at https://serper.dev/'
      }, { status: 401 });
    }

    // Simulate fetching fresh content
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockFreshResults: Record<string, any[]> = {
      web: [
        { url: `https://example.com/${query}`, title: `Result for: ${query}`, snippet: `Fresh web results for "${query}"`, thumb: '', kind: 'web' },
        { url: `https://example.org/${query}`, title: `${query} - Wikipedia`, snippet: `Encyclopedia article about ${query}`, thumb: '', kind: 'web' },
      ],
      images: mockSearchResults.images,
      videos: mockSearchResults.videos,
      news: mockSearchResults.news,
      shopping: mockSearchResults.shopping,
      tmdb: mockSearchResults.tmdb,
    };

    return NextResponse.json({
      success: true,
      query,
      kind: kind || 'web',
      results: mockFreshResults[kind] || mockFreshResults.web,
      note: 'Demo mode - add Serper API key for real data'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

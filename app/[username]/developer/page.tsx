'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApiKey } from '@/lib/supabase';

export default function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [useNoAuth, setUseNoAuth] = useState(false);
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/search?q=python');
  const [searchType, setSearchType] = useState('web');
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setKeys(data);
      setSelectedKey(data[0].key_hint);
    }
    setLoading(false);
  }

  async function testRequest() {
    if (!selectedKey && useNoAuth) {
      // Test public search endpoint without API key
      setIsLoading(true);
      setResponse(null);
      setResponseTime(null);

      const startTime = performance.now();
      
      try {
        const baseUrl = window.location.origin;
        const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
        
        const res = await fetch(fullUrl, {
          method: method === 'POST' ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          body: method === 'POST' ? JSON.stringify({ query: 'test', kind: 'web' }) : undefined
        });

        const endTime = performance.now();
        setResponseTime(endTime - startTime);
        
        const data = await res.json();
        setResponse({
          status: res.status,
          statusText: res.statusText,
          data
        });
      } catch (error: any) {
        setResponse({
          error: true,
          message: error.message
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    if (!selectedKey) return;
    
    setIsLoading(true);
    setResponse(null);
    setResponseTime(null);

    const startTime = performance.now();
    
    try {
      const baseUrl = window.location.origin;
      const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
      
      const res = await fetch(fullUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${selectedKey}`,
          'Content-Type': 'application/json'
        }
      });

      const endTime = performance.now();
      setResponseTime(endTime - startTime);
      
      const data = await res.json();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data
      });
    } catch (error: any) {
      setResponse({
        error: true,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Developer Playground</h1>
        <p className="text-gray-500">Test your API keys in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Panel */}
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Request</h2>
          
          {/* API Key Selector */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">API Key</label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400"
            >
              <option value="">No API key (Public endpoints)</option>
              {keys.map(key => (
                <option key={key.id} value={key.key_hint}>
                  {key.key_hint} ({key.tier})
                </option>
              ))}
            </select>
          </div>

          {/* Search Type Selector */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Data Source</label>
            <div className="flex flex-wrap gap-2">
              {['web', 'images', 'videos', 'news', 'shopping', 'tmdb'].map(type => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    searchType === type 
                      ? 'bg-teal-400 text-black' 
                      : 'bg-[#111] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Example Selector */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Example</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEndpoint(`/api/search?q=youtube&type=${searchType}`)}
                className="px-3 py-1.5 bg-[#111] text-gray-400 text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                YouTube
              </button>
              <button
                onClick={() => setEndpoint(`/api/search?q=jenna+ortega&type=${searchType}`)}
                className="px-3 py-1.5 bg-[#111] text-gray-400 text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                Jenna Ortega
              </button>
              <button
                onClick={() => setEndpoint(`/api/search?q=netame&type=${searchType}`)}
                className="px-3 py-1.5 bg-[#111] text-gray-400 text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                Netame
              </button>
              <button
                onClick={() => setEndpoint(`/api/search?q=vercel&type=${searchType}`)}
                className="px-3 py-1.5 bg-[#111] text-gray-400 text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                Vercel
              </button>
              <button
                onClick={() => setEndpoint(`/api/search?q=netflix&type=${searchType}`)}
                className="px-3 py-1.5 bg-[#111] text-gray-400 text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                Netflix
              </button>
            </div>
          </div>

          {/* Method & Endpoint */}
          <div className="flex gap-2 mb-4">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400"
            >
              <option value="GET">GET</option>
            </select>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-teal-400"
              placeholder="/api/v1/proxy"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={testRequest}
            disabled={isLoading}
            className="w-full bg-teal-400 text-black py-3 rounded-xl font-semibold hover:bg-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Request'
            )}
          </button>

          <div className="mt-4 text-center">
            <a 
              href="https://compassb.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 text-xs hover:text-teal-400 transition-colors"
            >
              Powered by CompassB →
            </a>
          </div>

          {/* Info Card */}
        </div>

        {/* Response Panel */}
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Response</h2>
            {responseTime !== null && (
              <span className="text-teal-400 text-sm font-mono">
                {responseTime.toFixed(2)}ms
              </span>
            )}
          </div>

          {!response ? (
            <div className="h-64 flex items-center justify-center text-gray-600">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Waiting for response...
                </div>
              ) : (
                'Send a request to see the response'
              )}
            </div>
          ) : response.error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400">{response.message}</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  response.status === 200 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {response.status}
                </span>
                <span className="text-gray-500 text-sm">{response.statusText}</span>
              </div>
              <pre className="bg-[#111] rounded-xl p-4 overflow-x-auto text-sm font-mono text-gray-300 max-h-80">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-r from-teal-400/10 to-transparent border border-teal-400/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Ready to protect your own server?</h3>
        <p className="text-gray-400 mb-4">
          Add your target_url in Settings to start forwarding requests through Nyati's security proxy.
        </p>
        <a
          href="/settings"
          className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
        >
          Go to Settings →
        </a>
      </div>
    </div>
  );
}

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
  const [activeSection, setActiveSection] = useState<'search' | 'ai'>('search');

  // AI Chat state
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([
    {role: 'system', content: 'You are a helpful assistant. Be concise.'}
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLatency, setAiLatency] = useState<number | null>(null);
  const [aiProvider, setAiProvider] = useState<string>('groq');

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

  async function sendAiMessage() {
    if (!inputMessage.trim()) return;
    
    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAiLoading(true);
    
    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    
    try {
      const newMessages = [...messages, userMessage];
      
      const apiKeyToUse = selectedKey || 'ry_live_demo_key';
      const res = await fetch(`/api/v1/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyToUse}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: newMessages,
          max_tokens: 500,
          temperature: 0.7,
          stream: true
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 200)}`);
      }
      
      if (!res.body) {
        throw new Error('No response body');
      }
      
      // Handle streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      
      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                if (!firstTokenTime) {
                  firstTokenTime = performance.now() - startTime;
                }
                fullContent += content;
                
                // Update last message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.content = fullContent;
                  }
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
      
      const endTime = performance.now();
      setAiLatency(endTime - startTime);
      
      // Store TTFT for display
      if (firstTokenTime) {
        setAiLatency(firstTokenTime);
      }
      
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ ${error.message || 'AI provider temporarily unavailable'}` 
      }]);
    } finally {
      setAiLoading(false);
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

      {/* Section Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveSection('search')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'search' 
              ? 'bg-teal-400 text-black' 
              : 'bg-[#111] text-gray-400 hover:text-white'
          }`}
        >
          🔍 Search
        </button>
        <button
          onClick={() => setActiveSection('ai')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'ai' 
              ? 'bg-teal-400 text-black' 
              : 'bg-[#111] text-gray-400 hover:text-white'
          }`}
        >
          🤖 AI Chat
        </button>
      </div>

      {activeSection === 'search' ? (
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
                  onClick={() => {
                    setSearchType(type);
                    // Extract current query from endpoint and update type
                    const match = endpoint.match(/q=([^&]+)/);
                    const currentQuery = match ? match[1] : 'youtube';
                    setEndpoint(`/api/search?q=${currentQuery}&type=${type}`);
                  }}
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
              {/* Results Grid - Netflix Style for videos/images */}
              {response.data?.results && Array.isArray(response.data.results) ? (
                <div className="max-h-96 overflow-y-auto">
                  {/* Videos */}
                  {response.data.results.some((r: any) => r.kind === 'videos') && (
                    <div className="mb-4">
                      <h3 className="text-white text-sm font-medium mb-2">Videos</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {response.data.results.filter((r: any) => r.kind === 'videos').slice(0, 4).map((item: any, i: number) => (
                          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-[#111] rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] group">
                            <div className="relative aspect-video bg-[#1a1a1a]">
                              {item.thumb ? (
                                <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                              )}
                              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-teal-400">⚡ ~2ms</div>
                            </div>
                            <div className="p-2">
                              <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Images */}
                  {response.data.results.some((r: any) => r.kind === 'images') && (
                    <div className="mb-4">
                      <h3 className="text-white text-sm font-medium mb-2">Images</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {response.data.results.filter((r: any) => r.kind === 'images').slice(0, 6).map((item: any, i: number) => (
                          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-[#111] rounded-lg overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] group relative">
                            {item.thumb ? (
                              <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                            )}
                            <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-teal-400">⚡ ~2ms</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* JSON for other types */}
                  {!response.data.results.some((r: any) => r.kind === 'videos' || r.kind === 'images') && (
                    <pre className="bg-[#111] rounded-xl p-4 overflow-x-auto text-sm font-mono text-gray-300 max-h-80">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <pre className="bg-[#111] rounded-xl p-4 overflow-x-auto text-sm font-mono text-gray-300 max-h-80">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
      ) : (
        /* AI Chat Section */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Chat Panel */}
          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🤖 AI Chat (Nyati Shield)</h2>
            
            {/* Provider Selector */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">AI Provider</label>
              <div className="flex gap-2">
                {['groq', 'openai', 'anthropic'].map(provider => (
                  <button
                    key={provider}
                    onClick={() => setAiProvider(provider)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      aiProvider === provider 
                        ? 'bg-teal-400 text-black' 
                        : 'bg-[#111] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Shield Info */}
            <div className="mb-4 p-3 bg-[#111] rounded-xl border border-teal-400/20">
              <p className="text-teal-400 text-xs font-medium mb-1">🛡️ Nyati Shield Active</p>
              <ul className="text-gray-500 text-xs space-y-1">
                <li>• Token truncation: max 500 tokens</li>
                <li>• Rate limit: 5 req/min per key</li>
                <li>• Key rotation: Round-robin enabled</li>
              </ul>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto bg-[#111] rounded-xl p-4 mb-4 space-y-3">
              {messages.filter(m => m.role !== 'system').map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-teal-400 text-black' 
                      : 'bg-[#222] text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#222] px-4 py-2 rounded-xl text-sm text-gray-400">
                    <span className="animate-pulse">● ● ●</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
                className="flex-1 bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400"
                placeholder="Ask the AI..."
              />
              <button
                onClick={sendAiMessage}
                disabled={aiLoading || !inputMessage.trim() || !selectedKey}
                className="bg-teal-400 text-black px-4 py-3 rounded-xl font-medium hover:bg-teal-300 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>

            {/* TTFT Badge */}
            {aiLatency !== null && (
              <div className="mt-4 flex items-center gap-2">
                <div className="bg-[#111] px-3 py-2 rounded-lg border border-teal-400/30">
                  <span className="text-gray-500 text-xs">TTFT</span>
                  <span className="text-teal-400 text-sm font-mono ml-2">{aiLatency.toFixed(0)}ms</span>
                </div>
                <div className="bg-[#111] px-3 py-2 rounded-lg">
                  <span className="text-gray-500 text-xs">Provider</span>
                  <span className="text-teal-400 text-sm font-mono ml-2">Groq</span>
                </div>
                <div className="bg-[#111] px-3 py-2 rounded-lg">
                  <span className="text-gray-500 text-xs">Streaming</span>
                  <span className="text-green-400 text-sm ml-2">● Live</span>
                </div>
              </div>
            )}

            {!selectedKey && (
              <p className="mt-4 text-yellow-400 text-sm">⚠️ Please select an API key above to use AI chat</p>
            )}
          </div>

          {/* Code Example Panel */}
          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Code Example</h2>
            <div className="mb-4">
              <p className="text-gray-500 text-sm mb-2">Use this in your app:</p>
              <pre className="bg-[#111] rounded-xl p-4 overflow-x-auto text-xs font-mono text-gray-300">
{`import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'ry_live_your_key',
  baseURL: 'https://api.nyati.dev/v1/proxy/${aiProvider}'
});

const response = await openai.chat.completions.create({
  model: '${aiProvider === 'groq' ? 'llama3-8b-8192' : 'gpt-4'}',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);`}
              </pre>
            </div>
            <div className="p-3 bg-[#111] rounded-xl border border-teal-400/20">
              <p className="text-teal-400 text-xs font-medium mb-1">🛡️ Steel Protection</p>
              <p className="text-gray-500 text-xs">
                Nyati strips PII, truncates tokens, and rotates keys automatically.
              </p>
            </div>
          </div>
        </div>
      )}

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

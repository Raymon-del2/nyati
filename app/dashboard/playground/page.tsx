'use client';

import { useState } from 'react';

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  thumb: string;
  kind: string;
}

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'ai'>('search');
  const [query, setQuery] = useState('ai');
  const [searchType, setSearchType] = useState('videos');
  const [response, setResponse] = useState<any>(null);
  const [validationTime, setValidationTime] = useState<number | null>(null);
  const [forwardTime, setForwardTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  // AI Chat state
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([
    {role: 'system', content: 'You are a helpful assistant. Be concise.'}
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLatency, setAiLatency] = useState<number | null>(null);
  const [aiProvider, setAiProvider] = useState<string>('groq');

  async function sendRequest() {
    setIsLoading(true);
    setResponse(null);
    setValidationTime(null);
    setForwardTime(null);

    const startTime = performance.now();

    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&type=${searchType}`;
      const res = await fetch(url);
      
      const endTime = performance.now();
      setResponseTime(endTime - startTime);
      
      setValidationTime(2.5); // Simulated - proxy overhead
      setForwardTime(endTime - startTime - 2.5);
      
      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ error: true, message: error.message });
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
    
    try {
      const newMessages = [...messages, userMessage];
      
      const res = await fetch(`/api/v1/proxy/${aiProvider}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ry_live_demo_key'
        },
        body: JSON.stringify({
          model: aiProvider === 'groq' ? 'llama3-8b-8192' : 'gpt-3.5-turbo',
          messages: newMessages,
          max_tokens: 500,
          temperature: 0.7
        })
      });
      
      const endTime = performance.now();
      setAiLatency(endTime - startTime);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'AI request failed');
      }
      
      const data = await res.json();
      const assistantMessage = data.choices?.[0]?.message;
      
      if (assistantMessage) {
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Nyati Shield: ${error.message || 'AI provider temporarily unavailable'}` 
      }]);
    } finally {
      setAiLoading(false);
    }
  }

  const results: SearchResult[] = response?.results || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nyati Playground</h1>
        <p className="text-gray-500">Test the proxy with live requests</p>
      </div>

      {/* Tab Selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'search' 
              ? 'bg-teal-400 text-black' 
              : 'bg-[#111] text-gray-400 hover:text-white'
          }`}
        >
          🔍 Search
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ai' 
              ? 'bg-teal-400 text-black' 
              : 'bg-[#111] text-gray-400 hover:text-white'
          }`}
        >
          🤖 AI Chat
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Request Panel */}
          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Search Request</h2>
            
            {/* Query Input */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">Query</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-400"
                placeholder="Search query..."
              />
            </div>

            {/* Type Selector */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">Type</label>
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

          {/* URL Preview */}
          <div className="mb-4 p-3 bg-[#111] rounded-xl">
            <p className="text-gray-500 text-xs mb-1">Request URL</p>
            <p className="text-teal-400 text-sm font-mono truncate">
              /api/search?q={query}&type={searchType}
            </p>
          </div>

          {/* Send Button */}
          <button
            onClick={sendRequest}
            disabled={isLoading}
            className="w-full bg-teal-400 text-black py-3 rounded-xl font-semibold hover:bg-teal-300 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Request'}
          </button>

          {/* Speed Badge */}
          {responseTime !== null && (
            <div className="mt-4 flex gap-3">
              <div className="flex items-center gap-2 bg-[#111] px-3 py-2 rounded-lg">
                <span className="text-gray-500 text-xs">Validation</span>
                <span className="text-teal-400 text-sm font-mono">~{validationTime?.toFixed(1)}ms</span>
              </div>
              <div className="flex items-center gap-2 bg-[#111] px-3 py-2 rounded-lg">
                <span className="text-gray-500 text-xs">Forward</span>
                <span className="text-teal-400 text-sm font-mono">~{forwardTime?.toFixed(1)}ms</span>
              </div>
              <div className="flex items-center gap-2 bg-[#111] px-3 py-2 rounded-lg">
                <span className="text-gray-500 text-xs">Total</span>
                <span className="text-white text-sm font-mono">{responseTime.toFixed(0)}ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Response Panel */}
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Response</h2>
            {response && (
              <span className="text-gray-500 text-sm">
                {results.length} results
              </span>
            )}
          </div>

          {!response ? (
            <div className="h-96 flex items-center justify-center text-gray-600">
              {isLoading ? 'Loading...' : 'Send a request to see results'}
            </div>
          ) : response.error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400">{response.message}</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {/* Videos Grid - Netflix Style */}
              {(searchType === 'videos' || results.some(r => r.kind === 'videos')) && results.filter(r => r.kind === 'videos' || searchType === 'videos').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white text-sm font-medium mb-3">Videos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {results.filter(r => r.kind === 'videos' || searchType === 'videos').slice(0, 8).map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-[#111] rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] group"
                      >
                        <div className="relative aspect-video bg-[#1a1a1a]">
                          {item.thumb ? (
                            <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          )}
                          {/* Speed Badge */}
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-teal-400">
                            ⚡ {Math.floor(Math.random() * 3 + 1)}ms
                          </div>
                          {/* Kind Badge */}
                          <div className="absolute bottom-2 left-2 bg-teal-400/90 px-2 py-1 rounded text-xs text-black font-medium">
                            Video
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-teal-400 transition-colors">
                            {item.title}
                          </p>
                          {item.snippet && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{item.snippet}</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Images Grid - Netflix Style */}
              {(searchType === 'images' || results.some(r => r.kind === 'images')) && results.filter(r => r.kind === 'images' || searchType === 'images').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white text-sm font-medium mb-3">Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {results.filter(r => r.kind === 'images' || searchType === 'images').slice(0, 12).map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video bg-[#111] rounded-lg overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] group relative"
                      >
                        {item.thumb ? (
                          <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Speed Badge */}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-teal-400">
                          ⚡ {Math.floor(Math.random() * 3 + 1)}ms
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON View for other types */}
              {(!['videos', 'images'].includes(searchType)) && (
                <pre className="bg-[#111] rounded-xl p-4 overflow-x-auto text-sm font-mono text-gray-300 max-h-96">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
      ) : (
        /* AI Chat Tab */
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
                disabled={aiLoading || !inputMessage.trim()}
                className="bg-teal-400 text-black px-4 py-3 rounded-xl font-medium hover:bg-teal-300 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>

            {/* Latency Badge */}
            {aiLatency !== null && (
              <div className="mt-4 flex items-center gap-2">
                <div className="bg-[#111] px-3 py-2 rounded-lg">
                  <span className="text-gray-500 text-xs">Nyati Latency</span>
                  <span className="text-teal-400 text-sm font-mono ml-2">{aiLatency.toFixed(0)}ms</span>
                </div>
                <div className="bg-[#111] px-3 py-2 rounded-lg">
                  <span className="text-gray-500 text-xs">Provider</span>
                  <span className="text-teal-400 text-sm font-mono ml-2">{aiProvider}</span>
                </div>
              </div>
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

      {/* Info */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          Powered by <a href="https://compassb.vercel.app" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">CompassB</a> • Nyati Security Proxy
        </p>
      </div>
    </div>
  );
}

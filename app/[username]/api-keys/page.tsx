'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateApiKey, createKeyHint, hashKeyWithSalt, generateSalt } from '@/lib/keygen';
import type { ApiKey } from '@/lib/supabase';
import { ChevronDown } from 'lucide-react';

interface PrefixOption {
  value: string;
  label: string;
  name: string;
  description: string;
  vibe: string;
}

const PREFIX_OPTIONS: PrefixOption[] = [
  {
    value: 'sk_',
    label: 'sk_',
    name: 'Secret Key',
    description: 'Private backend access (like OpenAI\'s sk-). This should never be shared.',
    vibe: 'The Power'
  },
  {
    value: 'pk_',
    label: 'pk_',
    name: 'Public Key',
    description: 'Frontend/Client-side access. Safe to put in your JavaScript code.',
    vibe: 'The Door'
  },
  {
    value: 'rk_',
    label: 'rk_',
    name: 'Restricted Key',
    description: 'Keys with limited permissions (e.g., "Can only read, cannot teach").',
    vibe: 'The Guard'
  },
  {
    value: 'tk_',
    label: 'tk_',
    name: 'Test Key',
    description: 'Sandbox mode. Users can test your AI without using real credits.',
    vibe: 'The Playground'
  },
  {
    value: 'mk_',
    label: 'mk_',
    name: 'Management Key',
    description: 'Used for your own internal admin tools to change settings or ban users.',
    vibe: 'The Owner'
  }
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState('tk_');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);

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
      .order('created_at', { ascending: false });

    if (data) setKeys(data);
    setLoading(false);
  }

  async function handleGenerateKey() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Check if user has reached key limit (max 5 active keys)
    const activeKeysCount = keys.filter(k => k.is_active).length;
    if (activeKeysCount >= 5) {
      alert('You can only have 5 active API keys. Please revoke an existing key first.');
      return;
    }
    
    setGenerating(true);
    try {
      const fullKey = generateApiKey(selectedPrefix as any);
      const hint = createKeyHint(fullKey);
      const salt = await generateSalt();
      const hashed = await hashKeyWithSalt(fullKey, salt);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_hint: hint,
          secret_hash: hashed,
          salt: salt,
          tier: 'free'
        });

      if (error) throw error;

      setNewKey(fullKey);
      fetchKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevokeKey(keyId: string) {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);

    if (!error) {
      fetchKeys();
    }
  }

  async function handleDeleteKey(keyId: string) {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);

    if (!error) {
      fetchKeys();
    }
  }

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
        <p className="text-gray-500">Manage your steel-protected API keys</p>
      </div>

      {/* Key Forge Section */}
      <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6 mb-8 relative">
        <div className="absolute inset-0 bg-teal-400/5 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal-400/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Key Forge</h3>
              <p className="text-gray-500 text-sm">Generate your steel-protected API keys</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {/* Custom Prefix Dropdown */}
            <div className="relative z-50">
              {/* Dropdown Trigger */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-[#111] text-white px-4 py-3 rounded-xl border border-[#222] hover:border-teal-400/30 focus:outline-none focus:border-teal-400/50 flex items-center justify-between gap-4 w-56"
              >
                <span>{PREFIX_OPTIONS.find(o => o.value === selectedPrefix)?.label} - {PREFIX_OPTIONS.find(o => o.value === selectedPrefix)?.name}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-[#111] border border-[#222] rounded-xl shadow-xl" style={{ zIndex: 9999 }}>
                  {PREFIX_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="group relative"
                    >
                      {option.value === 'tk_' ? (
                        <button
                          onClick={() => {
                            setSelectedPrefix(option.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-teal-400/10 transition-colors flex items-center justify-between ${selectedPrefix === option.value ? 'bg-teal-400/5 border-l-2 border-teal-400' : 'border-l-2 border-transparent'}`}
                        >
                          <div>
                            <span className="text-white font-medium">{option.label}</span>
                            <span className="text-gray-500 ml-2">{option.name}</span>
                          </div>
                          {selectedPrefix === option.value && (
                            <span className="text-teal-400 text-xs">✓</span>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full px-4 py-3 text-left flex items-center justify-between opacity-50 cursor-not-allowed border-l-2 border-transparent"
                        >
                          <div>
                            <span className="text-white font-medium">{option.label}</span>
                            <span className="text-gray-500 ml-2">{option.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">Soon</span>
                        </button>
                      )}
                      
                      {/* Hover Tooltip for this option */}
                      <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-zinc-900 border border-teal-400/30 rounded-lg text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64" style={{ zIndex: 10000 }}>
                        <p className="text-teal-400 font-medium mb-1">{option.vibe}</p>
                        <p>{option.description}</p>
                        <div className="absolute top-4 right-full border-4 border-transparent border-r-zinc-900" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cor_ Prefix - Coming Soon for AI */}
            <div className="group relative">
              <button
                disabled
                className="px-4 py-3 rounded-xl border border-zinc-700 text-zinc-600 cursor-not-allowed flex items-center gap-2"
              >
                <span>Cor_</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">AI Soon</span>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-teal-400/30 rounded-lg text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Coming Soon - for AI capabilities
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
              </div>
            </div>
            
            <button
              onClick={handleGenerateKey}
              disabled={generating}
              className="bg-teal-400 text-black px-8 py-3 rounded-xl font-semibold hover:bg-teal-300 transition-all disabled:opacity-50 shadow-lg shadow-teal-400/20"
            >
              {generating ? 'Forging...' : 'Generate Key'}
            </button>
          </div>

          {/* Info Message */}
          <div className="mt-4 p-3 bg-teal-400/5 border border-teal-400/20 rounded-lg">
            <p className="text-sm text-gray-400">
              <span className="text-teal-400 font-medium">Test Key Active:</span> You can access Nyati data including the Compass and AI model, 
              but this key will not work for other functions until additional key types are fully implemented.
              <span className="block mt-1 text-xs">Note: AI chat is limited to very short test conversations only.</span>
            </p>
          </div>

          {newKey && (
            <div className="mt-5 p-4 bg-[#111] border border-teal-400/30 rounded-xl">
              <p className="text-sm text-gray-400 mb-2">Your new API key (copy now, you won't see it again):</p>
              <div className="flex items-center gap-3">
                <code className="text-teal-400 font-mono text-sm">{newKey}</code>
                <button
                  onClick={() => handleCopy(newKey)}
                  className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => setNewKey(null)}
                  className="text-gray-500 hover:text-white text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
              
              {/* How to Integrate Button */}
              <button
                onClick={() => setShowIntegration(true)}
                className="mt-4 w-full py-2.5 px-4 bg-teal-400/10 hover:bg-teal-400/20 border border-teal-400/30 rounded-lg text-teal-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Integrate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-[#0c0c0c]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1a1a1a]">
          <h3 className="text-lg font-semibold text-white">Your API Keys</h3>
        </div>
        <table className="w-full">
          <thead className="bg-[#111]">
            <tr>
              <th className="text-left p-4 text-gray-500 font-medium text-sm">Key</th>
              <th className="text-left p-4 text-gray-500 font-medium text-sm">Tier</th>
              <th className="text-left p-4 text-gray-500 font-medium text-sm">Status</th>
              <th className="text-left p-4 text-gray-500 font-medium text-sm">Created</th>
              <th className="text-right p-4 text-gray-500 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-600">
                  No API keys yet. Forge one above!
                </td>
              </tr>
            ) : (
              keys.map(key => (
                <tr key={key.id} className="border-b border-[#1a1a1a] hover:bg-[#111]/50 transition-colors">
                  <td className="p-4">
                    <code className="text-white font-mono text-sm">{key.key_hint}</code>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm capitalize">{key.tier}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${key.is_active ? 'text-teal-400' : 'text-red-500'}`}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {key.is_active ? (
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-red-500 hover:text-red-400 text-sm transition-colors"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-gray-600 hover:text-red-500 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* How to Integrate Button at Bottom */}
        {keys.length > 0 && (
          <div className="p-6 border-t border-[#1a1a1a]">
            <button
              onClick={() => setShowIntegration(true)}
              className="w-full py-2.5 px-4 bg-teal-400/10 hover:bg-teal-400/20 border border-teal-400/30 rounded-lg text-teal-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Integrate API
            </button>
          </div>
        )}
      </div>

      {/* Integration Guide Modal */}
      {showIntegration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Integration Guide
              </h3>
              <button
                onClick={() => setShowIntegration(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* API Endpoints */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">AI Chat Endpoint</h4>
                  <code className="block bg-[#111] px-4 py-3 rounded-lg text-teal-400 font-mono text-sm">
                    POST https://nyaticore.vercel.app/api/v1/ai
                  </code>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">JSON Search/Index Endpoint</h4>
                  <code className="block bg-[#111] px-4 py-3 rounded-lg text-blue-400 font-mono text-sm">
                    POST https://nyaticore.vercel.app/api/v1/search
                  </code>
                </div>
              </div>
              
              {/* AI Chat Example */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">AI Chat Example (Short conversations)</h4>
                <pre className="bg-[#111] p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono text-gray-300">{`const response = await fetch('https://nyaticore.vercel.app/api/v1/ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${newKey || 'YOUR_API_KEY'}'
  },
  body: JSON.stringify({
    message: 'Your message here',
    model: 'nyati-core01'
  })
});

const data = await response.json();
console.log(data);`}</code>
                </pre>
              </div>
              
              {/* JSON Search Example */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">JSON Search Example (For search engines)</h4>
                <pre className="bg-[#111] p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono text-gray-300">{`const response = await fetch('https://nyaticore.vercel.app/api/v1/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${newKey || 'YOUR_API_KEY'}'
  },
  body: JSON.stringify({
    query: 'search term here',
    type: 'json' // Returns structured data for search engines
  })
});

const data = await response.json();
console.log(data);`}</code>
                </pre>
              </div>
              
              {/* Response Formats */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">AI Chat Response</h4>
                  <pre className="bg-[#111] p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm font-mono text-gray-300">{`{
  "content": "AI response text",
  "type": "text", // Can be: text, image, video, audio
  "media_url": "https://nyaticore.vercel.app/...", // For image/video content
  "model": "nyati-core01",
  "usage": {
    "requests_remaining": 99,
    "reset_time": "2024-01-01T00:00:00Z"
  }
}`}</code>
                  </pre>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">JSON Search Response</h4>
                  <pre className="bg-[#111] p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm font-mono text-gray-300">{`{
  "results": [
    {
      "id": "item_id",
      "title": "Result title",
      "content": "Result content",
      "url": "https://...",
      "score": 0.95
    }
  ],
  "total": 42,
  "usage": {
    "requests_remaining": 99,
    "reset_time": "2024-01-01T00:00:00Z"
  }
}`}</code>
                  </pre>
                </div>
              </div>
              
              {/* Important Notes */}
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Important Notes
                </h4>
                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                  <li><strong>Little technical knowledge needed</strong> - Just use the API endpoint URL and your API key</li>
                  <li>AI chat is limited to very short test conversations only (max 500 characters)</li>
                  <li>Rate limit is per account (100/day), not per key - creating new keys won't reset your limit</li>
                  <li>JSON search endpoint provides structured data perfect for building search engines</li>
                  <li>Nyati-core01 is a small, efficient AI model built from scratch for quick responses</li>
                  <li>Test keys work best for quick prototypes and testing</li>
                </ul>
              </div>
              
              {/* Copy Example Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const code = `const response = await fetch('https://nyaticore.vercel.app/api/v1/ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${newKey || 'YOUR_API_KEY'}'
  },
  body: JSON.stringify({
    message: 'Your message here',
    model: 'nyati-core01'
  })
});

const data = await response.json();
console.log(data);`;
                    navigator.clipboard.writeText(code);
                  }}
                  className="py-2.5 px-4 bg-teal-400/10 hover:bg-teal-400/20 border border-teal-400/30 rounded-lg text-teal-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy AI Code
                </button>
                
                <button
                  onClick={() => {
                    const code = `const response = await fetch('https://nyaticore.vercel.app/api/v1/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${newKey || 'YOUR_API_KEY'}'
  },
  body: JSON.stringify({
    query: 'search term here',
    type: 'json'
  })
});

const data = await response.json();
console.log(data);`;
                    navigator.clipboard.writeText(code);
                  }}
                  className="py-2.5 px-4 bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/30 rounded-lg text-blue-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Search Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

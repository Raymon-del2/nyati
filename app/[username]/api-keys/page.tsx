'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateApiKey, createKeyHint, hashKey, KEY_PREFIXES } from '@/lib/keygen';
import type { ApiKey } from '@/lib/supabase';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState('ry_');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

    setGenerating(true);
    try {
      const fullKey = generateApiKey(selectedPrefix as any);
      const hint = createKeyHint(fullKey);
      const hashed = await hashKey(fullKey);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_hint: hint,
          secret_hash: hashed,
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
      <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6 mb-8 relative overflow-hidden">
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
            <select
              value={selectedPrefix}
              onChange={(e) => setSelectedPrefix(e.target.value)}
              className="bg-[#111] text-white px-4 py-3 rounded-xl border border-[#222] focus:outline-none focus:border-teal-400/50"
            >
              {KEY_PREFIXES.map(prefix => (
                <option key={prefix} value={prefix}>{prefix}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateKey}
              disabled={generating}
              className="bg-teal-400 text-black px-8 py-3 rounded-xl font-semibold hover:bg-teal-300 transition-all disabled:opacity-50 shadow-lg shadow-teal-400/20"
            >
              {generating ? 'Forging...' : 'Generate Key'}
            </button>
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
                    {key.is_active && (
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-red-500 hover:text-red-400 text-sm transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

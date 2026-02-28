'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApiKey } from '@/lib/supabase';

export default function OverviewPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRequests, setTotalRequests] = useState(0);
  const [lastPing, setLastPing] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  useEffect(() => {
    fetchKeys();
    // Demo activity for visualization
    const demoInterval = setInterval(() => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour12: false });
      const endpoints = ['/v1/proxy', '/v1/transduce', '/v1/validate', '/v1/stats'];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const newLog = `[${time}] GET ${endpoint} - 200 OK`;
      setActivityLog(prev => [newLog, ...prev].slice(0, 10));
      setTotalRequests(prev => prev + Math.floor(Math.random() * 10));
    }, 3000);
    return () => clearInterval(demoInterval);
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
      fetchRealUsage(data[0].key_hint);
    }
    setLoading(false);
  }

  async function fetchRealUsage(keyHint: string) {
    try {
      const response = await fetch('/api/v1/proxy', {
        headers: { 'Authorization': `Bearer ${keyHint}` }
      });
      if (response.ok) {
        const data = await response.json();
        const prevRequests = totalRequests;
        const newRequests = data.requests || 0;
        setTotalRequests(newRequests);
        setLastPing(data.timestamp || null);
        
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        const status = data.mode === 'demo' ? '200 OK (Demo)' : '200 OK';
        const newLog = `[${time}] POST /v1/proxy - ${status}`;
        setActivityLog(prev => [newLog, ...prev].slice(0, 10));
      }
    } catch (e) {
      console.log('API not ready yet');
    }
  }

  const activeKeys = keys.filter(k => k.is_active).length;
  const usagePercent = Math.min(Math.round((totalRequests / 10000) * 100), 100);

  const stats = [
    { label: 'Total Requests', value: totalRequests.toLocaleString(), icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Active Keys', value: activeKeys.toString(), icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
    { label: 'Current Tier', value: 'Free', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { label: 'Usage', value: `${usagePercent}%`, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Overview</h1>
        <p className="text-gray-500">Your API platform at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#111] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <span className="text-gray-500 text-sm">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* API Status */}
      <div className="mt-8 bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">API Status</h2>
            <p className="text-gray-500 text-sm">Your Nyati API endpoint</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
            <span className="text-teal-400 text-sm">Online</span>
          </div>
        </div>
        <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Endpoint</span>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/v1/proxy`)}
              className="text-teal-400 hover:text-teal-300 text-sm"
            >
              Copy
            </button>
          </div>
          <code className="text-white font-mono text-sm">{window.location.origin}/api/v1/proxy</code>
          <div className="mt-4 pt-4 border-t border-[#222]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Test your key:</span>
              <code className="text-teal-400 text-xs">curl -H "Authorization: Bearer YOUR_KEY" {window.location.origin}/api/v1/proxy</code>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Log */}
      <div className="mt-8 bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <p className="text-gray-500 text-sm">Live API request log</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
            <span className="text-teal-400 text-sm">Live</span>
          </div>
        </div>
        <div className="bg-[#111] rounded-xl p-4 font-mono text-sm h-48 overflow-y-auto">
          {activityLog.length === 0 ? (
            <span className="text-gray-600">Waiting for API requests...</span>
          ) : (
            activityLog.map((log, index) => (
              <div key={index} className="text-gray-400 py-1 border-b border-[#1a1a1a] last:border-0">
                <span className="text-teal-400">{log}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href={`/${keys[0]?.key_hint?.replace('@', '') || 'settings'}/api-keys`} className="p-4 bg-[#111] rounded-xl border border-[#222] hover:border-teal-400/30 transition-colors">
            <div className="w-10 h-10 bg-teal-400/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">Generate API Key</h3>
            <p className="text-gray-500 text-sm">Create a new steel-protected key</p>
          </a>
          <a href={`/${keys[0]?.key_hint?.replace('@', '') || 'settings'}/usage`} className="p-4 bg-[#111] rounded-xl border border-[#222] hover:border-teal-400/30 transition-colors">
            <div className="w-10 h-10 bg-teal-400/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">View Usage</h3>
            <p className="text-gray-500 text-sm">Monitor your API consumption</p>
          </a>
          <a href={`/${keys[0]?.key_hint?.replace('@', '') || 'settings'}/settings`} className="p-4 bg-[#111] rounded-xl border border-[#222] hover:border-teal-400/30 transition-colors">
            <div className="w-10 h-10 bg-teal-400/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">Settings</h3>
            <p className="text-gray-500 text-sm">Manage your profile and preferences</p>
          </a>
        </div>
      </div>
    </div>
  );
}

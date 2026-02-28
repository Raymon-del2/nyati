'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateApiKey, createKeyHint, hashKey, KEY_PREFIXES } from '@/lib/keygen';
import type { ApiKey } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState('ry_');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailSent, setEmailSent] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (data?.username) {
        const username = data.username.replace(/^@/, '');
        router.replace(`/${username}`);
      } else {
        router.replace('/settings');
      }
      return;
    }
    setLoading(false);
  }

  async function checkUsername(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    
    if (data?.username) {
      setUsername(data.username);
    } else {
      setShowUsernameModal(true);
    }
    setLoading(false);
  }

  async function checkUsernameAvailability(inputUsername: string) {
    const cleanUsername = inputUsername.replace(/^@/, '').toLowerCase();
    
    if (!cleanUsername.match(/^[a-zA-Z0-9_]+$/)) {
      setUsernameStatus('taken');
      return;
    }

    setUsernameStatus('checking');
    
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', `@${cleanUsername}`)
      .maybeSingle();
    
    setUsernameStatus(data ? 'taken' : 'available');
  }

  async function saveUsername() {
    if (!user || usernameStatus !== 'available') return;
    
    setIsSavingUsername(true);
    const cleanUsername = usernameInput.replace(/^@/, '').toLowerCase();
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: `@${cleanUsername}`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (!error) {
      setUsername(`@${cleanUsername}`);
      setShowUsernameModal(false);
      router.push(`/${cleanUsername}`);
    } else {
      alert('Failed to save username');
    }
    setIsSavingUsername(false);
  }

  async function fetchKeys() {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKeys(data);
    }
    setLoading(false);
  }

  async function handleAuth() {
    setIsLoadingAuth(true);
    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setEmailSent(true);
        return;
      }
      checkUser();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function handleGenerateKey() {
    if (!user) {
      alert('Please sign in first');
      return;
    }

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

  async function handleRevokeKey(id: string) {
    if (!confirm('Are you sure you want to revoke this key?')) return;

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      fetchKeys();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-teal-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="mb-8">
            <img 
              src="/logo.webp" 
              alt="Nyati" 
              className="w-24 h-24 object-contain"
            />
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Nyati</h1>
          <p className="text-gray-400 text-lg mb-12">Steel-protected API management for developers</p>

          <div className="w-full max-w-sm bg-[#0c0c0c] border border-[#222] rounded-2xl p-8">
            {emailSent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-3">Check your email</h2>
                <p className="text-gray-400 text-sm mb-6">
                  We've sent a verification link to<br />
                  <span className="text-white">{email}</span>
                </p>
                <button
                  onClick={() => { setEmailSent(false); setAuthMode('signin'); }}
                  className="text-gray-500 hover:text-white text-sm transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                      authMode === 'signin' 
                        ? 'bg-white text-black border-white' 
                        : 'text-gray-400 border-[#333] hover:text-white hover:border-[#444]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                      authMode === 'signup' 
                        ? 'bg-white text-black border-white' 
                        : 'text-gray-400 border-[#333] hover:text-white hover:border-[#444]'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#444] mb-3"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#444] mb-6"
                />

                <button
                  onClick={handleAuth}
                  disabled={isLoadingAuth}
                  className="w-full bg-white text-black py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isLoadingAuth ? 'Processing...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <a href="/docs" className="text-gray-500 hover:text-teal-400 text-sm transition-colors">
              Read the Docs →
            </a>
          </div>
        </div>

        <footer className="py-6 text-center text-gray-600 text-sm">
          &copy; 2026 Nyati. Built for developers.
        </footer>
      </div>
    );
  }

  const activeKeys = keys.filter(k => k.is_active).length;

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col fixed h-full transition-all duration-300`}>
        <div className={`p-6 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <img src="/logo.webp" alt="Nyati" className="w-8 h-8 object-contain" />
            {!sidebarCollapsed && <span className="text-xl font-bold text-white">Nyati</span>}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`text-gray-500 hover:text-white transition-colors ${sidebarCollapsed ? 'hidden' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
            </svg>
          </button>
        </div>

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mx-auto mb-4 text-gray-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
        )}

        <nav className="flex-1 px-3">
          {[
            { name: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { name: 'API Keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
            { name: 'Usage', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            { name: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
          ].map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${
                item.name === 'API Keys' 
                  ? 'bg-[#1a1a1a] text-white' 
                  : 'text-gray-500 hover:text-white hover:bg-[#0f0f0f]'
              } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {!sidebarCollapsed && item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1a1a1a]">
          <div className={`flex items-center gap-3 mb-4 ${sidebarCollapsed ? 'justify-center' : 'px-2'}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-teal-400/30">
              <img 
                src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(username || user?.email || 'default')}`} 
                alt="Avatar" 
                className="w-full h-full"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{username || user?.email}</p>
                <p className="text-gray-600 text-xs">Free Tier</p>
              </div>
            )}
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => setUser(null))}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-[#0f0f0f] transition-all ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Username Modal */}
        {showUsernameModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-8 w-full max-w-md mx-4">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 border-teal-400/30">
                  <img 
                    src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(usernameInput || 'preview')}`}
                    alt="Avatar Preview"
                    className="w-full h-full"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Claim your Nyati handle</h2>
                <p className="text-gray-500">Choose a unique username to identify yourself on the platform</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">@</span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                        setUsernameInput(val);
                        if (val.length > 0) {
                          checkUsernameAvailability(val);
                        } else {
                          setUsernameStatus('idle');
                        }
                      }}
                      placeholder="username"
                      className="w-full bg-[#111] border border-[#222] rounded-xl px-8 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-400/50 text-lg"
                      autoFocus
                    />
                  </div>
                  {usernameStatus !== 'idle' && usernameInput.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      {usernameStatus === 'checking' ? (
                        <span className="text-gray-500 text-sm">Checking...</span>
                      ) : usernameStatus === 'available' ? (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Available
                        </span>
                      ) : (
                        <span className="text-red-500 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Taken
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={saveUsername}
                  disabled={usernameStatus !== 'available' || isSavingUsername}
                  className="w-full bg-teal-400 text-black py-4 rounded-xl font-semibold hover:bg-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingUsername ? 'Saving...' : 'Claim Username'}
                </button>

                <p className="text-gray-600 text-xs text-center">
                  Only letters, numbers, and underscores allowed
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: '0', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { label: 'Active Keys', value: activeKeys.toString(), icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
            { label: 'Current Tier', value: 'Free', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
            { label: 'Usage', value: '0%', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          ].map((stat) => (
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
                    onClick={() => navigator.clipboard.writeText(newKey)}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    Copy
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
      </main>
    </div>
  );
}

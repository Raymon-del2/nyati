'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (data?.username) {
      setUsername(data.username.replace(/^@/, ''));
    }
    setLoading(false);
  }

  async function checkUsernameAvailability(inputUsername: string) {
    const cleanUsername = inputUsername.toLowerCase();
    
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || usernameStatus !== 'available') return;
    
    setIsSaving(true);
    const cleanUsername = username.toLowerCase();
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: `@${cleanUsername}`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (!error) {
      alert('Username updated!');
    } else {
      alert('Failed to update username');
    }
    setIsSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const hasUsername = username.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-500">Manage your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Profile</h2>
          
          <div className="flex items-start gap-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-teal-400/30 mb-3">
                <img 
                  src={`https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(username || 'preview')}`}
                  alt="Avatar Preview"
                  className="w-full h-full"
                />
              </div>
              <span className="text-gray-500 text-xs">Auto-generated from username</span>
            </div>

            {/* Username Input */}
            <div className="flex-1">
              <label className="block text-gray-400 text-sm mb-2">Username</label>
              {hasUsername ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">@</span>
                    <input
                      type="text"
                      value={username}
                      disabled
                      className="w-full bg-[#111] border border-[#222] rounded-xl px-8 py-3 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <span className="px-4 py-2 bg-teal-400/10 text-teal-400 rounded-xl text-sm font-medium">
                    Locked
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                          setUsername(val);
                          if (val.length > 0) {
                            checkUsernameAvailability(val);
                          } else {
                            setUsernameStatus('idle');
                          }
                        }}
                        placeholder="Choose your username"
                        className="w-full bg-[#111] border border-[#222] rounded-xl px-8 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-400/50"
                      />
                    </div>
                    <button
                      onClick={saveUsername}
                      disabled={usernameStatus !== 'available' || isSaving}
                      className="bg-teal-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-teal-300 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Claim'}
                    </button>
                  </div>
                  {usernameStatus !== 'idle' && username.length > 0 && (
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
                  <p className="text-gray-600 text-sm mt-3">Choose carefully - usernames cannot be changed once set.</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Account</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
              <div>
                <p className="text-white">Current Tier</p>
                <p className="text-gray-500 text-sm">Your subscription plan</p>
              </div>
              <span className="px-4 py-1.5 bg-teal-400/10 text-teal-400 rounded-full text-sm font-medium">Free</span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white">Account Status</p>
                <p className="text-gray-500 text-sm">Your account is active</p>
              </div>
              <span className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

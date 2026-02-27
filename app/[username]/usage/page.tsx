'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function UsagePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Usage</h1>
        <p className="text-gray-500">Monitor your API consumption and performance</p>
      </div>

      <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Usage Analytics Coming Soon</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Track your API requests, latency, and error rates in real-time. 
            This feature will be available when you start making API calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-[#111] rounded-xl border border-[#222]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Requests Today</span>
              <span className="text-teal-400 text-sm">0</span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full w-0 bg-teal-400 rounded-full"></div>
            </div>
          </div>
          <div className="p-4 bg-[#111] rounded-xl border border-[#222]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Avg. Latency</span>
              <span className="text-gray-400 text-sm">--</span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full w-0 bg-teal-400 rounded-full"></div>
            </div>
          </div>
          <div className="p-4 bg-[#111] rounded-xl border border-[#222]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Error Rate</span>
              <span className="text-gray-400 text-sm">0%</span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full w-0 bg-teal-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

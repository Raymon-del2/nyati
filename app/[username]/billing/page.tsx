'use client';

import { useState } from 'react';

export default function BillingPage() {
  const [loading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: ['100 API requests/day', '1 API Key', 'Community support'],
      current: true,
    },
    {
      name: 'Builder',
      price: '$29',
      period: '/month',
      description: 'For developers building serious apps',
      features: ['10,000 API requests/day', '10 API Keys', 'Priority support', 'Analytics'],
      current: false,
    },
    {
      name: 'Nyati',
      price: '$99',
      period: '/month',
      description: 'For production workloads',
      features: ['Unlimited requests', 'Unlimited keys', '24/7 support', 'Advanced analytics', 'Custom rate limits'],
      current: false,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Billing</h1>
        <p className="text-gray-500">Manage your subscription and payment methods</p>
      </div>

      {/* Current Plan */}
      <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Current Plan</h2>
            <p className="text-gray-500 text-sm">You are on the Free plan</p>
          </div>
          <span className="px-4 py-1.5 bg-teal-400/10 text-teal-400 rounded-full text-sm font-medium">Free</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[#111] rounded-xl">
            <p className="text-gray-500 text-sm mb-1">API Requests</p>
            <p className="text-white font-semibold">0 / 100</p>
            <p className="text-gray-600 text-xs mt-1">Reset in 24h</p>
          </div>
          <div className="p-4 bg-[#111] rounded-xl">
            <p className="text-gray-500 text-sm mb-1">API Keys</p>
            <p className="text-white font-semibold">0 / 1</p>
          </div>
          <div className="p-4 bg-[#111] rounded-xl">
            <p className="text-gray-500 text-sm mb-1">Next Billing</p>
            <p className="text-white font-semibold">--</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`bg-[#0c0c0c] border rounded-2xl p-6 ${
                plan.current ? 'border-teal-400/30' : 'border-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{plan.name}</h3>
                {plan.current && (
                  <span className="px-2 py-1 bg-teal-400/10 text-teal-400 text-xs rounded-full">Current</span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled={plan.current}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  plan.current
                    ? 'bg-[#1a1a1a] text-gray-500 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method (Coming Soon) */}
      <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Payment Methods Coming Soon</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            We'll support USDC/SOL payments via Solana Pay for Kenyan developers. 
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
}

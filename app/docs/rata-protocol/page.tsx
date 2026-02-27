'use client';

import { useState } from 'react';

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden mb-6">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#222]">
        <span className="text-xs text-gray-500 uppercase">{language}</span>
        <button
          onClick={copyCode}
          className="text-xs text-gray-500 hover:text-teal-400 transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-300">{code}</code>
      </pre>
    </div>
  );
}

export default function RATAProtocolPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">R.A.T.A. Protocol</h1>
      <p className="text-xl text-gray-400 mb-8">
        Real-time Authentication Token Algorithm — The Heart of Nyati
      </p>

      <div className="prose prose-invert max-w-none">
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">What is R.A.T.A.?</h2>
          <p className="text-gray-400 leading-relaxed">
            R.A.T.A. (Real-time Authentication Token Algorithm) is Nyati's proprietary authentication protocol. 
            It's designed for zero-trust security at scale, ensuring that every request is authenticated in real-time 
            without sacrificing performance.
          </p>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-teal-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Key Validation</h3>
                <p className="text-gray-400">
                  Your API key is validated against our Edge cache. Valid keys are checked in &lt;1ms.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-teal-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Hash Verification</h3>
                <p className="text-gray-400">
                  The key hash is verified against our multi-layer hashing system. Raw keys never leave the secure enclave.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-teal-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Token Generation</h3>
                <p className="text-gray-400">
                  A temporary session token is generated with a configurable TTL (Time To Live).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-teal-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Request Processing</h3>
                <p className="text-gray-400">
                  Your request is processed with the session token. The entire flow happens at the Edge.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Security Architecture</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-teal-400 mb-2">Multi-Layer Hashing</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Your API key passes through multiple hashing layers before storage:
              </p>
              <CodeBlock
                language="typescript"
                code={`// Layer 1: SHA-256 (fast, for quick validation)
const layer1 = sha256(apiKey);

// Layer 2: Argon2 (memory-hard, for storage)
const layer2 = argon2(layer1);

// Final: HMAC-SHA512 (for signing)
const finalHash = hmacSha512(layer2, process.env.HMAC_SECRET);`}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-teal-400 mb-2">Zero-Knowledge Proof</h3>
              <p className="text-gray-400 leading-relaxed">
                Nyati uses zero-knowledge proofs to validate your key without ever seeing it. 
                The math guarantees that we can verify your identity without compromising your security.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-teal-400 mb-2">Edge Isolation</h3>
              <p className="text-gray-400 leading-relaxed">
                All authentication happens at the Edge. Your request never reaches our central servers 
                until after authentication is complete. This reduces latency and improves security.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">TypeScript Interfaces</h2>
          
          <CodeBlock
            language="typescript"
            code={`// API Key interface
interface ApiKey {
  id: string;
  key_hint: string;        // First 8 chars: ry_xxxxxxx
  secret_hash: string;     // Multi-layer hashed
  tier: 'free' | 'builder' | 'nyati';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Session Token
interface SessionToken {
  token_id: string;
  api_key_id: string;
  expires_at: number;      // Unix timestamp
  scope: string[];
  rate_limit: {
    requests: number;
    window: number;        // in seconds
  };
}

// Authentication Response
interface AuthResponse {
  valid: boolean;
  session?: SessionToken;
  error?: {
    code: string;
    message: string;
  };
}`}
          />
        </div>

        <div className="bg-gradient-to-r from-teal-400/10 to-transparent border border-teal-400/20 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Integration Example</h2>
          <p className="text-gray-400 mb-6">
            Here's how to use R.A.T.A. in your TypeScript application:
          </p>
          
          <CodeBlock
            language="typescript"
            code={`import { Nyati } from '@nyati/sdk';

const nyati = new Nyati({
  apiKey: process.env.NYATI_API_KEY!
});

// R.A.T.A. automatically handles:
// 1. Key validation at the Edge
// 2. Session token management
// 3. Automatic token refresh

const result = await nyati.transduce({
  data: 'your data',
  options: {
    operation: 'compress',
    level: 'balanced'
  }
});

// The SDK handles all R.A.T.A. complexity
// You just get the result!
console.log(result);`}
          />
        </div>
      </div>
    </div>
  );
}

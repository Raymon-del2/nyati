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

export default function AuthenticationPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">Authentication</h1>
      <p className="text-xl text-gray-400 mb-8">
        Secure your API requests with Nyati's Bearer token authentication
      </p>

      <div className="prose prose-invert max-w-none">
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
          <p className="text-gray-400 leading-relaxed">
            Nyati uses Bearer token authentication. Every API request must include a valid API key 
            in the <code className="text-teal-300">Authorization</code> header. Your key must start with 
            <code className="text-teal-300">ry_</code> to be recognized as a valid Nyati key.
          </p>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">The Authorization Header</h2>
          <p className="text-gray-400 mb-4">
            Include your API key in the request header like this:
          </p>
          <CodeBlock
            language="http"
            code={`Authorization: Bearer ry_your_api_key_here`}
          />

          <div className="bg-[#111] border border-[#222] rounded-xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-white font-medium mb-1">Always use HTTPS</p>
                <p className="text-gray-500 text-sm">
                  Never send your API key over HTTP. Nyati only accepts secure HTTPS connections.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Complete Request Example</h2>
          <p className="text-gray-400 mb-6">
            Here's a complete example of an authenticated request:
          </p>

          <h3 className="text-lg font-medium text-white mb-3">cURL</h3>
          <CodeBlock
            language="bash"
            code={`curl -X POST "https://api.nyati.io/v1/transduce" \\
  -H "Authorization: Bearer ry_pk_live_abc123xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operation": "compress",
    "data": "your data here",
    "options": {
      "level": "balanced"
    }
  }'`}
          />

          <h3 className="text-lg font-medium text-white mb-3">JavaScript / TypeScript</h3>
          <CodeBlock
            language="typescript"
            code={`const response = await fetch('https://api.nyati.io/v1/transduce', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ry_pk_live_abc123xyz789',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operation: 'compress',
    data: 'your data here',
    options: {
      level: 'balanced'
    }
  })
});

const result = await response.json();`}
          />
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Error Responses</h2>
          <p className="text-gray-400 mb-4">
            If your authentication fails, you'll receive one of these error responses:
          </p>

          <div className="space-y-4">
            <div className="bg-[#111] border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 font-mono text-sm mb-1">401 Unauthorized</p>
              <p className="text-gray-500 text-sm">Invalid or expired API key</p>
            </div>
            <div className="bg-[#111] border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 font-mono text-sm mb-1">403 Forbidden</p>
              <p className="text-gray-500 text-sm">Valid key but insufficient permissions</p>
            </div>
            <div className="bg-[#111] border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 font-mono text-sm mb-1">429 Too Many Requests</p>
              <p className="text-gray-500 text-sm">Rate limit exceeded</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Never commit your API key to version control</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Use environment variables to store your keys</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Rotate your keys periodically</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Use separate keys for development and production</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

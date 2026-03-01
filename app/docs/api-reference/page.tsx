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

export default function APIReferencePage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
      <p className="text-xl text-gray-400 mb-8">
        Complete reference for the Nyati API
      </p>

      <div className="prose prose-invert max-w-none">
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Base URL</h2>
          <CodeBlock
            language="text"
            code={`https://nyaticore.vercel.app/api/v1`}
          />
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Endpoints</h2>
          
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">POST</span>
                <code className="text-teal-400 text-lg">/transduce</code>
              </div>
              <p className="text-gray-400 mb-4">Process and transduce data through the Nyati engine.</p>
              
              <h4 className="text-white font-medium mb-2">Request Body</h4>
              <CodeBlock
                language="typescript"
                code={`{
  "operation": "compress" | "hash" | "encode" | "decode",
  "data": string,
  "options": {
    "level": "fast" | "balanced" | "maximum",
    "encoding": "base64" | "hex" | "url",
    "algorithm": "sha256" | "sha512" | "blake3"
  }
}`}
              />

              <h4 className="text-white font-medium mb-2">Response</h4>
              <CodeBlock
                language="typescript"
                code={`{
  "success": true,
  "result": "transduced data...",
  "metadata": {
    "operation": "compress",
    "originalSize": 1024,
    "resultSize": 512,
    "compressionRatio": "50%"
  }
}`}
              />
            </div>

            <div className="border-t border-[#222] pt-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">GET</span>
                <code className="text-teal-400 text-lg">/keys</code>
              </div>
              <p className="text-gray-400 mb-4">List all your API keys.</p>
              
              <h4 className="text-white font-medium mb-2">Response</h4>
              <CodeBlock
                language="typescript"
                code={`{
  "keys": [
    {
      "id": "key_xxx",
      "key_hint": "ry_xxxxxxx",
      "tier": "free",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}`}
              />
            </div>

            <div className="border-t border-[#222] pt-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">POST</span>
                <code className="text-teal-400 text-lg">/keys</code>
              </div>
              <p className="text-gray-400 mb-4">Create a new API key.</p>
              
              <h4 className="text-white font-medium mb-2">Request Body</h4>
              <CodeBlock
                language="typescript"
                code={`{
  "prefix": "ry_",
  "tier": "free" | "builder" | "nyati"
}`}
              />
            </div>

            <div className="border-t border-[#222] pt-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">DELETE</span>
                <code className="text-teal-400 text-lg">/keys/:id</code>
              </div>
              <p className="text-gray-400 mb-4">Revoke an API key.</p>
            </div>

            <div className="border-t border-[#222] pt-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">GET</span>
                <code className="text-teal-400 text-lg">/usage</code>
              </div>
              <p className="text-gray-400 mb-4">Get your current usage statistics.</p>
              
              <h4 className="text-white font-medium mb-2">Response</h4>
              <CodeBlock
                language="typescript"
                code={`{
  "usage": {
    "requests_today": 150,
    "requests_limit": 1000,
    "keys_count": 3,
    "keys_limit": 10
  }
}`}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Error Codes</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="text-left py-3 text-gray-400 font-medium">Code</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-[#222]">
                  <td className="py-3 text-teal-400 font-mono">INVALID_KEY</td>
                  <td className="py-3">401</td>
                  <td className="py-3">The API key is invalid or malformed</td>
                </tr>
                <tr className="border-b border-[#222]">
                  <td className="py-3 text-teal-400 font-mono">EXPIRED_KEY</td>
                  <td className="py-3">401</td>
                  <td className="py-3">The API key has expired</td>
                </tr>
                <tr className="border-b border-[#222]">
                  <td className="py-3 text-teal-400 font-mono">REVOKED_KEY</td>
                  <td className="py-3">401</td>
                  <td className="py-3">The API key has been revoked</td>
                </tr>
                <tr className="border-b border-[#222]">
                  <td className="py-3 text-teal-400 font-mono">INSUFFICIENT_PERMISSIONS</td>
                  <td className="py-3">403</td>
                  <td className="py-3">Key doesn't have required tier</td>
                </tr>
                <tr className="border-b border-[#222]">
                  <td className="py-3 text-teal-400 font-mono">RATE_LIMITED</td>
                  <td className="py-3">429</td>
                  <td className="py-3">Too many requests</td>
                </tr>
                <tr>
                  <td className="py-3 text-teal-400 font-mono">INVALID_REQUEST</td>
                  <td className="py-3">400</td>
                  <td className="py-3">Malformed request body</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

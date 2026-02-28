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

export default function QuickStartPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">Quick Start</h1>
      <p className="text-xl text-gray-400 mb-8">
        Get up and running with Nyati in under 5 minutes
      </p>

      <div className="prose prose-invert max-w-none">
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Step 1: Generate Your API Key</h2>
          <p className="text-gray-400 mb-4">
            First, generate your Nyati API key from your dashboard:
          </p>
          <ol className="list-decimal list-inside text-gray-400 space-y-2">
            <li>Navigate to your dashboard</li>
            <li>Click on <span className="text-teal-400">API Keys</span> in the sidebar</li>
            <li>Select your key prefix (we recommend <code className="text-teal-300">ry_</code>)</li>
            <li>Click <span className="text-teal-400">Generate Key</span></li>
            <li><strong className="text-white">Important:</strong> Copy your key immediately. You won't be able to see it again!</li>
          </ol>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Step 2: Make Your First Request</h2>
          <p className="text-gray-400 mb-6">
            Here's how to authenticate with Nyati using your API key:
          </p>

          <h3 className="text-lg font-medium text-white mb-3">cURL</h3>
          <CodeBlock
            language="bash"
            code={`# Test your API key with the proxy endpoint
curl -X POST "https://your-domain.com/api/v1/proxy" \\
  -H "Authorization: Bearer ry_your_api_key_here" \\
  -H "Content-Type: application/json"`}
          />

          <h3 className="text-lg font-medium text-white mb-3">Response</h3>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "message": "Nyati Security Proxy",
  "timestamp": "2026-02-28T12:00:00.000Z",
  "validation_latency_ms": "2.45"
}`}
          />

          <h3 className="text-lg font-medium text-white mb-3">TypeScript / JavaScript</h3>
          <CodeBlock
            language="typescript"
            code={`const response = await fetch('https://your-domain.com/api/v1/proxy', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ry_your_api_key_here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
          />

          <h3 className="text-lg font-medium text-white mb-3">Python</h3>
          <CodeBlock
            language="python"
            code={`import requests

response = requests.post(
    'https://your-domain.com/api/v1/proxy',
    headers={
        'Authorization': 'Bearer ry_your_api_key_here',
        'Content-Type': 'application/json'
    }
)

print(response.json())`}
          />

          <h3 className="text-lg font-medium text-white mb-3">Go</h3>
          <CodeBlock
            language="go"
            code={`req, _ := http.NewRequest("POST", "https://your-domain.com/api/v1/proxy", nil)
req.Header.Set("Authorization", "Bearer ry_your_api_key_here")

client := &http.Client{}
resp, _ := client.Do(req)
defer resp.Body.Close()`}
          />
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Step 3: Rate Limit Headers</h2>
          <p className="text-gray-400 mb-6">
            Every response includes rate limit information in the headers:
          </p>

          <CodeBlock
            language="bash"
            code={`# Response Headers
X-Nyati-Limit-Remaining: 999
X-Nyati-Limit-Reset: 2026-02-28T13:00:00.000Z`}
          />

          <p className="text-gray-400 text-sm">
            The <code className="text-teal-300">X-Nyati-Limit-Remaining</code> header shows how many requests you have left in the current window.
          </p>
        </div>

        <div className="bg-gradient-to-r from-teal-400/10 to-transparent border border-teal-400/20 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Next Steps</h2>
          <p className="text-gray-400 mb-6">
            Now that you've made your first request, explore more:
          </p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="/docs/authentication"
              className="inline-flex items-center gap-2 bg-[#111] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#1a1a1a] transition-colors"
            >
              Authentication →
            </a>
            <a
              href="/docs/rata-protocol"
              className="inline-flex items-center gap-2 bg-[#111] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#1a1a1a] transition-colors"
            >
              R.A.T.A. Protocol →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

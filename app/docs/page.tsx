export default function IntroductionPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">Introduction to Nyati</h1>
      <p className="text-xl text-gray-400 mb-8">
        The Steel-Protected API Platform for High-Performance Applications
      </p>

      <div className="prose prose-invert max-w-none">
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">What is Nyati?</h2>
          <p className="text-gray-400 leading-relaxed">
            Nyati is a next-generation API platform that combines the speed of Edge computing with military-grade key protection. 
            Built for developers who demand both performance and security, Nyati provides a seamless way to generate, manage, 
            and authenticate API keys with zero compromise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="w-12 h-12 bg-teal-400/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Edge-First Architecture</h3>
            <p className="text-gray-500 text-sm">
              Data transduction at the Edge with sub-millisecond latency. Your API calls never leave the network edge.
            </p>
          </div>

          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="w-12 h-12 bg-teal-400/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Steel Protection</h3>
            <p className="text-gray-500 text-sm">
              Multi-layer hashing ensures even we cannot see your raw keys. Your security is mathematically guaranteed.
            </p>
          </div>

          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="w-12 h-12 bg-teal-400/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Universal Compatibility</h3>
            <p className="text-gray-500 text-sm">
              SDKs for TypeScript, Rust, Python, and Go. Connect from any platform, any language.
            </p>
          </div>

          <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6">
            <div className="w-12 h-12 bg-teal-400/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">R.A.T.A. Protocol</h3>
            <p className="text-gray-500 text-sm">
              Our proprietary Real-time Authentication Token Algorithm. Zero-trust security at scale.
            </p>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">The Nyati Philosophy</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-teal-400 mb-2">The Prefix: <code className="text-teal-300">ry_</code></h3>
              <p className="text-gray-400 leading-relaxed">
                Every API key starts with <code className="bg-[#111] px-2 py-1 rounded text-teal-300">ry_</code> — 
                The Founder's Mark. It's not just a prefix; it's a promise. When you see <code className="bg-[#111] px-2 py-1 rounded text-teal-300">ry_</code>, 
                you know your key is protected by Nyati's Steel infrastructure.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-teal-400 mb-2">The 0xBF Logic</h3>
              <p className="text-gray-400 leading-relaxed">
                At the heart of Nyati is the <code className="bg-[#111] px-2 py-1 rounded text-teal-300">0xBF</code> protocol — 
                a proprietary compression and transduction algorithm that processes data at the Edge. 
                This isn't just fast; it's the future of how API calls should work.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-teal-400 mb-2">Steel Protection</h3>
              <p className="text-gray-400 leading-relaxed">
                We use salted SHA-256 hashing with constant-time comparison to ensure your raw keys never exist in plain text. 
                Even we can't see them. Your keys are cryptographically isolated from the moment they're created.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Security Features</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-teal-400 mt-1">✓</span>
              <div>
                <h4 className="text-white font-medium">Salted Key Storage</h4>
                <p className="text-gray-500 text-sm">Each API key gets a unique cryptographically secure salt before hashing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-teal-400 mt-1">✓</span>
              <div>
                <h4 className="text-white font-medium">Constant-Time Comparison</h4>
                <p className="text-gray-500 text-sm">Prevents timing attacks with XOR-based secure comparison</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-teal-400 mt-1">✓</span>
              <div>
                <h4 className="text-white font-medium">Latency Monitoring</h4>
                <p className="text-gray-500 text-sm">Validation performance tracked in real-time (target: &lt;10ms)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-400/10 to-transparent border border-teal-400/20 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Ready to Build?</h2>
          <p className="text-gray-400 mb-6">
            Head to your dashboard to generate your first API key, then check out the Quick Start guide to make your first request.
          </p>
          <div className="flex gap-4">
            <a
              href="/docs/quick-start"
              className="inline-flex items-center gap-2 bg-teal-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-teal-300 transition-colors"
            >
              Quick Start
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

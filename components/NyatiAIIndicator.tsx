'use client';

import Image from 'next/image';

interface NyatiAIIndicatorProps {
  status: 'waiting' | 'typing' | 'idle';
}

export function NyatiAIIndicator({ status }: NyatiAIIndicatorProps) {
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      {/* 1. The Spinning Comet (Only when waiting) */}
      {status === 'waiting' && (
        <div className="absolute nyati-comet-loader" />
      )}

      {/* 2. The Nyati Logo / Spark Center */}
      <div className={`
        relative z-10 flex items-center justify-center w-8 h-8 rounded-full 
        bg-zinc-900 border border-zinc-800 shadow-[0_0_15px_rgba(45,212,191,0.3)]
        ${status === 'typing' ? 'scale-90 transition-transform' : 'scale-100'}
      `}>
        <Image 
          src="/logo.webp" 
          alt="Nyati" 
          width={32} 
          height={32} 
          className="w-6 h-6 rounded-full drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"
        />
      </div>

      {/* 3. The Outer Glow Pulse */}
      {status !== 'idle' && (
        <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-pulse blur-xl" />
      )}
    </div>
  );
}

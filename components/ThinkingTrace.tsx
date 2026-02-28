'use client';

import { useEffect, useState } from 'react';

interface ThinkingTraceProps {
  isWaiting: boolean;
}

const thinkingMessages = [
  'Initializing Nyati-core01...',
  'Searching local knowledge base...',
  'Validating proxy safety...',
  'Optimizing response format...',
  'Compiling Steel-grade output...',
];

export function ThinkingTrace({ isWaiting }: ThinkingTraceProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!isWaiting) {
      setDisplayText('');
      setCurrentMessage(0);
      return;
    }

    const message = thinkingMessages[currentMessage];
    let charIndex = 0;
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (charIndex <= message.length) {
        setDisplayText(message.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        
        // Wait then move to next message
        setTimeout(() => {
          setCurrentMessage((prev) => (prev + 1) % thinkingMessages.length);
        }, 1000);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [isWaiting, currentMessage]);

  if (!isWaiting) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
      <span className="font-mono">{displayText}</span>
      {isTyping && <span className="w-0.5 h-3 bg-teal-400 animate-pulse" />}
    </div>
  );
}

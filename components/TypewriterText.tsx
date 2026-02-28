'use client';

import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  isStreaming: boolean;
  onFirstToken?: () => void;
}

export function TypewriterText({ text, isStreaming, onFirstToken }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [hasTriggeredFirstToken, setHasTriggeredFirstToken] = useState(false);

  useEffect(() => {
    if (text.length > 0 && !hasTriggeredFirstToken) {
      onFirstToken?.();
      setHasTriggeredFirstToken(true);
    }
  }, [text, hasTriggeredFirstToken, onFirstToken]);

  useEffect(() => {
    setDisplayedText(text);
  }, [text]);

  // Split text into words for animation
  const words = displayedText.split(' ');

  return (
    <span>
      {words.map((word, index) => (
        <span 
          key={index} 
          className="nyati-word-animate"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {word}
          {index < words.length - 1 && ' '}
        </span>
      ))}
      {isStreaming && <span className="nyati-cursor" />}
    </span>
  );
}

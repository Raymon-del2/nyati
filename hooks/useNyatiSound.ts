'use client';

import { useEffect, useRef } from 'react';

export function useNyatiSound(isTyping: boolean, soundEnabled: boolean = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Initialize the Nyati wave sound
    audioRef.current = new Audio('/sounds/nyati-wave.wav');
    audioRef.current.volume = 0.3; // Slightly louder for better presence
  }, []);

  useEffect(() => {
    if (!soundEnabled) return;
    
    // Trigger ONLY when the AI starts typing the first word
    if (isTyping && !hasPlayedRef.current) {
      audioRef.current?.play().catch(() => {
        // Audio play failed (user interaction required or other error)
      });
      hasPlayedRef.current = true; // Don't play again until next message
    }
    
    // Reset for the next message
    if (!isTyping) {
      hasPlayedRef.current = false;
    }
  }, [isTyping, soundEnabled]);
}

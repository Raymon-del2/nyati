'use client';

interface CursorProps {
  visible?: boolean;
}

export function Cursor({ visible = true }: CursorProps) {
  if (!visible) return null;
  
  return <span className="nyati-cursor" />;
}

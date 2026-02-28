const KEY_PREFIXES = ['ry_', 'pk_', '01a4_', 'ny_', 'sk_'] as const;
const KEY_LENGTH = 32;

export type KeyPrefix = typeof KEY_PREFIXES[number];

export function generateApiKey(prefix: KeyPrefix = 'ry_'): string {
  const randomPart = generateRandomString(KEY_LENGTH);
  return `${prefix}${randomPart}`;
}

function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export function createKeyHint(fullKey: string): string {
  const prefix = fullKey.substring(0, 4);
  const lastFour = fullKey.substring(fullKey.length - 4);
  return `${prefix}...${lastFour}`;
}

export async function generateSalt(): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  return Array.from(saltBytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashKeyWithSalt(apiKey: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function hashKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Constant-time comparison to prevent timing attacks
export async function constantTimeCompare(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  
  return result === 0;
}

export { KEY_PREFIXES };

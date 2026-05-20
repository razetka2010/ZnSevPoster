import type { SessionUser, UserRole } from '@/types';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function parseJsonPayload(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const headerBytes = base64UrlDecode(headerB64);
  const payloadBytes = base64UrlDecode(payloadB64);
  const signature = base64UrlDecode(signatureB64);

  const headerText = new TextDecoder().decode(headerBytes);
  const header = parseJsonPayload(headerText);
  if (!header || header.alg !== 'HS256') return null;

  const payloadText = new TextDecoder().decode(payloadBytes);
  const payload = parseJsonPayload(payloadText) as Record<string, unknown> | null;
  if (!payload || typeof payload.sub !== 'string') return null;

  if (typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp) {
    return null;
  }

  const secretKey = await crypto.subtle.importKey(
    'raw',
    getSecret(),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify('HMAC', secretKey, signature, signedData);
  if (!valid) return null;

  const id = Number(payload.sub);
  if (!Number.isInteger(id)) return null;

  return {
    id,
    email: String(payload.email ?? ''),
    name: String(payload.name ?? ''),
    role: payload.role as UserRole,
  };
}

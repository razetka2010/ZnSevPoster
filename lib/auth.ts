import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionUser, UserRole } from '@/types';

const COOKIE_NAME = 'znaniesevera_session';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    return {
      id,
      email: String(payload.email),
      name: String(payload.name),
      phone: payload.phone ? String(payload.phone) : undefined,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export async function requireSession(): Promise<SessionUser> {
  try {
    const session = await getSession();
    if (!session) {
      const error = new Error('UNAUTHORIZED');
      console.error('[auth] requireSession failed: no session', {
        name: error.name,
        message: error.message,
      });
      throw error;
    }
    return session;
  } catch (error) {
    console.error('[auth] requireSession error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  try {
    const session = await requireSession();
    if (session.role !== 'admin') {
      const error = new Error('FORBIDDEN');
      console.error('[auth] requireAdmin failed: insufficient role', {
        userId: session.id,
        role: session.role,
        name: error.name,
        message: error.message,
      });
      throw error;
    }
    return session;
  } catch (error) {
    console.error('[auth] requireAdmin error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { verifyUser } from '@/lib/users';
import { jsonError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return jsonError('Введите email и пароль', 400);
    }

    const user = await verifyUser(email, password);
    if (!user) {
      return jsonError('Неверный email или пароль', 401);
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({ user });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    console.error('POST /api/auth/login failed:', error);
    return jsonError('Не удалось войти');
  }
}

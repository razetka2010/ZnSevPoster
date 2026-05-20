import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { createUser } from '@/lib/users';
import { jsonError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');
    const name = String(body?.name ?? '').trim();

    if (!email || !password || !name) {
      return jsonError('Заполните все поля', 400);
    }
    if (password.length < 6) {
      return jsonError('Пароль минимум 6 символов', 400);
    }

    const user = await createUser(email, password, name);
    const token = await createSessionToken(user);
    const response = NextResponse.json({ user });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return jsonError('Email уже зарегистрирован', 409);
    }
    console.error('POST /api/auth/register failed:', error);
    return jsonError('Не удалось зарегистрироваться');
  }
}

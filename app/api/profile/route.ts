import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, requireSession, sessionCookieOptions } from '@/lib/auth';
import { getUserById, updateUserProfile } from '@/lib/users';
import { getErrorMessage, jsonError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getUserById(session.id);
    if (!user) return jsonError('Пользователь не найден', 404);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    console.error('[profile] GET failed:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return jsonError(getErrorMessage(error), 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const email = String(body?.email ?? '').trim();
    const name = String(body?.name ?? '').trim();
    const phone = body?.phone == null ? null : String(body.phone).trim();

    if (!email || !name) {
      return jsonError('Введите имя и email', 400);
    }

    const user = await updateUserProfile(session.id, email, name, phone || null);
    const token = await createSessionToken(user);
    const response = NextResponse.json(user);
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return jsonError('Этот email уже занят', 409);
    }
    console.error('[profile] PUT failed:', {
      userId: error instanceof Error && 'userId' in error ? (error as Error & { userId?: number }).userId : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return jsonError(getErrorMessage(error), 500);
  }
}

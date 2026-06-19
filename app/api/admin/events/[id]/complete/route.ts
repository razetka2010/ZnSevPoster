import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { completeEvent, getEventById } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return jsonError('Некорректный идентификатор мероприятия', 400);
    }
    const event = await getEventById(id);
    if (!event) {
      return jsonError('Событие не найдено', 404);
    }
    if (event.is_completed) {
      return jsonError('Мероприятие уже завершено', 400);
    }
    const completed = await completeEvent(id);
    if (!completed) {
      return jsonError('Не удалось завершить мероприятие', 500);
    }
    return NextResponse.json({ ok: true, event: completed });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return jsonError('Нет прав администратора', 403);
    }
    return jsonError(getErrorMessage(error));
  }
}

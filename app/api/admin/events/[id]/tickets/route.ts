import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getTicketsForEvent } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const eventId = Number(params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return jsonError('Некорректный eventId', 400);
    }
    const tickets = await getTicketsForEvent(eventId);
    return NextResponse.json(tickets);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return jsonError('Нет прав администратора', 403);
    }
    console.error('GET /api/admin/events/[id]/tickets failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

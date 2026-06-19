import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { checkInTicket } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const ticketId = Number(body?.ticketId);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return jsonError('Некорректный ticketId', 400);
    }

    const ticket = await checkInTicket(ticketId);
    if (!ticket) {
      return jsonError('Билет не найден', 404);
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return jsonError('Нет прав администратора', 403);
    }
    console.error('POST /api/admin/tickets/checkin failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

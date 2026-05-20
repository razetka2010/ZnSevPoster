import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createEvent, getEvents } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';
import { parseEventInput } from '@/lib/admin-events';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const events = await getEvents();
    return NextResponse.json(events);
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = parseEventInput(body);
    if (!parsed.ok) {
      return jsonError(parsed.error, 400);
    }

    const event = await createEvent(parsed.input, admin.id);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return jsonError('Нет прав администратора', 403);
    }
    console.error('POST /api/admin/events failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

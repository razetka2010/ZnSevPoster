import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserEvents, toggleUserEvent } from '@/lib/db';
import { getErrorMessage, jsonError, parseEventId } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json([]);
    const favorites = await getUserEvents(session.id, 'favorite');
    return NextResponse.json(favorites);
  } catch (error) {
    console.error('GET /api/favorites failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError('Войдите, чтобы добавить в избранное', 401);

    const body = await request.json();
    const eventId = parseEventId(body?.eventId);
    if (eventId === null) return jsonError('Некорректный eventId', 400);

    const result = await toggleUserEvent(session.id, eventId, 'favorite');
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/favorites failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getEventById, getUserEvents, toggleUserEvent, upsertTicket } from '@/lib/db';
import { getErrorMessage, jsonError, parseEventId } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json([]);
    const going = await getUserEvents(session.id, 'going');
    return NextResponse.json(going);
  } catch (error) {
    console.error('GET /api/going failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError('Войдите, чтобы отметить «Пойду»', 401);

    const body = await request.json();
    const eventId = parseEventId(body?.eventId);
    if (eventId === null) return jsonError('Некорректный eventId', 400);

    const ticketInfo = body?.ticketInfo;
    const event = await getEventById(eventId);
    if (!event) return jsonError('Событие не найдено', 404);

    if (ticketInfo && typeof ticketInfo === 'object') {
      console.info('Registration info:', {
        userId: session.id,
        eventId,
        ticketInfo,
      });

      await upsertTicket(session.id, eventId, ticketInfo, !event.is_free);
      const result = await toggleUserEvent(session.id, eventId, 'going', true);
      return NextResponse.json(result);
    }

    const result = await toggleUserEvent(session.id, eventId, 'going');
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/going failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

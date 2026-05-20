import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return jsonError('Некорректный ID события', 400);
    }

    const event = await getEventById(id);
    if (!event) {
      return jsonError('Событие не найдено', 404);
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('GET /api/events/[id] failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

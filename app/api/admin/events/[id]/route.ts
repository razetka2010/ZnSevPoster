import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteEvent, getEventById, updateEvent } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';
import { parseEventInput } from '@/lib/admin-events';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const event = await getEventById(id);
    if (!event) return jsonError('Событие не найдено', 404);
    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    return jsonError(getErrorMessage(error));
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const body = await request.json();
    const parsed = parseEventInput(body);
    if (!parsed.ok) {
      return jsonError(parsed.error, 400);
    }

    const event = await updateEvent(id, parsed.input);
    if (!event) return jsonError('Событие не найдено', 404);
    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    return jsonError(getErrorMessage(error));
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const id = Number(params.id);
    const ok = await deleteEvent(id);
    if (!ok) return jsonError('Событие не найдено', 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return jsonError('Войдите в аккаунт', 401);
    }
    return jsonError(getErrorMessage(error));
  }
}

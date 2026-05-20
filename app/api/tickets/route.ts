import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTicketsForUser } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json([], { status: 200 });

    const tickets = await getTicketsForUser(session.id);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('GET /api/tickets failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

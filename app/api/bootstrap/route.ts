import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getEvents, getUserEvents } from '@/lib/db';
import { getErrorMessage } from '@/lib/api';
import type { EventFilters } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    const radius = Number(searchParams.get('radius_km'));

    const filters: EventFilters = {
      category: searchParams.get('category') || 'all',
      price_type: (searchParams.get('price_type') as EventFilters['price_type']) || 'all',
      date: (searchParams.get('date') as EventFilters['date']) || 'all',
      ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
      ...(Number.isFinite(radius) && radius > 0 ? { radius_km: radius } : {}),
    };

    const session = await getSession();

    const [events, favorites, going] = await Promise.all([
      getEvents(filters),
      session ? getUserEvents(session.id, 'favorite') : Promise.resolve([]),
      session ? getUserEvents(session.id, 'going') : Promise.resolve([]),
    ]);

    // Расстояние считаем на клиенте — здесь убираем, чтобы не путать
    const eventsWithoutDistance = events.map(({ distance_km: _d, ...e }) => e);

    return NextResponse.json({
      user: session,
      events: eventsWithoutDistance,
      favorites,
      going,
    });
  } catch (error) {
    console.error('GET /api/bootstrap failed:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';
import { getErrorMessage, jsonError } from '@/lib/api';
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

    const events = await getEvents(filters);
    const withoutDistance = events.map(({ distance_km: _d, ...e }) => e);
    return NextResponse.json(withoutDistance);
  } catch (error) {
    console.error('GET /api/events failed:', error);
    return jsonError(getErrorMessage(error));
  }
}

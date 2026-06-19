'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import EventFeed from '@/components/EventFeed';
import Filters from '@/components/Filters';
import LocationPrompt from '@/components/LocationPrompt';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { GeoPosition } from '@/hooks/useGeolocation';
import type { Event, EventFilters, SessionUser, TicketInfo } from '@/types';

const EventMap = dynamic(() => import('@/components/EventMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-white">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
    </div>
  ),
});

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="py-12 text-center" role="status" aria-live="polite">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
}

function buildBootstrapParams(filters: EventFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.price_type) params.set('price_type', filters.price_type);
  if (filters.date) params.set('date', filters.date);
  if (filters.lat != null) params.set('lat', String(filters.lat));
  if (filters.lng != null) params.set('lng', String(filters.lng));
  if (filters.radius_km) params.set('radius_km', String(filters.radius_km));
  return params.toString();
}

function HomeContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const { position, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const [manualPosition, setManualPosition] = useState<GeoPosition | null>(null);
  const positionToUse = manualPosition ?? position;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('manualLocation');
      if (stored) {
        const parsed = JSON.parse(stored) as GeoPosition;
        if (
          parsed?.lat != null &&
          parsed?.lng != null &&
          Number.isFinite(parsed.lat) &&
          Number.isFinite(parsed.lng)
        ) {
          setManualPosition(parsed);
        }
      }
    } catch {
      // ignore invalid storage values
    }
  }, []);

  useEffect(() => {
    if (manualPosition) {
      window.localStorage.setItem('manualLocation', JSON.stringify(manualPosition));
    } else {
      window.localStorage.removeItem('manualLocation');
    }
  }, [manualPosition]);

  const [events, setEvents] = useState<Event[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [going, setGoing] = useState<number[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const fetchIdRef = useRef(0);

  const loadBootstrap = useCallback(async (activeFilters: EventFilters) => {
    const requestId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const qs = buildBootstrapParams(activeFilters);
      const res = await fetch(`/api/bootstrap?${qs}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Не удалось загрузить данные');
      if (requestId !== fetchIdRef.current) return;

      const data = await res.json();
      setEvents(data.events ?? []);
      setFavorites(data.favorites ?? []);
      setGoing(data.going ?? []);
      setUser(data.user ?? null);
    } catch {
      if (requestId !== fetchIdRef.current) return;
      setError('Не удалось загрузить события.');
      setEvents([]);
    } finally {
      if (requestId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (positionToUse) {
      setFilters((prev) => ({
        ...prev,
        lat: positionToUse.lat,
        lng: positionToUse.lng,
        radius_km: prev.radius_km ?? 15,
      }));
    }
  }, [positionToUse]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBootstrap(filters);
    }, 150);
    return () => clearTimeout(timer);
  }, [filters, loadBootstrap]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadBootstrap(filters);
    }, 15000);
    return () => clearInterval(interval);
  }, [filters, loadBootstrap]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase().trim();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  const handleFilterChange = useCallback(
    (next: EventFilters) => {
      setFilters((prev) => ({
        ...next,
        ...(positionToUse
          ? { lat: positionToUse.lat, lng: positionToUse.lng, radius_km: next.radius_km ?? prev.radius_km ?? 15 }
          : {}),
      }));
    },
    [positionToUse]
  );

  const toggleFavorite = async (eventId: number) => {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (res.ok) {
      const favRes = await fetch('/api/favorites');
      if (favRes.ok) setFavorites(await favRes.json());
    }
  };

  const toggleGoing = async (eventId: number, ticketInfo?: TicketInfo) => {
    const res = await fetch('/api/going', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, ticketInfo }),
    });
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setGoing((prev) => {
        if (data?.added) return [...prev, eventId];
        return ticketInfo ? prev : prev.filter((id) => id !== eventId);
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Популярные</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Избранные события</h2>
        </div>
        <Link
          href="/favorites"
          className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)]"
        >
          Все
        </Link>
      </div>

      <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block text-sm text-slate-500">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск мероприятий"
            className="w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <LocationPrompt
        position={position}
        error={geoError}
        loading={geoLoading}
        onRetry={requestLocation}
        onManualPick={(lat, lng) => setManualPosition({ lat, lng })}
        onClearManual={() => setManualPosition(null)}
      />

      <Filters
        onFilterChange={handleFilterChange}
        hasLocation={!!positionToUse}
        locationLat={positionToUse?.lat}
        locationLng={positionToUse?.lng}
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingSpinner message="Загрузка событий..." />
      ) : view === 'map' ? (
        <div className="space-y-6">
          <EventMap
            events={filteredEvents}
            favorites={favorites}
            userPosition={positionToUse}
            radiusKm={filters.radius_km ?? 15}
            onToggleFavorite={toggleFavorite}
          />
          {!positionToUse && (
            <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-gray-700">
              Разрешите геолокацию или выберите местоположение вручную, чтобы увидеть события рядом с вами.
            </div>
          )}
          {filteredEvents.length === 0 ? (
            <p className="py-12 text-center text-gray-600">
              {positionToUse
                ? 'События не найдены в выбранном радиусе. Увеличьте радиус или измените фильтры.'
                : 'Разрешите геолокацию или нажмите «Применить фильтры».'}
            </p>
          ) : (
            <EventFeed
              events={filteredEvents}
              favorites={favorites}
              going={going}
              isLoggedIn={!!user}
              userPosition={position}
              onToggleFavorite={toggleFavorite}
              onToggleGoing={toggleGoing}
              layout="carousel"
            />
          )}
        </div>
      ) : filteredEvents.length === 0 ? (
        <p className="py-12 text-center text-gray-600">
          {position
            ? 'События не найдены в выбранном радиусе. Увеличьте радиус или измените фильтры.'
            : 'Разрешите геолокацию или нажмите «Применить фильтры».'}
        </p>
      ) : (
        <EventFeed
          events={filteredEvents}
          favorites={favorites}
          going={going}
          isLoggedIn={!!user}
          userPosition={position}
          onToggleFavorite={toggleFavorite}
          onToggleGoing={toggleGoing}
          layout="carousel"
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner message="Загрузка..." />}>
      <HomeContent />
    </Suspense>
  );
}

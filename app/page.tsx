'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import EventFeed from '@/components/EventFeed';
import Filters from '@/components/Filters';
import LocationPrompt from '@/components/LocationPrompt';
import { useGeolocation } from '@/hooks/useGeolocation';
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
    <div className="py-12 text-center">
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
    if (position) {
      setFilters((prev) => ({
        ...prev,
        lat: position.lat,
        lng: position.lng,
        radius_km: prev.radius_km ?? 15,
      }));
    }
  }, [position]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBootstrap(filters);
    }, 150);
    return () => clearTimeout(timer);
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

  const handleFilterChange = useCallback((next: EventFilters) => {
    setFilters((prev) => ({
      ...next,
      ...(position
        ? { lat: position.lat, lng: position.lng, radius_km: next.radius_km ?? prev.radius_km ?? 15 }
        : {}),
    }));
  }, [position]);

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
      const goingRes = await fetch('/api/going');
      if (goingRes.ok) setGoing(await goingRes.json());
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-[2rem] border border-[var(--brand-soft)] bg-[var(--brand-soft)] p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--brand-dark)] sm:text-4xl">
              Афиша лучших событий
            </h1>
            <p className="mt-2 text-sm text-[var(--brand-muted)] sm:text-base">
              Найдите мероприятия, фильмы, выставки и лекции рядом с вами.
            </p>
          </div>
          <button
            type="button"
            className="hidden items-center gap-2 rounded-3xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white sm:flex"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
          </button>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <label className="relative block text-sm text-slate-500">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск мероприятий"
              className="w-full rounded-3xl border border-transparent bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </div>

      <LocationPrompt
        position={position}
        error={geoError}
        loading={geoLoading}
        onRetry={requestLocation}
      />

      <Filters
        onFilterChange={handleFilterChange}
        hasLocation={!!position}
        locationLat={position?.lat}
        locationLng={position?.lng}
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingSpinner message="Загрузка событий..." />
      ) : view === 'map' ? (
        <EventMap
          events={filteredEvents}
          favorites={favorites}
          userPosition={position}
          radiusKm={filters.radius_km ?? 15}
          onToggleFavorite={toggleFavorite}
        />
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

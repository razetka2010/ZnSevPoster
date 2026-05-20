'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import EventFeed from '@/components/EventFeed';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Event } from '@/types';

export default function FavoritesPage() {
  const { position } = useGeolocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [going, setGoing] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, favRes, goingRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/favorites'),
        fetch('/api/going'),
      ]);

      if (!eventsRes.ok || !favRes.ok) {
        setEvents([]);
        return;
      }

      const allEvents: Event[] = await eventsRes.json();
      const favIds: number[] = await favRes.json();
      setFavorites(favIds);
      setEvents(allEvents.filter((e) => favIds.includes(e.id)));

      if (goingRes.ok) {
        setGoing(await goingRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = async (eventId: number) => {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) load();
  };

  const toggleGoing = async (eventId: number) => {
    const res = await fetch('/api/going', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) {
      const goingRes = await fetch('/api/going');
      if (goingRes.ok) setGoing(await goingRes.json());
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Избранное</h1>
        <p className="text-gray-600">
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться к ленте
          </Link>
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : events.length === 0 ? (
        <p className="py-12 text-center text-gray-600">
          В избранном пока нет событий. Добавьте их с главной страницы.
        </p>
      ) : (
        <EventFeed
          events={events}
          favorites={favorites}
          going={going}
          isLoggedIn
          userPosition={position}
          onToggleFavorite={toggleFavorite}
          onToggleGoing={toggleGoing}
        />
      )}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import type { Event, TicketInfo } from '@/types';
import { eventDistanceKm, formatDistance } from '@/lib/geo';
import type { GeoPosition } from '@/hooks/useGeolocation';
import { Heart, Calendar, MapPin, DollarSign, Navigation, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EventFeedProps {
  events: Event[];
  favorites: number[];
  going: number[];
  isLoggedIn: boolean;
  userPosition: GeoPosition | null;
  onToggleFavorite: (eventId: number) => void;
  onToggleGoing: (eventId: number, ticketInfo?: TicketInfo) => void;
}

const categoryLabels: Record<Event['category'], string> = {
  concert: 'Концерт',
  exhibition: 'Выставка',
  theater: 'Театр',
  lecture: 'Лекция',
  festival: 'Фестиваль',
};

export default function EventFeed({
  events,
  favorites,
  going,
  isLoggedIn,
  userPosition,
  onToggleFavorite,
  onToggleGoing,
}: EventFeedProps) {
  const eventsWithDistance = useMemo(() => {
    if (!userPosition) return events;
    return events
      .map((event) => ({
        ...event,
        distance_km: eventDistanceKm(
          userPosition.lat,
          userPosition.lng,
          event.latitude,
          event.longitude
        ),
      }))
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
  }, [events, userPosition]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {eventsWithDistance.map((event) => (
        <article
          key={event.id}
          className="flex flex-col overflow-hidden rounded-xl bg-white shadow-lg transition hover:shadow-xl border border-slate-200"
        >
          <Link href={`/events/${event.id}`} className="relative block h-48 overflow-hidden">
            <img
              src={event.images?.[0] || event.image_url}
              alt={event.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {(event.images?.length ?? 0) > 1 && (
              <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                +{event.images.length - 1} фото
              </span>
            )}
            <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-sm text-white">
              {categoryLabels[event.category]}
            </span>
          </Link>

          <div className="flex flex-1 flex-col p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <Link href={`/events/${event.id}`}>
                <h3 className="text-lg font-bold text-[var(--brand-dark)] transition hover:text-[var(--brand)]">
                  {event.title}
                </h3>
              </Link>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(event.id)}
                  className="shrink-0 rounded-full p-1.5 hover:bg-gray-100"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      favorites.includes(event.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                    }`}
                  />
                </button>
              )}
            </div>

            <div className="mb-4 space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{format(new Date(event.date), 'd MMMM yyyy, HH:mm', { locale: ru })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
              {userPosition && event.distance_km != null && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Navigation className="h-4 w-4 shrink-0" />
                  <span>{formatDistance(event.distance_km)} от вас</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span className={event.is_free ? 'font-semibold text-green-600' : ''}>
                  {event.is_free ? 'Бесплатно' : `от $${event.price}`}
                </span>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => onToggleGoing(event.id)}
                  className={`w-full rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                    going.includes(event.id)
                      ? 'bg-green-600 text-white shadow-lg shadow-green-200/50'
                      : 'bg-[var(--brand)] text-white shadow-lg shadow-blue-200/50 hover:bg-blue-700'
                  }`}
                >
                  {going.includes(event.id) ? 'Я иду' : 'Пойду'}
                </button>
              )}
              <Link
                href={`/events/${event.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                Подробнее
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

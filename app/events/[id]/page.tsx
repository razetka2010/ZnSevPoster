'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EventDetailView from '@/components/EventDetailView';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Event, SessionUser, Ticket, TicketInfo } from '@/types';
import { eventDistanceKm } from '@/lib/geo';

export default function EventPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const { position } = useGeolocation();

  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGoing, setIsGoing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!Number.isInteger(eventId)) return;
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) return;
    const { user: sessionUser } = await meRes.json();
    setUser(sessionUser);

    const [favRes, goingRes] = await Promise.all([
      fetch('/api/favorites'),
      fetch('/api/going'),
    ]);
    if (favRes.ok) {
      const favs: number[] = await favRes.json();
      setIsFavorite(favs.includes(eventId));
    }
    if (goingRes.ok) {
      const goings: number[] = await goingRes.json();
      setIsGoing(goings.includes(eventId));
    }

    const ticketsRes = await fetch('/api/tickets', { cache: 'no-store' });
    if (ticketsRes.ok) {
      const tickets: Ticket[] = await ticketsRes.json();
      const eventTicket = tickets.find((ticket) => ticket.event_id === eventId) ?? null;
      setTicket(eventTicket);
      if (eventTicket) setIsGoing(true);
    }
  }, [eventId]);


  useEffect(() => {
    if (!Number.isInteger(eventId) || eventId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error();
        let data: Event = await res.json();
        if (position) {
          data = {
            ...data,
            distance_km: eventDistanceKm(
              position.lat,
              position.lng,
              data.latitude,
              data.longitude
            ),
          };
        }
        setEvent(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
    checkStatus();
  }, [eventId, checkStatus, position]);

  useEffect(() => {
    if (!ticket) return;

    const interval = setInterval(async () => {
      const ticketsRes = await fetch('/api/tickets', { cache: 'no-store' });
      if (!ticketsRes.ok) return;
      const tickets: Ticket[] = await ticketsRes.json();
      const updated = tickets.find((item) => item.event_id === eventId) ?? null;
      if (updated) {
        setTicket(updated);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [eventId, ticket]);

  const toggleFavorite = async () => {
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
      const { added } = await res.json();
      setIsFavorite(added);
    }
  };

  const toggleGoing = async (_eventId: number, ticketInfo?: TicketInfo) => {
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
      const { added } = await res.json();
      setIsGoing(ticketInfo ? true : added);
      if (ticketInfo) {
        const ticketsRes = await fetch('/api/tickets', { cache: 'no-store' });
        if (ticketsRes.ok) {
          const tickets: Ticket[] = await ticketsRes.json();
          setTicket(tickets.find((ticket) => ticket.event_id === eventId) ?? null);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Событие не найдено</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          Вернуться к ленте
        </Link>
      </div>
    );
  }

  return (
    <EventDetailView
      event={event}
      ticket={ticket ?? undefined}
      user={user}
      isFavorite={isFavorite}
      isGoing={isGoing}
      isLoggedIn={!!user}
      onToggleFavorite={toggleFavorite}
      onToggleGoing={toggleGoing}
    />
  );
}

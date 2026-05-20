'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Ticket as TicketType, Event } from '@/types';

export default function EventTicketsPage() {
  const { id } = useParams();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventRes, ticketsRes] = await Promise.all([
          fetch(`/api/admin/events/${id}`, { cache: 'no-store' }),
          fetch(`/api/admin/events/${id}/tickets`, { cache: 'no-store' }),
        ]);

        if (!eventRes.ok) {
          throw new Error('Не удалось получить событие');
        }
        if (!ticketsRes.ok) {
          throw new Error('Не удалось получить билеты');
        }

        setEvent(await eventRes.json());
        setTickets(await ticketsRes.json());
      } catch (err) {
        setError('Ошибка при загрузке данных. Проверьте доступ администратора.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Вернуться в админку
      </Link>

      <div className="mb-8 rounded-[2rem] border border-[var(--brand-soft)] bg-[var(--brand-soft)] p-6">
        <h1 className="text-3xl font-bold text-[var(--brand-dark)]">Билеты события</h1>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">
          {event ? event.title : 'Загрузка информации о мероприятии...'}
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
          Загрузка билетов...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
          По этому событию ещё нет билетов.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Билет #{ticket.id}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{ticket.name}</h2>
                  <p className="text-sm text-slate-600">{ticket.email}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  <Ticket className="h-4 w-4" />
                  {ticket.is_paid ? 'Оплачен' : 'Бесплатный'}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Телефон</p>
                  <p className="mt-1 text-sm text-slate-800">{ticket.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Дата</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {new Date(ticket.created_at).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Событие</p>
                  <p className="mt-1 text-sm text-slate-800">{ticket.event?.title ?? '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

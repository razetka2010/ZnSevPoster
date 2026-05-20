'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Ticket } from '@/types';

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Билет</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{ticket.event?.title ?? 'Зарегистрированное событие'}</h2>
          {ticket.event?.date && (
            <p className="mt-1 text-sm text-slate-600">{new Date(ticket.event.date).toLocaleString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
          )}
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          {ticket.is_paid ? 'Оплачено' : 'Бесплатно'}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Имя</p>
          <p className="mt-1 text-sm text-slate-800">{ticket.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
          <p className="mt-1 text-sm text-slate-800">{ticket.email}</p>
        </div>
        {ticket.phone ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Телефон</p>
            <p className="mt-1 text-sm text-slate-800">{ticket.phone}</p>
          </div>
        ) : null}
        {ticket.event?.venue ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Локация</p>
            <p className="mt-1 text-sm text-slate-800">{ticket.event.venue}</p>
          </div>
        ) : null}
      </div>

      {ticket.event ? (
        <Link
          href={`/events/${ticket.event.id}`}
          className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Перейти к событию
        </Link>
      ) : null}
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tickets', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Не удалось загрузить билеты');
        }
        const data = await res.json();
        setTickets(data ?? []);
      } catch (error) {
        setError('Ошибка при загрузке билетов. Попробуйте ещё раз.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-[var(--brand-soft)] bg-[var(--brand-soft)] p-6">
        <h1 className="text-3xl font-bold text-[var(--brand-dark)] sm:text-4xl">Мои билеты</h1>
        <p className="mt-3 text-base text-[var(--brand-muted)]">
          Сохранённые регистрации на события. Здесь будут отображаться ваши активные билеты.
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
          У вас ещё нет билетов. Отметьте «Пойду» на понравившемся событии, чтобы он появился здесь.
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Plus, Pencil, Ticket, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Event } from '@/types';

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setActionError(null);
    const [eventsRes, statusRes] = await Promise.all([
      fetch('/api/admin/events', { cache: 'no-store' }),
      fetch('/api/db-status'),
    ]);
    if (statusRes.ok) {
      const status = await statusRes.json();
      setMockMode(Boolean(status.useMockData));
    }
    if (eventsRes.ok) {
      setEvents(await eventsRes.json());
    } else {
      const data = await eventsRes.json().catch(() => ({}));
      setActionError(data.error || 'Не удалось загрузить список');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это мероприятие?')) return;
    setActionError(null);
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await load();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setActionError(data.error || 'Не удалось удалить');
  };

  const handleComplete = async (id: number) => {
    if (!confirm('Отметить мероприятие как завершённое? Это удалит все связанные билеты.')) return;
    setActionError(null);
    const res = await fetch(`/api/admin/events/${id}/complete`, { method: 'POST' });
    if (res.ok) {
      await load();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setActionError(data.error || 'Не удалось завершить мероприятие');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
          <p className="text-gray-600">Управление мероприятиями</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/tickets/scan"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-slate-700 transition hover:bg-slate-50"
          >
            <Ticket className="h-5 w-5" />
            Проверить билет
          </Link>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Создать мероприятие
          </Link>
        </div>
      </div>

      {mockMode && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Демо-режим: данные сохраняются в файл <code>data/mock-db.json</code>. Для постоянной
          базы уберите <code>USE_MOCK_DATA</code> из .env.local и выполните{' '}
          <code>npm run db:init</code>.
        </p>
      )}

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
      )}

      {loading ? (
        <p className="text-gray-600">Загрузка...</p>
      ) : events.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-gray-600 shadow-sm">
          Мероприятий пока нет. Создайте первое.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Название</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Место</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{event.title}</td>
                  <td className="px-4 py-3">
                    {format(new Date(event.date), 'd MMM yyyy', { locale: ru })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{event.venue}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {event.is_completed ? 'Завершено' : 'Активно'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/tickets`}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-50"
                      >
                        <Ticket className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleComplete(event.id)}
                        className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        title="Завершить мероприятие"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

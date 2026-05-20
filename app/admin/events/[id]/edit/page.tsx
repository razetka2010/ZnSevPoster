'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminEventForm from '@/components/admin/AdminEventForm';
import type { Event } from '@/types';

export default function EditEventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => r.json())
      .then(setEvent);
  }, [id]);

  if (!event) {
    return <p className="p-8 text-center text-gray-600">Загрузка...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Редактировать мероприятие</h1>
      <AdminEventForm initial={event} submitLabel="Сохранить изменения" />
    </div>
  );
}

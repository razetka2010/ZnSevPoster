'use client';

import { useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Calendar, MapPin, DollarSign, Heart, Users, ArrowLeft, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Event, TicketInfo } from '@/types';
import EventGallery from '@/components/EventGallery';
import { formatDistance } from '@/lib/geo';

const EventLocationMap = dynamic(() => import('@/components/EventLocationMap'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-gray-100" />,
});

const categoryLabels: Record<Event['category'], string> = {
  concert: 'Концерт',
  exhibition: 'Выставка',
  theater: 'Театр',
  lecture: 'Лекция',
  festival: 'Фестиваль',
};

interface EventDetailViewProps {
  event: Event;
  isFavorite: boolean;
  isGoing: boolean;
  isLoggedIn: boolean;
  onToggleFavorite: () => void;
  onToggleGoing: (eventId: number, ticketInfo?: TicketInfo) => Promise<void>;
}

export default function EventDetailView({
  event,
  isFavorite,
  isGoing,
  isLoggedIn,
  onToggleFavorite,
  onToggleGoing,
}: EventDetailViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;

  const handleInputChange = (field: keyof TicketInfo, value: string) => {
    setTicketInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegistration = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!ticketInfo.name.trim() || !ticketInfo.email.trim()) {
      setErrorMessage('Укажите имя и email для регистрации.');
      return;
    }

    setSubmitting(true);
    try {
      await onToggleGoing(event.id, ticketInfo);
      setStatusMessage(
        event.is_free
          ? 'Вы успешно зарегистрированы на бесплатное событие. Подтверждение отправлено на email.'
          : 'Спасибо! Ссылка на оплату будет отправлена на email сразу после оформления заказа.'
      );
    } catch {
      setErrorMessage('Не удалось оформить запись. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к ленте
      </Link>

      <article className="overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="relative">
          <EventGallery images={event.images} title={event.title} />
          <span className="absolute left-4 top-4 z-10 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
            {categoryLabels[event.category]}
          </span>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{event.title}</h1>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Дата и время</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(event.date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Место</p>
                <p className="font-medium text-gray-900">{event.venue}</p>
                {event.address && <p className="text-sm text-gray-600">{event.address}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
              <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Стоимость</p>
                <p className={`font-medium ${event.is_free ? 'text-green-600' : 'text-gray-900'}`}>
                  {event.is_free ? 'Бесплатно' : `от $${event.price}`}
                </p>
              </div>
            </div>
            {event.distance_km != null && (
              <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Расстояние</p>
                  <p className="font-medium text-gray-900">
                    {formatDistance(event.distance_km)} от вас
                  </p>
                </div>
              </div>
            )}
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">О событии</h2>
            <p className="whitespace-pre-line leading-relaxed text-gray-700">{event.description}</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">На карте</h2>
            <EventLocationMap
              latitude={event.latitude}
              longitude={event.longitude}
              title={event.title}
            />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
            >
              <Navigation className="h-4 w-4" />
              Построить маршрут
            </a>
          </section>

          <div className="flex flex-wrap gap-4 border-t pt-6">
            {!isLoggedIn ? (
              <p className="text-sm text-gray-600">
                <Link href="/login" className="text-[var(--brand)] hover:underline">
                  Войдите
                </Link>
                , чтобы добавить в избранное или заполнить форму «Пойду»
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  className={`flex items-center gap-2 rounded-lg px-6 py-3 transition ${
                    isFavorite
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-[var(--brand-soft)] text-[var(--brand-dark)] hover:bg-[var(--brand)] hover:text-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-white' : ''}`} />
                  {isFavorite ? 'В избранном' : 'В избранное'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-lg px-6 py-3 transition ${
                    isGoing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  {isGoing ? 'Изменить заявку' : 'Пойду'}
                </button>
              </>
            )}
          </div>

          {showForm && (
            <div className="mt-6 rounded-3xl border border-[var(--brand-soft)] bg-[var(--brand-soft)] p-6">
              <h3 className="mb-4 text-lg font-semibold text-[var(--brand-dark)]">
                {event.is_free ? 'Форма регистрации' : 'Оформление билета'}
              </h3>

              {statusMessage && (
                <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
                  {statusMessage}
                </div>
              )}
              {errorMessage && (
                <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleRegistration} className="grid gap-4">
                <label className="space-y-2 text-sm text-[var(--brand-dark)]">
                  <span className="font-medium">Имя</span>
                  <input
                    type="text"
                    value={ticketInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
                    placeholder="ФИО"
                  />
                </label>

                <label className="space-y-2 text-sm text-[var(--brand-dark)]">
                  <span className="font-medium">Email</span>
                  <input
                    type="email"
                    value={ticketInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
                    placeholder="example@mail.com"
                  />
                </label>

                <label className="space-y-2 text-sm text-[var(--brand-dark)]">
                  <span className="font-medium">Телефон</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={ticketInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
                    placeholder="+7 (999) 123-45-67"
                  />
                  <p className="text-xs text-slate-500">Укажите номер телефона для связи и отправки информации о билете.</p>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white transition ${
                    event.is_free
                      ? 'bg-[var(--brand-success)] hover:bg-[#276849]'
                      : 'bg-[var(--brand)] hover:bg-[var(--brand-dark)]'
                  } ${submitting ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  {event.is_free ? 'Зарегистрироваться' : 'Купить билет'}
                </button>

                <p className="text-sm text-[var(--brand-muted)]">
                  {event.is_free
                    ? 'Для бесплатных событий достаточно заполнить форму, мы пришлем подтверждение на email.'
                    : 'После оформления вы получите ссылку на оплату и электронный билет в письме.'}
                </p>
              </form>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

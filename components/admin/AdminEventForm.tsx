'use client';

import { FormEvent, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import type { Event, EventCategory } from '@/types';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const categories: { value: EventCategory; label: string }[] = [
  { value: 'concert', label: 'Концерт' },
  { value: 'exhibition', label: 'Выставка' },
  { value: 'theater', label: 'Театр' },
  { value: 'lecture', label: 'Лекция' },
  { value: 'festival', label: 'Фестиваль' },
];

interface AdminEventFormProps {
  initial?: Event;
  submitLabel: string;
}

export default function AdminEventForm({ initial, submitLabel }: AdminEventFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<EventCategory>(initial?.category ?? 'concert');
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [date, setDate] = useState(
    initial?.date ? new Date(initial.date).toISOString().slice(0, 16) : ''
  );
  const [isFree, setIsFree] = useState(initial?.is_free ?? false);
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [images, setImages] = useState<string[]>(
    initial?.images?.length ? initial.images : initial?.image_url ? [initial.image_url] : []
  );
  const [latitude, setLatitude] = useState<number | null>(initial?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initial?.longitude ?? null);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
    return data.url as string;
  };

  const handleImagesUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadFile(file));
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить изображения');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addImageUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setImages((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      setError('Добавьте хотя бы одно фото');
      return;
    }
    if (!date) {
      setError('Укажите дату и время');
      return;
    }
    if (latitude == null || longitude == null) {
      setError('Кликните по карте, чтобы указать место проведения');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      description,
      category,
      venue,
      address,
      date,
      is_free: isFree,
      price: isFree ? 0 : Number(price),
      image_url: images[0],
      images,
      latitude,
      longitude,
    };

    try {
      const url = initial ? `/api/admin/events/${initial.id}` : '/api/admin/events';
      const method = initial ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Название</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            className="w-full rounded-lg border px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Описание</label>
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Площадка</label>
          <input
            required
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Адрес</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Дата и время</label>
          <input
            required
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
            Бесплатно
          </label>
        </div>
        {!isFree && (
          <div>
            <label className="mb-1 block text-sm font-medium">Цена ($)</label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Фотографии (можно несколько)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => {
            handleImagesUpload(e.target.files);
            e.target.value = '';
          }}
          className="mb-2 block w-full text-sm"
        />
        {uploading && <p className="text-sm text-gray-500">Загрузка...</p>}

        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((url, index) => (
              <div key={`${url}-${index}`} className="relative">
                <img src={url} alt={`Фото ${index + 1}`} className="h-28 w-full rounded-lg object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                    Обложка
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="Удалить фото"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <UrlAdder onAdd={addImageUrl} />
      </div>

      <MapPicker
        latitude={latitude}
        longitude={longitude}
        onChange={(lat, lng) => {
          setLatitude(lat);
          setLongitude(lng);
          setError(null);
        }}
      />

      {latitude != null && longitude != null && (
        <p className="text-sm text-green-700">✓ Место на карте выбрано</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Сохранение...' : submitLabel}
      </button>
    </form>
  );
}

function UrlAdder({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState('');
  return (
    <div className="mt-2 flex gap-2">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="или вставьте URL изображения"
        className="flex-1 rounded-lg border px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => {
          onAdd(url);
          setUrl('');
        }}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
      >
        Добавить
      </button>
    </div>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import type { Event, EventCategory } from '@/types';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

import SafeImage from '../SafeImage';

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
  const [fileUploadStatus, setFileUploadStatus] = useState<{
    [fileName: string]: { progress: number; status: 'uploading' | 'success' | 'error'; error?: string }
  }>({});

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<EventCategory>(initial?.category ?? 'concert');
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [date, setDate] = useState(
    initial?.date ? new Date(initial.date).toISOString().slice(0, 16) : ''
  );
  const [images, setImages] = useState<string[]>(
    initial?.images?.length ? initial.images : initial?.image_url ? [initial.image_url] : []
  );
  const [latitude, setLatitude] = useState<number | null>(initial?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initial?.longitude ?? null);

  const uploadFile = async (
    file: File,
    retries = 3,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name}: допустимы только изображения`);
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`${file.name}: максимальный размер 5 МБ`);
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('file', file);

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                if (data.url) {
                  resolve(data.url);
                } else {
                  reject(new Error('Сервер не вернул URL файла'));
                }
              } catch {
                reject(new Error('Некорректный ответ сервера'));
              }
            } else {
              let errorMsg = `Ошибка загрузки (статус ${xhr.status})`;
              try {
                const data = JSON.parse(xhr.responseText);
                errorMsg = data.error || errorMsg;
              } catch {}
              reject(new Error(errorMsg));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Ошибка сети при загрузке')));
          xhr.addEventListener('abort', () => reject(new Error('Загрузка отменена')));

          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });

        return url;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError || new Error('Не удалось загрузить файл после нескольких попыток');
  };

  const handleImagesUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    const fileArray = Array.from(files);
    const maxFiles = 10;
    if (fileArray.length > maxFiles) {
      setError(`Максимум ${maxFiles} файлов одновременно`);
      return;
    }

    setUploading(true);
    setError(null);
    const uploaded: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setFileUploadStatus((prev) => ({
        ...prev,
        [file.name]: { progress: 0, status: 'uploading' },
      }));

      try {
        const url = await uploadFile(
          file,
          3,
          (progress) => {
            setFileUploadStatus((prev) => ({
              ...prev,
              [file.name]: { ...prev[file.name], progress },
            }));
          }
        );
        uploaded.push(url);
        setFileUploadStatus((prev) => ({
          ...prev,
          [file.name]: { progress: 100, status: 'success' },
        }));
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Неизвестная ошибка';
        setFileUploadStatus((prev) => ({
          ...prev,
          [file.name]: { progress: 0, status: 'error', error: errorMsg },
        }));
        setError(`Ошибка при загрузке ${file.name}: ${errorMsg}`);
      }
    }

    if (uploaded.length > 0) {
      setImages((prev) => [...prev, ...uploaded]);
    }

    setUploading(false);
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
      is_free: true,
      price: 0,
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
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error || `Ошибка сервера (${res.status})`;
        throw new Error(errorMsg);
      }

      const data = await res.json();
      if (!data.id) {
        throw new Error('Сервер не вернул ID мероприятия');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Превышено время ожидания. Проверьте интернет и попробуйте снова');
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка при сохранении мероприятия');
      }
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

      <div className="grid gap-4 md:grid-cols-2">
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
        <div className="flex items-end text-green-600">
          <span className="text-sm font-medium">Мероприятие бесплатное</span>
        </div>
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

        {Object.entries(fileUploadStatus).length > 0 && (
          <div className="mb-3 space-y-2">
            {Object.entries(fileUploadStatus).map(([fileName, status]) => (
              <div key={fileName} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-gray-700">{fileName}</span>
                  {status.status === 'uploading' && (
                    <span className="text-sm text-blue-600">{status.progress}%</span>
                  )}
                  {status.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {status.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                {status.status === 'uploading' && (
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                )}
                {status.status === 'error' && status.error && (
                  <p className="mt-1 text-sm text-red-600">{status.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((url, index) => (
              <div key={`${url}-${index}`} className="relative">
                <SafeImage src={url} alt={`Фото ${index + 1}`} className="h-28 w-full rounded-lg object-cover" />
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
        disabled={saving || uploading}
        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Сохранение...' : uploading ? 'Загрузка файлов...' : submitLabel}
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

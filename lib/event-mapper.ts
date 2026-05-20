import type { Event } from '@/types';
import { normalizeCoordinates } from '@/lib/geo';

type EventRow = Record<string, unknown>;

export function parseImages(value: unknown, fallbackUrl?: string): string[] {
  if (Array.isArray(value)) {
    const urls = value.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
    if (urls.length > 0) return urls;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parseImages(parsed);
    } catch {
      /* ignore */
    }
  }
  if (fallbackUrl) return [fallbackUrl];
  return [];
}

export function mapEventRow(row: EventRow): Event {
  const image_url = String(row.image_url ?? '');
  const images = parseImages(row.images, image_url);
  const cover = images[0] || image_url;
  const coords = normalizeCoordinates(Number(row.latitude), Number(row.longitude));

  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description),
    category: row.category as Event['category'],
    date: new Date(row.date as string | Date).toISOString(),
    price: Number(row.price),
    is_free: Boolean(row.is_free),
    latitude: coords.lat,
    longitude: coords.lng,
    venue: String(row.venue),
    address: row.address != null ? String(row.address) : null,
    image_url: cover,
    images: images.length > 0 ? images : cover ? [cover] : [],
    created_at: new Date(row.created_at as string | Date).toISOString(),
  };
}

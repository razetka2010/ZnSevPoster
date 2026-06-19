import type { EventCategory, EventInput } from '@/types';
import { normalizeCoordinates } from '@/lib/geo';
import { normalizeImageList } from '@/lib/images';

const VALID_CATEGORIES: EventCategory[] = [
  'concert',
  'exhibition',
  'theater',
  'lecture',
  'festival',
];

export type ParseEventResult =
  | { ok: true; input: EventInput }
  | { ok: false; error: string };

export function parseEventInput(body: Record<string, unknown>): ParseEventResult {
  const missing: string[] = [];

  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const venue = String(body.venue ?? '').trim();
  const date = String(body.date ?? '').trim();
  const category = String(body.category ?? '').trim() as EventCategory;

  let images: string[] = [];
  if (Array.isArray(body.images)) {
    images = body.images
      .map((u) => String(u).trim())
      .filter(Boolean);
  }
  const image_url = String(body.image_url ?? '').trim();
  images = normalizeImageList(images, image_url);

  if (!title) missing.push('название');
  if (!description) missing.push('описание');
  if (!venue) missing.push('площадку');
  if (!date) missing.push('дату');
  if (images.length === 0) missing.push('хотя бы одно фото');

  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    missing.push('место на карте (кликните по карте)');
  }

  if (!VALID_CATEGORIES.includes(category)) {
    missing.push('категорию');
  }

  if (missing.length > 0) {
    return { ok: false, error: `Заполните: ${missing.join(', ')}` };
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return { ok: false, error: 'Некорректная дата' };
  }

  const coords = normalizeCoordinates(lat, lng);
  const is_free = true;
  const price = 0;

  return {
    ok: true,
    input: {
      title,
      description,
      category,
      date: parsedDate.toISOString(),
      price,
      is_free,
      latitude: coords.lat,
      longitude: coords.lng,
      venue,
      address: String(body.address ?? '').trim() || undefined,
      image_url: images[0],
      images,
    },
  };
}

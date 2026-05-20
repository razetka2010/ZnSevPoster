const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Исправляет перепутанные lat/lng (частая ошибка при вводе) */
export function normalizeCoordinates(
  lat: number,
  lng: number
): { lat: number; lng: number } {
  let a = Number(lat);
  let b = Number(lng);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return { lat: 0, lng: 0 };
  }

  // Явно перепутаны (широта не может быть > 90)
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
    [a, b] = [b, a];
  }

  // Для Украины/Восточной Европы: широта ~44–53, долгота ~22–41
  // Если значения похожи на перепутанные — меняем местами
  const looksLikeSwappedUa =
    a >= 20 && a <= 45 && b >= 45 && b <= 65 && a < b;
  if (looksLikeSwappedUa) {
    [a, b] = [b, a];
  }

  return { lat: a, lng: b };
}

export function eventDistanceKm(
  userLat: number,
  userLng: number,
  eventLat: number,
  eventLng: number
): number {
  const user = normalizeCoordinates(userLat, userLng);
  const event = normalizeCoordinates(eventLat, eventLng);
  return haversineKm(user.lat, user.lng, event.lat, event.lng);
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '';
  if (km < 1) return `${Math.round(km * 1000)} м`;
  if (km < 10) return `${km.toFixed(1)} км`;
  return `${Math.round(km)} км`;
}

export function withDistance<T extends { latitude: number; longitude: number }>(
  items: T[],
  lat: number,
  lng: number
): (T & { distance_km: number })[] {
  return items
    .map((item) => ({
      ...item,
      distance_km: eventDistanceKm(lat, lng, item.latitude, item.longitude),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);
}

export function filterByRadius<T extends { distance_km?: number }>(
  items: T[],
  radiusKm: number
): T[] {
  return items.filter((item) => (item.distance_km ?? 0) <= radiusKm);
}

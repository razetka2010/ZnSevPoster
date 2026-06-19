export function normalizeUploadUrl(url: string): string {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('/uploads/')) {
    return trimmed.replace(/^\/uploads\//, '/api/uploads/');
  }
  if (trimmed.startsWith('uploads/')) {
    return trimmed.replace(/^uploads\//, '/api/uploads/');
  }
  return trimmed;
}

export function normalizeImageList(images: string[], cover?: string): string[] {
  const list = images
    .map(normalizeUploadUrl)
    .filter((u) => u && u.trim());
  if (cover && cover.trim()) {
    const normalizedCover = normalizeUploadUrl(cover);
    if (normalizedCover && !list.includes(normalizedCover)) {
      list.unshift(normalizedCover);
    }
  }
  return Array.from(new Set(list));
}

export function primaryImage(images: string[], fallback = ''): string {
  return images[0] || fallback;
}

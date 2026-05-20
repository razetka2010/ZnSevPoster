export function normalizeImageList(images: string[], cover?: string): string[] {
  const list = [...images.filter((u) => u && u.trim())];
  if (cover && cover.trim() && !list.includes(cover)) {
    list.unshift(cover.trim());
  }
  return Array.from(new Set(list));
}

export function primaryImage(images: string[], fallback = ''): string {
  return images[0] || fallback;
}

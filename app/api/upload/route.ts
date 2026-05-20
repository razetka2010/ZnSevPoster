import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireAdmin } from '@/lib/auth';
import { jsonError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return jsonError('Доступ запрещён', 403);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return jsonError('Файл не выбран', 400);
    }

    if (!file.type.startsWith('image/')) {
      return jsonError('Допустимы только изображения', 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError('Максимальный размер файла 5 МБ', 400);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowed.includes(ext)) {
      return jsonError('Недопустимый формат изображения', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('POST /api/upload failed:', error);
    return jsonError('Не удалось загрузить файл');
  }
}

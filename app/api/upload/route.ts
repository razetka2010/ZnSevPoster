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

    if (!file.name) {
      return jsonError('Имя файла отсутствует', 400);
    }

    if (!file.type.startsWith('image/')) {
      return jsonError('Допустимы только изображения', 400);
    }

    if (file.size === 0) {
      return jsonError('Файл пуст', 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError('Максимальный размер файла 5 МБ', 400);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowed.includes(ext)) {
      return jsonError(`Недопустимый формат: .${ext}. Допустимые: jpg, jpeg, png, webp, gif`, 400);
    }

    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } catch (e) {
      return jsonError('Ошибка при чтении файла', 400);
    }

    if (buffer.length === 0) {
      return jsonError('Файл поврежден или пуст', 400);
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads');

    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      console.error('Failed to create uploads directory:', e);
      return jsonError('Ошибка при создании директории', 500);
    }

    try {
      await writeFile(join(uploadsDir, filename), buffer);
    } catch (e) {
      console.error('Failed to write file:', e);
      return jsonError('Ошибка при сохранении файла на диск', 500);
    }

    return NextResponse.json(
      { url: `/api/uploads/${filename}` },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/upload failed:', error);
    return jsonError('Внутренняя ошибка при загрузке файла', 500);
  }
}

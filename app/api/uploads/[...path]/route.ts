import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, normalize } from 'path';

const uploadsDir = join(process.cwd(), 'public', 'uploads');
const mimeTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const pathParts = params.path;
  if (!pathParts || pathParts.length === 0) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }

  const filePath = normalize(join(uploadsDir, ...pathParts));
  if (!filePath.startsWith(uploadsDir)) {
    return NextResponse.json({ error: 'Недопустимый путь' }, { status: 400 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    const file = await readFile(filePath);
    const ext = pathParts[pathParts.length - 1].split('.').pop()?.toLowerCase() ?? '';
    const contentType = mimeTypes[ext] ?? 'application/octet-stream';
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return new NextResponse(file, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }
}

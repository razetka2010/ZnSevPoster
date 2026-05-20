import { NextResponse } from 'next/server';

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function parseEventId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Неизвестная ошибка';
  }

  const err = error as { code?: string; message?: string };

  if (err.code === '42P01') {
    return 'Таблицы не созданы. Выполните: npm run db:init';
  }
  if (
    err.code === 'ENOTFOUND' ||
    err.code === 'EAI_AGAIN' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT'
  ) {
    return 'Нет связи с базой данных. Проверьте интернет и DATABASE_URL в .env.local';
  }
  if (err.message?.includes('DATABASE_URL')) {
    return 'Укажите DATABASE_URL в файле .env.local';
  }

  return err.message || 'Неизвестная ошибка';
}

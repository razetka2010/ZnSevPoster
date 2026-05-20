import { NextResponse } from 'next/server';
import { useMockData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    useMockData: useMockData(),
    hint: useMockData()
      ? 'Данные в демо-режиме. Уберите USE_MOCK_DATA=true из .env.local и выполните npm run db:init для постоянной БД.'
      : 'Подключена база данных PostgreSQL.',
  });
}

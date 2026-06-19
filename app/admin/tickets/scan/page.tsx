'use client';

import { useState } from 'react';
import TicketScanner from '@/components/TicketScanner';
import { CheckCircle2, XCircle } from 'lucide-react';

type StatusType = 'success' | 'error' | 'neutral';

export default function AdminTicketScanPage() {
  const [status, setStatus] = useState<string>('Наведите камеру на QR-код билета');
  const [statusType, setStatusType] = useState<StatusType>('neutral');
  const [ticketInfo, setTicketInfo] = useState<{ id: number; name: string; email: string } | null>(null);

  const handleScan = async (ticketId: number) => {
    setStatus('Проверка билета...');
    setStatusType('neutral');
    const res = await fetch('/api/admin/tickets/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || 'Не удалось подтвердить билет.');
      setStatusType('error');
      setTicketInfo(null);
      return;
    }

    const data = await res.json();
    setTicketInfo({
      id: data.ticket.id,
      name: data.ticket.name,
      email: data.ticket.email,
    });
    setStatus(`Билет #${ticketId} подтверждён.`);
    setStatusType('success');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 rounded-[2rem] border border-[var(--brand-soft)] bg-[var(--brand-soft)] p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-[var(--brand-dark)]">Сканер билетов</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--brand-muted)]">
          Наведите камеру на QR-код билета участника. Система автоматически подтвердит вход и покажет информацию о билете.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <div
            className={`rounded-[2rem] border p-6 shadow-sm transition ${
              statusType === 'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-900'
                : statusType === 'error'
                ? 'border-rose-100 bg-rose-50 text-rose-900'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/80 text-xl shadow-sm">
                {statusType === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-lg font-semibold">
                  {statusType === 'success' ? 'Билет подтверждён' : statusType === 'error' ? 'Ошибка сканирования' : 'Готов к сканированию'}
                </p>
                <p className="mt-2 text-sm text-slate-600">{status}</p>
              </div>
            </div>

            {ticketInfo && statusType === 'success' && (
              <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold">Данные билета</p>
                <p className="mt-3">Имя: {ticketInfo.name}</p>
                <p>Email: {ticketInfo.email}</p>
                <p>Номер билета: #{ticketInfo.id}</p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Инструкция</h2>
            <p className="text-sm text-slate-600">Поднесите экран с QR-кодом билета к камере. Система сама определит код и подаст подтверждение.</p>
            <p className="mt-3 text-sm text-slate-500">Если сканер не видит QR, попробуйте немного отодвинуть экран и стабилизировать изображение.</p>
          </div>
        </div>

        <TicketScanner onScan={handleScan} />
      </div>
    </div>
  );
}

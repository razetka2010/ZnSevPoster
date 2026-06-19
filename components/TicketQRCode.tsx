'use client';

import QRCode from 'react-qr-code';

interface TicketQRCodeProps {
  ticketId: number;
  eventTitle: string;
}

export default function TicketQRCode({ ticketId, eventTitle }: TicketQRCodeProps) {
  const qrValue = `ticket:${ticketId}`;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
        QR код для входа
      </p>
      <div className="mx-auto w-fit rounded-[2rem] bg-slate-100 p-5 shadow-inner">
        <QRCode value={qrValue} size={192} bgColor="#ffffff" fgColor="#111827" />
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-600">
        Покажите этот QR на входе. Он привязан к билету на событие «{eventTitle}».
        <br />
        Для быстрого прохода сохраните скриншот или откройте страницу с билетом прямо на телефоне.
      </p>
    </div>
  );
}

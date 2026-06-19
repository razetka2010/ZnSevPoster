'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface TicketScannerProps {
  onScan: (ticketId: number) => Promise<void>;
}

export default function TicketScanner({ onScan }: TicketScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [message, setMessage] = useState('Наведите камеру на QR-код билета');
  const [loading, setLoading] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [lastScanned, setLastScanned] = useState<number | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      } catch (error) {
        setMessage('Не удалось получить доступ к камере. Проверьте разрешения.');
      }
    };

    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let rafId: number;
    let isProcessing = false;

    const scanFrame = () => {
      if (scanLocked || isProcessing) {
        rafId = requestAnimationFrame(scanFrame);
        return;
      }

      if (!videoRef.current || !canvasRef.current) {
        rafId = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        rafId = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        const match = code.data.match(/^ticket:(\d+)$/);
        if (match) {
          const ticketId = Number(match[1]);
          if (ticketId === lastScanned) {
            rafId = requestAnimationFrame(scanFrame);
            return;
          }

          setLoading(true);
          setScanLocked(true);
          isProcessing = true;
          setLastScanned(ticketId);
          setMessage('QR найден. Проверка билета...');

          onScan(ticketId)
            .catch(() => setMessage('Ошибка при проверке билета.'))
            .finally(() => {
              setLoading(false);
              setScanLocked(false);
              isProcessing = false;
              setTimeout(() => setLastScanned(null), 3000);
            });
        } else {
          setMessage('Неверный формат QR. Покажите QR билета.');
        }
      }

      rafId = requestAnimationFrame(scanFrame);
    };

    rafId = requestAnimationFrame(scanFrame);
    return () => cancelAnimationFrame(rafId);
  }, [lastScanned, onScan, scanLocked]);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-inner">
        <video ref={videoRef} className="h-72 w-full object-cover" muted playsInline />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Сканирование</p>
            <p className="mt-1 text-sm text-slate-600">Держите QR-код в центре кадра.</p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${loading ? 'bg-[var(--brand-soft)] text-[var(--brand-dark)]' : 'bg-slate-100 text-slate-600'}`}>
            {loading ? 'Проверка...' : 'Готово'}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
      </div>
      {loading && (
        <div className="mt-4 rounded-3xl bg-[var(--brand-soft)] px-4 py-3 text-sm font-semibold text-[var(--brand-dark)]">
          Сканирование и подтверждение...
        </div>
      )}
    </div>
  );
}

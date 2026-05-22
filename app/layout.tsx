import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Знание Севера Афиша — городской афишный гид',
  description:
    'ЗС Афиша помогает находить лучшие мероприятия Северо-Запада: концерты, выставки, спектакли и мастер-классы',
  metadataBase: new URL('https://znaniesevera.vercel.app'),
  alternates: {
    canonical: 'https://znaniesevera.vercel.app',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Знание Севера Афиша',
    description:
      'Официальный городской гид по событиям Северо-Запада: концерты, выставки, театры и лекции.',
    url: 'https://znaniesevera.vercel.app',
    siteName: 'Знание Севера Афиша',
    type: 'website',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Знание Севера Афиша — афиша Северо-Запада',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Знание Севера Афиша',
    description:
      'Официальный городской гид по событиям Северо-Запада: концерты, выставки, театры и лекции.',
    images: ['/og-image.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <Navbar />
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-0">{children}</main>
      </body>
    </html>
  );
}

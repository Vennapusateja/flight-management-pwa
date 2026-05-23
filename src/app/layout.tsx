import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { InstallPrompt } from '@/components/layout/InstallPrompt';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: {
    template: '%s | SourceAsia Air',
    default:  'SourceAsia Air — Book Flights',
  },
  description: 'Book flights, manage bookings, and select seats in real time.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-grow flex flex-col">
            {children}
          </div>
          <Footer />
          <InstallPrompt />
        </div>
      </body>
    </html>
  );
}

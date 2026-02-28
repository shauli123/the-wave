import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AlertProvider } from '@/context/AlertContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Silent Wave | גל שקט – HFC Alert Dashboard',
  description: 'Real-time Home Front Command alert monitoring and situational awareness dashboard for Israel.',
  keywords: ['HFC alerts', 'Israel alerts', 'Pikud Haoref', 'Home Front Command', 'real-time', 'missile alerts'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased bg-[#070b14] text-white overflow-hidden`}>
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}

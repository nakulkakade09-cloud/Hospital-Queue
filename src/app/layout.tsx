import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Journey Queue | Smart Rural Hospital Queue Management',
  description: 'Single QR-based token and unified journey tracker for rural and government hospitals. Features parallel scheduling, auto-handoff, and specialist visiting calendars.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr">
      <head>
        <meta name="theme-color" content="#0E7490" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="bg-slate-900 text-slate-300 py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-bold text-white text-base">
                जर्नी क्यू (Journey Queue) • शांत व सुलभ आरोग्य सेवा
              </p>
              <p className="text-slate-400 text-xs mt-1">
                ग्रामीण आणि उपजिल्हा रुग्णालयांसाठी विशेष विकसित • स्मार्ट पॅरालेल शेड्युलिंग तंत्रज्ञान
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
              <span>आपत्कालीन १०८</span>
              <span>•</span>
              <span>नाशिक जिल्हा रुग्णालय नेटवर्क</span>
              <span>•</span>
              <span className="text-emerald-400">१००% सुरक्षित व मोफत</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, Hospital as HospitalIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';

export default function QRPosterPage() {
  const { state } = useJourneyStore();
  const t = getTranslation(state.language);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center justify-center print:bg-white print:p-0">
      {/* Top action bar (hidden during print) */}
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-700 bg-white px-4 py-2 rounded-xl font-bold border border-slate-200 shadow-xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{state.language === 'mr' ? 'मागे जा' : state.language === 'hi' ? 'पीछे जाएं' : 'Back'}</span>
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 text-white bg-sky-700 hover:bg-sky-800 px-6 py-2.5 rounded-xl font-bold shadow-md transition cursor-pointer"
        >
          <Printer className="w-5 h-5" />
          <span>{t.qrPrintBtn || 'Print Poster (A4)'}</span>
        </button>
      </div>

      {/* A4 Printable Poster Container */}
      <div className="w-full max-w-[210mm] bg-white border-4 border-sky-800 rounded-3xl p-10 sm:p-14 shadow-2xl print:border-4 print:shadow-none print:w-[210mm] print:h-[297mm] print:rounded-none flex flex-col items-center justify-between text-center relative overflow-hidden">
        {/* Decorative Header Ribbon */}
        <div className="w-full pb-6 border-b-2 border-slate-200">
          <div className="inline-flex items-center gap-3 bg-sky-50 text-sky-800 px-5 py-2 rounded-full font-extrabold text-sm mb-3">
            <HospitalIcon className="w-5 h-5 text-sky-700" />
            <span>{t.govRibbon || 'महाराष्ट्र शासन • सार्वजनिक आरोग्य विभाग'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {state.hospitals.find(h => h.id === state.hospitalId)?.name[state.language] || t.qrHospitalName || 'ग्रामीण रुग्णालय, सिन्नर'}
          </h1>
          <p className="text-lg font-bold text-sky-700 mt-1">
            {t.smartQueue || 'स्मार्ट डिजिटल रांग प्रणाली (Smart Queue System)'}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="my-8 flex flex-col items-center">
          <div className="p-6 bg-white border-4 border-dashed border-sky-600 rounded-3xl shadow-inner mb-6">
            {origin ? (
              <QRCodeSVG
                value={origin}
                size={280}
                level="H"
                includeMargin={true}
              />
            ) : (
              <div className="w-[280px] h-[280px] bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                Loading QR...
              </div>
            )}
          </div>

          <div className="bg-sky-700 text-white px-8 py-4 rounded-2xl shadow-lg max-w-xl">
            <p className="text-xl sm:text-2xl font-black tracking-wide">
              Scan karun token ghya / स्कैन करके टोकन लें / Scan to get token
            </p>
          </div>
        </div>

        {/* Instructions & URL */}
        <div className="w-full pt-6 border-t-2 border-slate-200">
          <p className="text-sm font-semibold text-slate-500 mb-2">
            {state.language === 'mr' ? 'थेट वेब पत्ता (Direct Web Address):' : state.language === 'hi' ? 'वेब पता:' : 'Direct Web URL:'}
          </p>
          <p className="font-mono text-lg font-bold text-sky-900 bg-slate-100 py-2 px-4 rounded-xl inline-block border border-slate-300 mb-4">
            {origin || 'http://localhost:3000'}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
            <span>✓ {state.language === 'mr' ? 'कोणतेही ॲप डाऊनलोड करण्याची गरज नाही' : 'No app install required'}</span>
            <span>✓ {state.language === 'mr' ? 'मोफत व सुरक्षित डिजिटल सेवा' : 'Free & Secure Digital Service'}</span>
            <span>✓ {state.language === 'mr' ? 'ज्येष्ठ नागरिक व गरोदर मातांना थेट प्राधान्य' : 'Priority for seniors & expectant mothers'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

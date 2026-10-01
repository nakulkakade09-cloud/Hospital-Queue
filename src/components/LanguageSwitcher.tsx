'use client';

import React from 'react';
import { useJourneyStore } from '@/lib/store';
import { Language } from '@/types';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { state, setLanguage } = useJourneyStore();

  const languages: { code: Language; label: string; subLabel: string }[] = [
    { code: 'mr', label: 'मराठी', subLabel: 'Marathi' },
    { code: 'hi', label: 'हिंदी', subLabel: 'Hindi' },
    { code: 'en', label: 'English', subLabel: 'EN' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
      <div className="pl-2 pr-1 text-slate-500 flex items-center gap-1 hidden sm:flex">
        <Globe className="w-4 h-4 text-primary" />
      </div>
      {languages.map((l) => {
        const isActive = state.language === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-base font-bold transition-all flex items-center gap-1 ${
              isActive
                ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                : 'text-slate-700 hover:bg-slate-200/80 active:scale-95'
            }`}
            aria-label={`Switch to ${l.subLabel}`}
          >
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
};

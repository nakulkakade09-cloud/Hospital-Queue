'use client';

import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { announcer } from '@/lib/speech';
import {
  Volume2,
  VolumeX,
  Tv,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Building2,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function LiveDisplayBoardPage() {
  const { state, setSoundEnabled, callNextPatient } = useJourneyStore();
  const t = getTranslation(state.language);
  const [captionText, setCaptionText] = useState(
    state.nowServing?.announcementText ||
      'टोकन क्रमांक A-08, कृपया सामान्य बाह्यरुग्ण (OPD 1), खोली क्र. २ येथे या.'
  );

  const activeHospital =
    state.hospitals.find((h) => h.id === state.hospitalId) || state.hospitals[0];

  // Current Serving Token
  const servingToken = state.nowServing?.token || 'A-08';
  const servingDept = state.nowServing?.departmentName || 'सामान्य बाह्यरुग्ण (OPD 1)';
  const servingRoom = state.nowServing?.roomNumber || 'खोली क्र. २';

  // Up Next 4 Tokens
  const upNextPatients = state.patients
    .filter((p) => p.tokenNumber !== servingToken && p.status !== 'completed')
    .slice(0, 4);

  // Announce when nowServing changes
  useEffect(() => {
    if (state.nowServing?.announcementText) {
      setCaptionText(state.nowServing.announcementText);
    }
  }, [state.nowServing]);

  const handleTestCall = (token: string, dept: string, room: string) => {
    const text = announcer.speakTokenTurn(token, dept, room, state.language);
    setCaptionText(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Banner Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/40">
            <Tv className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">
              {activeHospital.name[state.language]}
            </h1>
            <p className="text-xs text-sky-400 font-bold uppercase tracking-widest">
              {t.displayTitle}
            </p>
          </div>
        </div>

        {/* Sound Toggle & Time */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const next = !state.soundEnabled;
              setSoundEnabled(next);
              if (next) {
                announcer.speak('आवाज सुरू झाला आहे.', state.language);
              }
            }}
            className={`min-h-[48px] px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 border transition-all ${
              state.soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
            }`}
          >
            {state.soundEnabled ? (
              <>
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <span>{t.soundEnabled}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5 text-rose-400" />
                <span>{t.soundDisabled}</span>
              </>
            )}
          </button>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl text-right">
            <span className="text-xs text-slate-400 font-bold block">सध्याची वेळ</span>
            <span className="text-lg font-mono font-black text-amber-400">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Giant Now Serving Display */}
      <div className="my-8 text-center">
        <span className="inline-block px-6 py-2 bg-primary/20 text-primary-light border border-primary/40 rounded-full text-base sm:text-xl font-bold uppercase tracking-widest mb-4">
          {t.nowServingHeader}
        </span>

        {/* Huge Token Box */}
        <div className="max-w-2xl mx-auto p-8 sm:p-12 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border-4 border-primary shadow-[0_0_80px_rgba(14,116,144,0.3)] relative overflow-hidden">
          <div className="text-7xl sm:text-9xl font-black font-mono tracking-wider text-white drop-shadow-md">
            {servingToken}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <div className="text-center sm:text-left">
              <span className="text-xs text-slate-400 uppercase tracking-widest block font-bold">
                विभाग (Department)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                {servingDept}
              </span>
            </div>

            <div className="hidden sm:block w-px h-12 bg-slate-800"></div>

            <div className="text-center sm:text-left">
              <span className="text-xs text-slate-400 uppercase tracking-widest block font-bold">
                स्थान (Location)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-sky-300">
                {servingRoom}
              </span>
            </div>
          </div>
        </div>

        {/* Live Audio Announcement Subtitle / Caption */}
        <div className="mt-6 max-w-3xl mx-auto p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-center gap-3">
          <Volume2 className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <p className="text-base sm:text-lg font-bold text-slate-200">
            &ldquo;{captionText}&rdquo;
          </p>
        </div>
      </div>

      {/* Up Next in Queue Ticker */}
      <div className="pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
            {t.upNextHeader}
          </span>
          <span className="text-xs text-slate-500">
            कृपया हॉलमधील बाकांवर शांततेने बसावे
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {upNextPatients.length === 0 ? (
            <div className="col-span-full py-4 text-center text-slate-500">
              पुढील प्रतीक्षेत रुग्ण नाहीत.
            </div>
          ) : (
            upNextPatients.map((p, idx) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-xs text-slate-500 font-bold block">
                    क्रमांक {idx + 1}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-primary-light">
                    {p.tokenNumber}
                  </span>
                  <p className="text-xs font-semibold text-slate-300 mt-1 line-clamp-1">
                    {p.patientName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-bold block">अंदाजे</span>
                  <span className="text-sm font-bold text-amber-400">
                    {p.totalEstimatedWaitMinutes} मि.
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Demo helper action row */}
      <div className="mt-6 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>* डेमो प्रात्यक्षिक: आवाज चाचणीसाठी खालील बटणावर क्लिक करा</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleTestCall('A-12', 'पॅथॉलॉजी लॅब', 'खोली क्र. ५')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-bold"
          >
            A-12 लॅब अनाउन्स करा
          </button>
          <button
            onClick={() => handleTestCall('A-05', 'मोफत औषधालय', 'काउंटर २')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 font-bold"
          >
            A-05 फार्मसी अनाउन्स करा
          </button>
        </div>
      </div>
    </div>
  );
}

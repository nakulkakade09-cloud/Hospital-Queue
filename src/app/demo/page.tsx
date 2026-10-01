'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Users,
  Building2,
  ShieldCheck,
} from 'lucide-react';

interface SimPatient {
  id: string;
  name: string;
  category: string;
  normalStages: { name: string; duration: number }[]; // in simulated mins
  journeyStages: { name: string; duration: number; isParallel?: boolean }[];
}

const DEMO_PATIENTS: SimPatient[] = [
  {
    id: 'p1',
    name: 'सखाराम शिंदे (वय ६२)',
    category: 'ज्येष्ठ नागरिक • खोकला व ताप',
    normalStages: [
      { name: '१. नोंदणी रांग', duration: 30 },
      { name: '२. डॉक्टर १ रांग', duration: 75 },
      { name: '३. लॅब रक्त रांग', duration: 55 },
      { name: '४. रिपोर्ट रांग', duration: 40 },
      { name: '५. डॉक्टर २ फेरतपासणी', duration: 50 },
      { name: '६. औषधालय रांग', duration: 45 },
    ],
    journeyStages: [
      { name: '१. डिजिटल टोकन', duration: 5 },
      { name: '२. लॅब तपासणी (आधी)', duration: 35, isParallel: true },
      { name: '३. डॉक्टर (थेट रिपोर्टसह)', duration: 45 },
      { name: '४. औषधे (तयार पाकिट)', duration: 15 },
    ],
  },
  {
    id: 'p2',
    name: 'सुनिता जाधव (वय २८)',
    category: 'गर्भवती माता • चक्कर व रक्ततपासणी',
    normalStages: [
      { name: '१. नोंदणी रांग', duration: 25 },
      { name: '२. डॉक्टर रांग', duration: 60 },
      { name: '३. सोनोग्राफी/लॅब', duration: 70 },
      { name: '४. रिपोर्ट वाटप', duration: 45 },
      { name: '५. पुन्हा डॉक्टर रांग', duration: 40 },
      { name: '६. फार्मसी रांग', duration: 50 },
    ],
    journeyStages: [
      { name: '१. प्राधान्य टोकन', duration: 5 },
      { name: '२. सोनोग्राफी/लॅब (समांतर)', duration: 40, isParallel: true },
      { name: '३. डॉक्टर तपासणी', duration: 35 },
      { name: '४. फार्मसी (ऑटो-हँडऑफ)', duration: 15 },
    ],
  },
  {
    id: 'p3',
    name: 'रमेश पवार (वय ३५)',
    category: 'सामान्य रुग्ण • तीव्र पोटदुखी',
    normalStages: [
      { name: '१. नोंदणी रांग', duration: 35 },
      { name: '२. डॉक्टर रांग', duration: 65 },
      { name: '३. औषधालय रांग', duration: 50 },
    ],
    journeyStages: [
      { name: '१. थेट टोकन', duration: 5 },
      { name: '२. डॉक्टर तपासणी', duration: 35 },
      { name: '३. फार्मसी (डिजिटल प्रिस्क्रिप्शन)', duration: 15 },
    ],
  },
];

export default function DemoSimulationPage() {
  const { state } = useJourneyStore();
  const t = getTranslation(state.language);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x
  const [simMinutes, setSimMinutes] = useState(0); // 0 to 300 minutes (5 hours)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Maximum benchmark time: 5 hours (295-300 mins)
  const MAX_MINS = 300;

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSimMinutes((prev) => {
          if (prev >= MAX_MINS) {
            setIsPlaying(false);
            return MAX_MINS;
          }
          return prev + 2;
        });
      }, 150 / speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  const handleReset = () => {
    setIsPlaying(false);
    setSimMinutes(0);
  };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} तास ${m} मि.` : `${m} मि.`;
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>हॅकॅथॉन निर्णायक डेमो प्रात्यक्षिक (Hackathon Jury Showcase)</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
                {t.demoTitle}
              </h1>
              <p className="text-slate-600 text-base mt-2 max-w-3xl">
                {t.demoSubtitle}
              </p>
            </div>

            {/* Simulation Controls */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`btn-calm-primary min-h-[48px] px-6 text-base font-bold shadow-md ${
                  isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>{t.pauseSimulation}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>{t.playSimulation}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="btn-calm-secondary min-h-[48px] px-4 text-base font-bold"
                title="Reset simulation"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{t.resetSimulation}</span>
              </button>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-500 mr-1">{t.speedLabel}</span>
                {[1, 2, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      speed === s
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-500">
                सिम्युलेशन वेळ प्रगती: <span className="font-mono text-primary text-base font-black">{formatMins(simMinutes)}</span>
              </span>
              <span className="text-slate-400">कमाल वेळ: ५ तास ०० मि.</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-primary via-sky-500 to-emerald-500 transition-all duration-200"
                style={{ width: `${(simMinutes / MAX_MINS) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Top Big Comparison Metric Card */}
        <div className="bg-gradient-to-br from-primary to-sky-800 text-white rounded-3xl p-6 sm:p-8 shadow-elevated">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xs">
              <span className="text-xs uppercase font-extrabold tracking-widest text-sky-200 block mb-1">
                जुनी पद्धत (Traditional)
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono">४ ते ५ तास</span>
              <p className="text-xs text-sky-100 mt-1">५ वेगवेगळ्या रांगांमध्ये प्रतीक्षा</p>
            </div>

            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-xs border border-white/20">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300 block mb-1">
                जर्नी क्यू (Journey Queue)
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-200">
                २ तास १५ मि.
              </span>
              <p className="text-xs text-sky-100 mt-1">समांतर लॅब + १ अखंड डिजिटल टोकन</p>
            </div>

            <div className="p-4 bg-emerald-500/25 rounded-2xl backdrop-blur-xs border border-emerald-400/30">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-300 block mb-1">
                {t.totalSavedTitle}
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-300">
                २ तास ३० मि. (५०% बचत!)
              </span>
              <p className="text-xs text-emerald-100 mt-1">रुग्णाचा मनस्ताप व गर्दी नष्ट</p>
            </div>
          </div>
        </div>

        {/* Patient by Patient Side-by-Side Simulation */}
        <div className="space-y-6">
          {DEMO_PATIENTS.map((p) => {
            // Calculate normal progress
            const normalTotal = p.normalStages.reduce((sum, s) => sum + s.duration, 0);
            const normalProgressMins = Math.min(simMinutes, normalTotal);
            const normalPercent = Math.min(100, Math.round((normalProgressMins / normalTotal) * 100));

            // Calculate Journey Queue progress (runs about 2x faster due to parallel routing)
            const journeyTotal = p.journeyStages.reduce((sum, s) => sum + s.duration, 0);
            const journeyProgressMins = Math.min(simMinutes, journeyTotal);
            const journeyPercent = Math.min(100, Math.round((journeyProgressMins / journeyTotal) * 100));

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{p.name}</h3>
                    <p className="text-xs font-bold text-primary">{p.category}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-slate-400 block">वेळेची थेट बचत</span>
                    <span className="text-base font-black text-emerald-600 font-mono">
                      ~ {formatMins(normalTotal - journeyTotal)} वाचले
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Normal Queue Flow */}
                  <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>{t.normalQueueHeader}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-700">
                        एकूण {formatMins(normalTotal)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-rose-800 mb-1">
                        <span>प्रगती ({normalPercent}%)</span>
                        <span>{formatMins(normalProgressMins)} पूर्ण</span>
                      </div>
                      <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${normalPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stages Timeline */}
                    <div className="space-y-2 pt-2">
                      {p.normalStages.map((stg, i) => {
                        // determine if this stage is done
                        let prevSum = 0;
                        for (let j = 0; j < i; j++) prevSum += p.normalStages[j].duration;
                        const isDone = simMinutes >= prevSum + stg.duration;
                        const isCurrent = simMinutes >= prevSum && simMinutes < prevSum + stg.duration;

                        return (
                          <div
                            key={i}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                              isDone
                                ? 'bg-white border-slate-200 text-slate-400 opacity-60'
                                : isCurrent
                                ? 'bg-white border-rose-400 text-rose-950 font-bold shadow-xs'
                                : 'bg-rose-50/30 border-rose-100 text-slate-500'
                            }`}
                          >
                            <span>{stg.name}</span>
                            <span className="font-mono">{stg.duration} मि.</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Journey Queue Flow */}
                  <div className="p-5 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-primary flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>{t.journeyQueueHeader}</span>
                      </span>
                      <span className="text-xs font-mono font-black text-primary">
                        एकूण {formatMins(journeyTotal)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-primary mb-1">
                        <span>प्रगती ({journeyPercent}%)</span>
                        <span className="font-mono">
                          {journeyPercent === 100 ? 'पूर्ण झाले! (Free)' : `${formatMins(journeyProgressMins)} पूर्ण`}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-sky-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${journeyPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stages Timeline */}
                    <div className="space-y-2 pt-2">
                      {p.journeyStages.map((stg, i) => {
                        let prevSum = 0;
                        for (let j = 0; j < i; j++) prevSum += p.journeyStages[j].duration;
                        const isDone = simMinutes >= prevSum + stg.duration;
                        const isCurrent = simMinutes >= prevSum && simMinutes < prevSum + stg.duration;

                        return (
                          <div
                            key={i}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                              isDone
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : isCurrent
                                ? 'bg-white border-primary text-primary font-black shadow-xs ring-2 ring-sky-100'
                                : 'bg-white/60 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{stg.name}</span>
                              {stg.isParallel && (
                                <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[10px] font-black">
                                  पॅरालेल
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold">{stg.duration} मि.</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explainable Rules Engine Summary Box for Judges */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
          <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>पारदर्शक नियम प्रणाली (Explainable Rules Engine - 100% Deterministic)</span>
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            प्रणालीमध्ये कोणताही ब्लॅक-बॉक्स AI नाही. सर्व निर्णय पारदर्शक आणि ऑडिट करण्यायोग्य आहेत:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold text-primary uppercase block mb-1">
                १. प्राधान्य क्रम (Priority Rule)
              </span>
              <p className="text-slate-700">
                इमर्जन्सी (१००० गुण) &gt; गर्भवती माता (५०० गुण) &gt; ज्येष्ठ नागरिक (२५० गुण) &gt; सामान्य (१०० गुण).
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold text-primary uppercase block mb-1">
                २. समांतर शेड्युलिंग (Parallel Rule)
              </span>
              <p className="text-slate-700">
                डॉक्टर रांग &gt; लॅब रांग + २५ मिनिटे असल्यास रुग्णाला आधी लॅबमध्ये पाठवून वेळ वाचवला जातो.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold text-primary uppercase block mb-1">
                ३. भार संतुलन (Load Balance Rule)
              </span>
              <p className="text-slate-700">
                OPD 1 आणि OPD 2 मधील प्रतीक्षा वेळेचा फरक २० मिनिटांपेक्षा जास्त असल्यास रुग्ण कमी गर्दीच्या खोलीकडे वळवले जातात.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic text-right mt-4">
            {t.simulationDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

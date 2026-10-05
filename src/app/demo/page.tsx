'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SimPatient {
  id: string;
  name: string;
  category: string;
  normalStages: { name: string; duration: number }[];
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
  const [speed, setSpeed] = useState<number>(2);
  const [simMinutes, setSimMinutes] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (state.language === 'mr') {
      return h > 0 ? `${h} तास ${m} मि.` : `${m} मि.`;
    }
    if (state.language === 'hi') {
      return h > 0 ? `${h} घंटे ${m} मि.` : `${m} मि.`;
    }
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="py-6 sm:py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.hackathonShowcase || 'Hackathon Jury Showcase'}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
                {t.demoTitle}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl">
                {t.demoSubtitle}
              </p>
            </div>

            {/* Simulation Controls */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`btn-calm-primary min-h-[44px] px-5 text-sm sm:text-base font-bold shadow-md cursor-pointer ${
                  isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>{t.pauseSimulation}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{t.playSimulation}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="btn-calm-secondary min-h-[44px] px-3.5 text-sm sm:text-base font-bold cursor-pointer"
                title="Reset simulation"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.resetSimulation}</span>
              </button>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-500 mr-1">{t.speedLabel}</span>
                {[1, 2, 5, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                {t.simTimeProgress || 'Simulation time:'} <span className="font-mono text-primary text-sm font-black">{formatMins(simMinutes)}</span>
              </span>
              <span className="text-slate-400">{t.maxTime || 'Max time: 5 hrs 00 min'}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-primary via-sky-500 to-emerald-500 transition-all duration-200"
                style={{ width: `${(simMinutes / MAX_MINS) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Top Big Comparison Metric Card */}
        <div className="bg-gradient-to-br from-primary to-sky-800 text-white rounded-3xl p-6 sm:p-8 shadow-elevated">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xs">
              <span className="text-xs uppercase font-extrabold tracking-widest text-sky-200 block mb-1">
                {t.traditional || 'Traditional'}
              </span>
              <span className="text-2xl sm:text-4xl font-black font-mono">{t.traditionalTime || '4 to 5 hours'}</span>
              <p className="text-xs text-sky-100 mt-1">{t.traditionalDesc || 'Waiting in 5 separate queues'}</p>
            </div>

            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-xs border border-white/20">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300 block mb-1">
                {t.journeyQueue || 'Journey Queue'}
              </span>
              <span className="text-2xl sm:text-4xl font-black font-mono text-amber-200">
                {t.journeyQueueTime || '2 hrs 15 min'}
              </span>
              <p className="text-xs text-sky-100 mt-1">{t.journeyQueueDesc || 'Parallel Lab + 1 seamless digital token'}</p>
            </div>

            <div className="p-4 bg-emerald-500/25 rounded-2xl backdrop-blur-xs border border-emerald-400/30">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-300 block mb-1">
                {t.totalSavedTitle}
              </span>
              <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-300">
                {t.savedTime || '2 hrs 30 min (50% saved!)'}
              </span>
              <p className="text-xs text-emerald-100 mt-1">{t.savedDesc || 'Patient stress and crowding eliminated'}</p>
            </div>
          </div>
        </div>

        {/* Patient by Patient Side-by-Side Simulation */}
        <div className="space-y-6">
          {DEMO_PATIENTS.map((p) => {
            const normalTotal = p.normalStages.reduce((sum, s) => sum + s.duration, 0);
            const normalProgressMins = Math.min(simMinutes, normalTotal);
            const normalPercent = Math.min(100, Math.round((normalProgressMins / normalTotal) * 100));

            const journeyTotal = p.journeyStages.reduce((sum, s) => sum + s.duration, 0);
            const journeyProgressMins = Math.min(simMinutes, journeyTotal);
            const journeyPercent = Math.min(100, Math.round((journeyProgressMins / journeyTotal) * 100));

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">{p.name}</h3>
                    <p className="text-xs font-bold text-primary">{p.category}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-slate-400 block">{t.timeSavedDirect || 'Direct time saved'}</span>
                    <span className="text-base font-black text-emerald-600 font-mono">
                      ~ {formatMins(normalTotal - journeyTotal)} {t.saved || 'saved'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Normal Queue Flow */}
                  <div className="p-4 sm:p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>{t.normalQueueHeader}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-700">
                        {t.total || 'Total'} {formatMins(normalTotal)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-rose-800 mb-1">
                        <span>{t.progress || 'Progress'} ({normalPercent}%)</span>
                        <span>{formatMins(normalProgressMins)} {t.done || 'done'}</span>
                      </div>
                      <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${normalPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stages Timeline */}
                    <div className="space-y-1.5 pt-1">
                      {p.normalStages.map((stg, i) => {
                        let prevSum = 0;
                        for (let j = 0; j < i; j++) prevSum += p.normalStages[j].duration;
                        const isDone = simMinutes >= prevSum + stg.duration;
                        const isCurrent = simMinutes >= prevSum && simMinutes < prevSum + stg.duration;

                        return (
                          <div
                            key={i}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                              isDone
                                ? 'bg-white border-slate-200 text-slate-400 opacity-60'
                                : isCurrent
                                ? 'bg-white border-rose-400 text-rose-950 font-bold shadow-xs'
                                : 'bg-rose-50/30 border-rose-100 text-slate-500'
                            }`}
                          >
                            <span>{stg.name}</span>
                            <span className="font-mono">{stg.duration} {t.minutes}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Journey Queue Flow */}
                  <div className="p-4 sm:p-5 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-primary flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>{t.journeyQueueHeader}</span>
                      </span>
                      <span className="text-xs font-mono font-black text-primary">
                        {t.total || 'Total'} {formatMins(journeyTotal)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-primary mb-1">
                        <span>{t.progress || 'Progress'} ({journeyPercent}%)</span>
                        <span className="font-mono">
                          {journeyPercent === 100 ? (t.completed || 'Complete') : `${formatMins(journeyProgressMins)}`}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-sky-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${journeyPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stages Timeline */}
                    <div className="space-y-1.5 pt-1">
                      {p.journeyStages.map((stg, i) => {
                        let prevSum = 0;
                        for (let j = 0; j < i; j++) prevSum += p.journeyStages[j].duration;
                        const isDone = simMinutes >= prevSum + stg.duration;
                        const isCurrent = simMinutes >= prevSum && simMinutes < prevSum + stg.duration;

                        return (
                          <div
                            key={i}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
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
                                  {t.parallel || 'Parallel'}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold">{stg.duration} {t.minutes}</span>
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
          <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>{t.rulesEngineTitle || 'Transparent Rules Engine (100% Deterministic)'}</span>
          </h3>
          <p className="text-sm text-slate-600 mb-5">
            {t.rulesEngineDesc || 'No black-box AI in the system. All decisions are transparent and auditable:'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold text-primary uppercase block mb-1">
                {t.rulePriority || '1. Priority Scoring Rule'}
              </span>
              <p className="text-slate-700">
                {t.rulePriorityDesc || 'Emergency (1000) > Pregnant (500) > Senior (250) > Normal (100).'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold text-primary uppercase block mb-1">
                {t.ruleParallel || '2. Parallel Scheduling Rule'}
              </span>
              <p className="text-slate-700">
                {t.ruleParallelDesc || 'If Doctor wait > Lab wait + 25 mins, route patient to Lab first to save time.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold text-primary uppercase block mb-1">
                {t.ruleLoadBalance || '3. Load Balancing Rule'}
              </span>
              <p className="text-slate-700">
                {t.ruleLoadBalanceDesc || 'If wait difference between OPD 1 and OPD 2 exceeds 20 minutes, route patients to the less crowded room.'}
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

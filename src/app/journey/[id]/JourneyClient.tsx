'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { formatWaitDuration, getQueueStatusInfo } from '@/lib/rulesEngine';
import { StatusBadge } from '@/components/StatusBadge';
import { AudioVoiceButton } from '@/components/AudioVoiceButton';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PhoneCall,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Sparkles,
  QrCode,
  MapPin,
  Heart,
  Baby,
  ShieldAlert,
} from 'lucide-react';

export function JourneyClient() {
  const params = useParams();
  const router = useRouter();
  const { state } = useJourneyStore();
  const t = getTranslation(state.language);
  const [helpRequested, setHelpRequested] = useState(false);

  const patientId = (params?.id as string) || 'patient_01';
  // Search patient by id or tokenNumber
  const patient =
    state.patients.find(
      (p) => p.id === patientId || p.tokenNumber.toUpperCase() === patientId.toUpperCase()
    ) || state.patients[0];

  const currentStep = patient.steps[patient.currentStepIndex] || patient.steps[0];
  const activeHospital = state.hospitals.find((h) => h.id === patient.hospitalId) || state.hospitals[0];

  // Calculate people ahead for the current step's department
  const currentDept = state.departments.find(
    (d) => d.id === currentStep.departmentId || (currentStep.departmentId.startsWith('opd') && d.id.startsWith('opd'))
  );
  const nowServingToken = currentDept?.currentServingToken || state.nowServing?.token || 'A-08';
  const peopleAhead = Math.max(0, (currentDept?.currentQueueLength || 4) - 1);

  // Status info
  const waitInfo = getQueueStatusInfo(patient.totalEstimatedWaitMinutes);

  // Text for voice announcement
  const voiceAnnouncementText =
    state.language === 'mr'
      ? `नमस्कार ${patient.patientName}. आपला टोकन क्रमांक ${patient.tokenNumber} आहे. सध्याचे पाऊल: ${currentStep.departmentName.mr}, ${currentStep.counterNumber || 'खोली क्र. २'}. अंदाजे वेळ ${patient.totalEstimatedWaitMinutes} मिनिटे.`
      : state.language === 'hi'
      ? `नमस्कार ${patient.patientName}. आपका टोकन नंबर ${patient.tokenNumber} है. वर्तमान चरण: ${currentStep.departmentName.hi}. कुल अनुमानित समय ${patient.totalEstimatedWaitMinutes} मिनट.`
      : `Hello ${patient.patientName}. Your token number is ${patient.tokenNumber}. Current step: ${currentStep.departmentName.en}. Estimated wait time is ${patient.totalEstimatedWaitMinutes} minutes.`;

  const handleCallHelp = () => {
    setHelpRequested(true);
    setTimeout(() => setHelpRequested(false), 5000);
  };

  return (
    <div className="py-6 sm:py-10 bg-slate-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Quick Demo Patient Switcher */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
          <span className="font-bold text-slate-500">डेमो रुग्ण बदला:</span>
          <div className="flex gap-2">
            {state.patients.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/journey/${p.id}`)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  patient.id === p.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.tokenNumber} ({p.priorityLevel === 'senior' ? 'ज्येष्ठ' : p.priorityLevel === 'pregnant' ? 'गर्भवती' : 'इमर्जन्सी'})
              </button>
            ))}
          </div>
        </div>

        {/* 1. Main Hero Token Card */}
        <div className="card-calm p-6 sm:p-8 text-center relative overflow-hidden border-2 border-primary/20 shadow-elevated">
          {/* Background Decorative Rings */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-100/50 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none"></div>

          {/* Hospital and Priority Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{activeHospital.name[state.language]}</span>
            </span>

            {patient.priorityLevel === 'emergency' && (
              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>इमर्जन्सी प्राधान्य</span>
              </span>
            )}
            {patient.priorityLevel === 'pregnant' && (
              <span className="px-3 py-1 bg-pink-100 text-pink-800 text-xs font-black rounded-full flex items-center gap-1">
                <Baby className="w-3.5 h-3.5" />
                <span>गर्भवती माता सवलत</span>
              </span>
            )}
            {patient.priorityLevel === 'senior' && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span>ज्येष्ठ नागरिक प्राधान्य</span>
              </span>
            )}
          </div>

          {/* Patient Name */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">
            {patient.patientName}
          </h1>

          {/* Giant Token Number */}
          <div className="my-5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1">
              {t.tokenLabel}
            </span>
            <div className="inline-block px-8 py-3 bg-gradient-to-br from-primary to-sky-700 text-white rounded-3xl shadow-lg shadow-primary/30">
              <span className="text-5xl sm:text-6xl font-black tracking-wider font-mono">
                {patient.tokenNumber}
              </span>
            </div>
          </div>

          {/* Now Serving & Waiting Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-bold block">
                {t.nowServingLabel}
              </span>
              <span className="text-2xl font-black text-primary font-mono">
                {nowServingToken}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-bold block">
                {t.peopleAheadLabel}
              </span>
              <span className="text-2xl font-black text-slate-800 font-mono">
                {peopleAhead} {state.language === 'mr' ? 'रुग्ण' : 'minds'}
              </span>
            </div>
          </div>

          {/* Total Estimated Time Banner */}
          <div className="mt-4 p-4 bg-sky-50/80 rounded-2xl border border-sky-200 flex items-center justify-between text-left">
            <div>
              <span className="text-xs font-bold text-sky-900 block">
                {t.todayTotalWait}
              </span>
              <span className="text-xl font-black text-primary">
                ~ {formatWaitDuration(patient.totalEstimatedWaitMinutes, state.language)}
              </span>
            </div>
            <StatusBadge level={waitInfo.level} text={waitInfo.label[state.language]} size="sm" />
          </div>

          {/* Voice Announcement Button (USP) */}
          <div className="mt-5">
            <AudioVoiceButton
              textToSpeak={voiceAnnouncementText}
              label={t.voiceAnnounceBtn}
              size="lg"
            />
          </div>
        </div>

        {/* 2. Parallel Scheduling Banner (Core USP Alert) */}
        {patient.isParallelScheduled && (
          <div className="p-5 bg-gradient-to-r from-sky-500 to-primary text-white rounded-3xl shadow-lg shadow-sky-500/20 relative overflow-hidden animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-amber-200">
                  {t.parallelNoticeTitle}
                </h3>
                <p className="text-sm font-medium leading-relaxed mt-1 text-sky-50">
                  {patient.parallelReason
                    ? patient.parallelReason[state.language]
                    : t.parallelNoticeDesc}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>सुमारे ४५ मिनिटांची थेट बचत</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Live Active Alert (e.g. Pharmacy Ready / Test Ordered) */}
        {patient.activeAlert && (
          <div
            className={`p-5 rounded-3xl border shadow-sm ${
              patient.activeAlert.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : patient.activeAlert.type === 'action'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`w-6 h-6 shrink-0 mt-0.5 ${
                  patient.activeAlert.type === 'success'
                    ? 'text-emerald-600'
                    : patient.activeAlert.type === 'action'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                    {t.liveAlertsTitle}
                  </span>
                  <span className="text-xs font-mono opacity-60">
                    {patient.activeAlert.timestamp}
                  </span>
                </div>
                <p className="text-base font-bold mt-1 leading-snug">
                  {patient.activeAlert.message[state.language]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Vertical Journey Stepper */}
        <div className="card-calm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {t.journeyTrackerTitle}
              </h2>
              <p className="text-xs text-slate-500">
                एक टोकन • सर्व टप्पे आपोआप जोडलेले
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              टप्पा {patient.currentStepIndex + 1} / {patient.steps.length}
            </span>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {patient.steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = idx === patient.currentStepIndex && !isCompleted;

              return (
                <div key={step.id} className="relative group">
                  {/* Step Circle Indicator */}
                  <div
                    className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-primary border-primary text-white ring-4 ring-sky-100 animate-pulse'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Card Content */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-sky-50/70 border-primary shadow-sm'
                        : isCompleted
                        ? 'bg-slate-50/60 border-slate-200 opacity-90'
                        : 'bg-white border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-base sm:text-lg font-bold ${
                              isCurrent ? 'text-primary' : 'text-slate-800'
                            }`}
                          >
                            {step.departmentName[state.language]}
                          </h3>

                          {step.isParallelShifted && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[11px] font-extrabold rounded-md flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              <span>आधी लॅब</span>
                            </span>
                          )}
                        </div>

                        {step.counterNumber && (
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            स्थान: {step.counterNumber}
                          </p>
                        )}

                        {step.notes && (
                          <p className="text-xs text-sky-800 font-medium mt-1">
                            {step.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {isCompleted ? (
                          <StatusBadge level="green" text={t.completedStage} size="sm" />
                        ) : isCurrent ? (
                          <StatusBadge level="info" text={t.currentStage} size="sm" />
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            ~ {step.estimatedWaitMinutes} {t.minutes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Rural Support & Call Help Button */}
        <div className="card-calm p-6 text-center space-y-3">
          <p className="text-xs text-slate-500 font-semibold">
            {t.hospitalHelpline}
          </p>

          <button
            onClick={handleCallHelp}
            className={`btn-calm-secondary w-full text-base font-bold min-h-[48px] ${
              helpRequested ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : ''
            }`}
          >
            <PhoneCall className="w-5 h-5 text-primary" />
            <span>
              {helpRequested
                ? 'सेवक पाचारण केले आहे! काही वेळात मदत येईल.'
                : t.callHelpBtn}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

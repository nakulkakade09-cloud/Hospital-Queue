'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import {
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Baby,
  ShieldAlert,
  ArrowRight,
  Smile,
  Thermometer,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function CheckinPage() {
  const router = useRouter();
  const { state, checkInPatient } = useJourneyStore();
  const t = getTranslation(state.language);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSenior, setIsSenior] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pictorial Symptoms
  const symptomList = [
    { id: 'head', label: t.symptomHead, icon: '🧠', tag: 'Head' },
    { id: 'chest', label: t.symptomChest, icon: '🫁', tag: 'Chest' },
    { id: 'stomach', label: t.symptomStomach, icon: '🫄', tag: 'Stomach' },
    { id: 'joints', label: t.symptomJoints, icon: '🦵', tag: 'Joints' },
    { id: 'fever', label: t.symptomFever, icon: '🤒', tag: 'Fever' },
    { id: 'skin', label: t.symptomSkin, icon: '✋', tag: 'Skin' },
  ];

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(state.language === 'mr' ? 'कृपया रुग्णाचे नाव टाका.' : 'Please enter patient name.');
      return;
    }

    setIsSubmitting(true);

    const newPatient = checkInPatient({
      name: name.trim(),
      mobile: mobile.trim() || '9822012345',
      flags: {
        isSenior,
        isPregnant,
        isEmergency,
      },
      symptoms: selectedSymptoms,
    });

    setTimeout(() => {
      router.push(`/journey/${newPatient.id}`);
    }, 400);
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card mb-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-primary flex items-center justify-center shrink-0">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {t.checkinTitle}
              </h1>
              <p className="text-slate-600 text-base mt-1">
                {t.checkinSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Check-in Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-5">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-2">
                {t.patientNameLabel} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <User className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.patientNamePlaceholder}
                  className="w-full min-h-[56px] pl-13 pr-4 text-lg font-bold text-slate-900 border-2 border-slate-200 rounded-2xl focus:border-primary focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-2">
                {t.mobileLabel}
              </label>
              <div className="relative">
                <Phone className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={t.mobilePlaceholder}
                  className="w-full min-h-[56px] pl-13 pr-4 text-lg font-bold font-mono text-slate-900 border-2 border-slate-200 rounded-2xl focus:border-primary focus:outline-hidden transition-colors"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>टोकन क्रमांक आणि पाळी आल्यावर थेट SMS पाठवला जाईल.</span>
              </p>
            </div>
          </div>

          {/* 2. Priority Checkboxes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{t.prioritySectionTitle}</span>
            </h2>

            <div className="space-y-3">
              {/* Senior Citizen */}
              <label
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSenior
                    ? 'border-primary bg-sky-50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSenior}
                  onChange={(e) => setIsSenior(e.target.checked)}
                  className="w-6 h-6 rounded-lg text-primary focus:ring-primary shrink-0"
                />
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900 block">
                    {t.seniorLabel}
                  </span>
                  <span className="text-xs text-slate-500">
                    रांगेत प्राधान्य दिले जाईल (बसण्यासाठी व्यवस्था)
                  </span>
                </div>
              </label>

              {/* Pregnant Mother */}
              <label
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isPregnant
                    ? 'border-primary bg-sky-50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="w-6 h-6 rounded-lg text-primary focus:ring-primary shrink-0"
                />
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900 block">
                    {t.pregnantLabel}
                  </span>
                  <span className="text-xs text-slate-500">
                    विशेष प्राधान्य व थेट तपासणी सवलत
                  </span>
                </div>
              </label>

              {/* Emergency */}
              <label
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isEmergency
                    ? 'border-rose-500 bg-rose-50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-6 h-6 rounded-lg text-rose-600 focus:ring-rose-500 shrink-0"
                />
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-rose-900 block">
                    {t.emergencyLabel}
                  </span>
                  <span className="text-xs text-rose-600 font-semibold">
                    तातडीचे उपचार • शून्य प्रतीक्षा थेट डॉक्टरांकडे
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Pictorial Symptom Picker */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              <span>{t.symptomSectionTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              योग्य विभाग व समांतर शेड्युलिंग सुचवण्यासाठी मदत होते.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {symptomList.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.label);
                return (
                  <button
                    type="button"
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.label)}
                    className={`min-h-[72px] p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-primary bg-sky-50 shadow-sm scale-102'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-3xl shrink-0">{sym.icon}</span>
                    <span className="text-sm font-bold text-slate-800 leading-snug">
                      {sym.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-calm-primary w-full text-xl py-4 min-h-[64px] rounded-2xl shadow-elevated"
            >
              {isSubmitting ? (
                <span>टोकन तयार होत आहे...</span>
              ) : (
                <>
                  <span>{t.submitCheckinBtn}</span>
                  <ArrowRight className="w-6 h-6 ml-2" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              {t.checkinSuccessNote}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

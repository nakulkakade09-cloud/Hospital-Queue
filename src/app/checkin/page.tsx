'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { sendSmsNotification } from '@/lib/sms';
import {
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Baby,
  ShieldAlert,
  ArrowRight,
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

  // Validation state
  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');

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

  const validate = () => {
    let isValid = true;
    if (!name.trim()) {
      setNameError(
        state.language === 'mr'
          ? 'कृपया रुग्णाचे पूर्ण नाव प्रविष्ट करा.'
          : state.language === 'hi'
          ? 'कृपया मरीज का पूरा नाम दर्ज करें।'
          : 'Please enter patient full name.'
      );
      isValid = false;
    } else {
      setNameError('');
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile && cleanMobile.length !== 10) {
      setMobileError(
        state.language === 'mr'
          ? 'मोबाईल नंबर १० अंकी असावा (उदा. 9822012345).'
          : state.language === 'hi'
          ? 'मोबाइल नंबर १० अंकों का होना चाहिए।'
          : 'Mobile number must be 10 digits.'
      );
      isValid = false;
    } else {
      setMobileError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const patientMobile = mobile.trim() || '9822012345';
      const newPatient = checkInPatient({
        name: name.trim(),
        mobile: patientMobile,
        flags: {
          isSenior,
          isPregnant,
          isEmergency,
        },
        symptoms: selectedSymptoms,
      });

      // Send Twilio SMS asynchronously (under 160 chars with link)
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const journeyUrl = `${origin}/journey/${newPatient.id}`;
      const smsMessage =
        state.language === 'mr'
          ? `[सिन्नर रुग्णालय] टोकन ${newPatient.tokenNumber} नोंदवले. थेट ट्रॅकर: ${journeyUrl}`
          : state.language === 'hi'
          ? `[सिन्नर अस्पताल] टोकन ${newPatient.tokenNumber} दर्ज. ट्रैकर: ${journeyUrl}`
          : `[Sinnar Hospital] Token ${newPatient.tokenNumber} created. Tracker: ${journeyUrl}`;

      sendSmsNotification(patientMobile, smsMessage).catch((err) =>
        console.warn('SMS dispatch error:', err)
      );

      // Redirect immediately to /journey/[id]
      router.push(`/journey/${newPatient.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 bg-slate-50 min-h-[calc(100vh-80px)] px-4">
      {/* Patient container single column max 480px centered */}
      <div className="w-full max-w-[480px] mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card mb-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-primary flex items-center justify-center shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {t.checkinTitle}
              </h1>
              <p className="text-slate-600 text-sm mt-0.5">
                {t.checkinSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Check-in Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Basic Info */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card space-y-4">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                {t.patientNameLabel} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder={t.patientNamePlaceholder}
                  className={`w-full min-h-[50px] pl-11 pr-4 text-lg font-bold text-slate-900 border-2 rounded-2xl focus:border-primary focus:outline-hidden transition-colors ${
                    nameError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {nameError && (
                <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                {t.mobileLabel}
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (mobileError) setMobileError('');
                  }}
                  placeholder={t.mobilePlaceholder || 'उदा. 9822012345'}
                  className={`w-full min-h-[50px] pl-11 pr-4 text-lg font-bold font-mono text-slate-900 border-2 rounded-2xl focus:border-primary focus:outline-hidden transition-colors ${
                    mobileError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {mobileError ? (
                <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{mobileError}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {state.language === 'mr'
                      ? 'टोकन क्रमांक आणि पाळी आल्यावर थेट SMS पाठवला जाईल.'
                      : state.language === 'hi'
                      ? 'टोकन नंबर और बारी आने पर सीधा SMS भेजा जाएगा।'
                      : 'SMS updates will be sent for token & turn alerts.'}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* 2. Priority Checkboxes */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{t.prioritySectionTitle}</span>
            </h2>

            <div className="space-y-3">
              {/* Senior Citizen */}
              <label
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSenior
                    ? 'border-primary bg-sky-50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSenior}
                  onChange={(e) => setIsSenior(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary shrink-0"
                />
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-bold text-slate-900 block">
                    {t.seniorLabel}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {state.language === 'mr' ? 'रांगेत प्राधान्य दिले जाईल' : 'Queue priority & seating arrangement'}
                  </span>
                </div>
              </label>

              {/* Pregnant Mother */}
              <label
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isPregnant
                    ? 'border-primary bg-sky-50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary shrink-0"
                />
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-bold text-slate-900 block">
                    {t.pregnantLabel}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {state.language === 'mr' ? 'विशेष प्राधान्य व थेट तपासणी सवलत' : 'Special priority & direct consult'}
                  </span>
                </div>
              </label>

              {/* Emergency */}
              <label
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isEmergency
                    ? 'border-rose-500 bg-rose-50 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-rose-600 focus:ring-rose-500 shrink-0"
                />
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-bold text-rose-900 block">
                    {t.emergencyLabel}
                  </span>
                  <span className="text-xs text-rose-600 font-semibold block">
                    {state.language === 'mr' ? 'तातडीचे उपचार • शून्य प्रतीक्षा' : 'Immediate care • Zero wait'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Pictorial Symptom Picker */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-card">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              <span>{t.symptomSectionTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              {state.language === 'mr'
                ? 'योग्य विभाग व समांतर शेड्युलिंग सुचवण्यासाठी मदत होते.'
                : 'Helps in smart parallel lab scheduling.'}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {symptomList.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.label);
                return (
                  <button
                    type="button"
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.label)}
                    className={`min-h-[56px] p-2.5 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-primary bg-sky-50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{sym.icon}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                      {sym.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-calm-primary w-full text-lg py-3.5 min-h-[56px] rounded-2xl shadow-elevated disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>{state.language === 'mr' ? 'टोकन तयार होत आहे...' : 'Creating Token...'}</span>
              ) : (
                <>
                  <span>{t.submitCheckinBtn}</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-2.5">
              {t.checkinSuccessNote}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Ticket,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  QrCode,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Zap,
  PhoneCall,
  Activity,
  HeartHandshake,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { state, setLanguage } = useJourneyStore();
  const t = getTranslation(state.language);
  const [tokenSearchInput, setTokenSearchInput] = useState('');

  const activeHospital = state.hospitals.find((h) => h.id === state.hospitalId) || state.hospitals[0];

  const handleSearchToken = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenSearchInput.trim().toUpperCase();
    if (!clean) return;
    
    // Find patient by token
    const match = state.patients.find(
      (p) => p.tokenNumber.toUpperCase() === clean || p.id === clean
    );
    if (match) {
      router.push(`/journey/${match.id}`);
    } else {
      // Default redirect
      router.push(`/journey/patient_01`);
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 py-12 sm:py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Language Selection Header */}
          <div className="text-center mb-8">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
              {t.selectLanguage}
            </p>
            <div className="inline-flex flex-wrap justify-center gap-3 p-2 bg-white rounded-3xl shadow-sm border border-slate-200">
              <button
                onClick={() => setLanguage('mr')}
                className={`min-h-[48px] px-6 py-2.5 rounded-2xl text-lg font-bold transition-all ${
                  state.language === 'mr'
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                मराठी (महाराष्ट्र)
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`min-h-[48px] px-6 py-2.5 rounded-2xl text-lg font-bold transition-all ${
                  state.language === 'hi'
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`min-h-[48px] px-6 py-2.5 rounded-2xl text-lg font-bold transition-all ${
                  state.language === 'en'
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Active Hospital Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-xs text-sm font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{activeHospital.name[state.language]}</span>
              <span className="text-slate-400">•</span>
              <span className="text-primary font-bold">{activeHospital.district} जिल्हा</span>
            </div>
          </div>

          {/* Main Hero Header */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
              {t.landingHeroTitle}
            </h1>
            <p className="mt-5 text-lg sm:text-2xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
              {t.landingHeroDesc}
            </p>
          </div>

          {/* Big Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            <Link
              href="/checkin"
              className="btn-calm-primary w-full sm:w-auto text-xl py-4 px-8 min-h-[64px] shadow-elevated"
            >
              <QrCode className="w-7 h-7 text-sky-200" />
              <span>{t.getTokenBtn}</span>
              <ArrowRight className="w-6 h-6 ml-2" />
            </Link>

            <Link
              href="/specialists"
              className="btn-calm-secondary w-full sm:w-auto text-xl py-4 px-8 min-h-[64px]"
            >
              <Calendar className="w-6 h-6" />
              <span>{t.specialistDaysBtn}</span>
            </Link>
          </div>

          {/* Token Search Bar */}
          <div className="mt-10 max-w-md mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-card">
            <form onSubmit={handleSearchToken} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tokenSearchInput}
                  onChange={(e) => setTokenSearchInput(e.target.value)}
                  placeholder={t.quickTokenInputPlaceholder}
                  className="w-full pl-11 pr-3 py-2.5 text-base font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="btn-calm-primary min-h-[46px] px-5 py-2 text-base font-bold"
              >
                {t.checkTokenBtn}
              </button>
            </form>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 px-1">
              <span>डेमो टोकन वापरून पहा:</span>
              <div className="flex gap-1.5 font-mono font-bold text-primary">
                <button
                  type="button"
                  onClick={() => router.push('/journey/patient_01')}
                  className="underline hover:text-primary-hover"
                >
                  A-12 (लॅब समांतर)
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => router.push('/journey/patient_02')}
                  className="underline hover:text-primary-hover"
                >
                  A-05 (फार्मसी)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core USP Feature Cards */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {state.language === 'mr'
                ? 'जर्नी क्यू ग्रामीण रुग्णालयांचा वेळ कसा वाचवतो?'
                : state.language === 'hi'
                ? 'जर्नी क्यू अस्पताल में आपका समय कैसे बचाता है?'
                : 'How Journey Queue Eliminates 4-6 Hours of Rural Hospital Waiting'}
            </h2>
            <p className="mt-2 text-base text-slate-600">
              {state.language === 'mr'
                ? 'रुग्णालयातील ५ वेगवेगळ्या रांगांऐवजी १च डिजिटल अखंड प्रवास.'
                : state.language === 'hi'
                ? '५ अलग-अलग कतारों की जगह १ डिजिटल निर्बाध यात्रा।'
                : 'Connecting every step from Registration to Pharmacy into a single coordinated flow.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Parallel Scheduling */}
            <div className="card-calm p-6 border-l-4 border-l-sky-500 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {state.language === 'mr'
                  ? '१. समांतर शेड्युलिंग (Parallel Scheduling)'
                  : state.language === 'hi'
                  ? '१. समानांतर कतार (Parallel Scheduling)'
                  : '1. Parallel Queue Scheduling'}
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                {state.language === 'mr'
                  ? 'डॉक्टरांकडे ४० मिनिटे गर्दी असल्यास, प्रणाली रुग्णाला आधीच लॅब/एक्स-रेसाठी पाठवते. तुम्ही डॉक्टरांकडे पोहोचेपर्यंत रिपोर्ट तयार असतो!'
                  : state.language === 'hi'
                  ? 'डॉक्टर कतार में अधिक समय होने पर, प्रणाली मरीज को पहले लैब भेजती है। डॉक्टर के पास पहुंचने तक रिपोर्ट तैयार मिलती है।'
                  : 'If the doctor queue is backed up, patients are automatically routed to Lab/X-Ray first so diagnostics are ready when they enter consultation.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>सरासरी १ तास १५ मिनिटांची बचत</span>
              </div>
            </div>

            {/* Card 2: Auto-Handoff */}
            <div className="card-calm p-6 border-l-4 border-l-emerald-500 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {state.language === 'mr'
                  ? '२. स्वयंचलित औषध वितरण (Auto-Handoff)'
                  : state.language === 'hi'
                  ? '२. स्वचालित दवा वितरण (Auto-Handoff)'
                  : '2. Zero-Queue Prescription Auto-Handoff'}
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                {state.language === 'mr'
                  ? 'डॉक्टरांनी औषध लिहिल्यावर ते क्षणात फार्मसीमध्ये डिजिटल पोहोचते. औषधे पॅक होताच रुग्णाला काउंटर २ वर बोलावले जाते.'
                  : state.language === 'hi'
                  ? 'डॉक्टर का पर्चा तुरंत फार्मेसी काउंटर पर पहुंच जाता है। दवाएं तैयार होते ही मरीज को सीधे काउंटर पर बुलाया जाता है।'
                  : 'Doctors digital prescription alerts the pharmacy instantly. Medicine packs are prepared in advance with a 30-min collection timer.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>फार्मसी रांगेत पुन्हा उभे राहणे नाही</span>
              </div>
            </div>

            {/* Card 3: Rural First */}
            <div className="card-calm p-6 border-l-4 border-l-primary hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-primary flex items-center justify-center mb-4">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {state.language === 'mr'
                  ? '३. ग्रामीण-प्रथम रचना (Rural First Design)'
                  : state.language === 'hi'
                  ? '३. ग्रामीण-प्रथम डिजाइन (Rural First)'
                  : '3. Built for Rural Realities'}
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                {state.language === 'mr'
                  ? 'कोणतेही ॲप किंवा लॉगिन नाही. साध्या फोनवर मोफत SMS, लाऊडस्पीकरवर मराठीत आवाज, आणि ज्येष्ठ नागरिकांना खास प्राधान्य.'
                  : state.language === 'hi'
                  ? 'कोई ऐप या लॉगिन नहीं। साधारण फोन पर मुफ्त SMS, लाउडस्पीकर पर हिंदी में आवाज, और बुजुर्गों को विशेष प्राथमिकता।'
                  : 'Zero logins or app installs. Works on 2G feature phones with SMS fallbacks, loudspeaker voice calls, and senior citizen priority.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>साध्या फोनवर मिस्ड कॉलने टोकन</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Portals Bar */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {state.language === 'mr'
                    ? 'हॉस्पिटल स्टाफ व हॉल डिस्प्ले बोर्ड'
                    : state.language === 'hi'
                    ? 'अस्पताल स्टाफ एवं हॉल डिस्प्ले बोर्ड'
                    : 'Hospital Staff Portal & Hall TV Display'}
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  {state.language === 'mr'
                    ? 'स्टाफ डॅशबोर्डवरून रुग्ण बोलवा, थेट टीव्ही स्क्रीनवर मराठीत अनाउन्समेंट ऐका.'
                    : state.language === 'hi'
                    ? 'स्टाफ पोर्टल से मरीज बुलाएं और टीवी स्क्रीन पर स्वतः आवाज में घोषणाएं सुनें।'
                    : 'Call patients from the staff portal and watch real-time synchronisation across the hall TV board.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/staff"
                  className="btn-calm-secondary px-5 py-3 text-base font-bold min-h-[48px]"
                >
                  <Users className="w-5 h-5" />
                  <span>{t.staffLoginBtn}</span>
                </Link>
                <Link
                  href="/display"
                  className="btn-calm-secondary px-5 py-3 text-base font-bold min-h-[48px]"
                >
                  <Activity className="w-5 h-5 text-primary" />
                  <span>{t.navDisplay}</span>
                </Link>
                <Link
                  href="/demo"
                  className="btn-calm-primary px-5 py-3 text-base font-bold min-h-[48px] bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{t.navDemo}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

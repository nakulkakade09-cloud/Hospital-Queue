'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import {
  Calendar,
  ArrowRight,
  Sparkles,
  QrCode,
  Users,
  Search,
  Zap,
  PhoneCall,
  Activity,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { state, setLanguage } = useJourneyStore();
  const t = getTranslation(state.language);
  const [tokenSearchInput, setTokenSearchInput] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const activeHospital = state.hospitals.find((h) => h.id === state.hospitalId) || state.hospitals[0];

  const handleSearchToken = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenSearchInput.trim().toUpperCase();
    if (!clean) return;
    
    // Find patient by token or id
    const match = state.patients.find(
      (p) => p.tokenNumber.toUpperCase() === clean || p.id.toUpperCase() === clean
    );
    if (match) {
      router.push(`/journey/${match.id}`);
    } else {
      router.push(`/journey/${clean}`);
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 py-10 sm:py-14 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Language Selection Header */}
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              {t.selectLanguage}
            </p>
            <div className="inline-flex flex-wrap justify-center gap-2 p-1.5 bg-white rounded-2xl shadow-xs border border-slate-200">
              <button
                onClick={() => setLanguage('mr')}
                className={`min-h-[42px] px-5 py-2 rounded-xl text-base font-bold transition-all cursor-pointer ${
                  state.language === 'mr'
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                मराठी (महाराष्ट्र)
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`min-h-[42px] px-5 py-2 rounded-xl text-base font-bold transition-all cursor-pointer ${
                  state.language === 'hi'
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`min-h-[42px] px-5 py-2 rounded-xl text-base font-bold transition-all cursor-pointer ${
                  state.language === 'en'
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Active Hospital Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-200 shadow-xs text-xs sm:text-sm font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{activeHospital.name[state.language]}</span>
              <span className="text-slate-400">•</span>
              <span className="text-primary font-bold">{activeHospital.district} {t.districtLabel || 'जिल्हा'}</span>
            </div>
          </div>

          {/* Main Hero Header */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
              {t.landingHeroTitle}
            </h1>
            <p className="mt-4 text-base sm:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
              {t.landingHeroDesc}
            </p>
          </div>

          {/* Big Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <Link
              href="/checkin"
              className="btn-calm-primary w-full sm:w-auto text-lg sm:text-xl py-3.5 px-7 min-h-[56px] shadow-elevated"
            >
              <QrCode className="w-6 h-6 text-sky-200" />
              <span>{t.getTokenBtn}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              href="/qr"
              className="btn-calm-secondary w-full sm:w-auto text-base sm:text-lg py-3.5 px-6 min-h-[56px] flex items-center gap-2 border-2 border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100"
            >
              <div className="w-7 h-7 bg-white p-0.5 rounded-md border border-sky-300 shrink-0">
                {origin ? <QRCodeSVG value={origin} size={24} /> : <QrCode className="w-5 h-5" />}
              </div>
              <span className="font-bold">{t.qrTitle || 'Scan QR Poster'}</span>
            </Link>

            <Link
              href="/specialists"
              className="btn-calm-secondary w-full sm:w-auto text-base sm:text-lg py-3.5 px-6 min-h-[56px]"
            >
              <Calendar className="w-5 h-5" />
              <span>{t.specialistDaysBtn}</span>
            </Link>
          </div>

          {/* Token Search Bar */}
          <div className="mt-8 max-w-md mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-card">
            <form onSubmit={handleSearchToken} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tokenSearchInput}
                  onChange={(e) => setTokenSearchInput(e.target.value)}
                  placeholder={t.quickTokenInputPlaceholder}
                  className="w-full pl-11 pr-3 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="btn-calm-primary min-h-[42px] px-4 py-2 text-sm font-bold cursor-pointer"
              >
                {t.checkTokenBtn}
              </button>
            </form>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 px-1">
              <span>{state.language === 'mr' ? 'डेमो टोकन वापरून पहा:' : state.language === 'hi' ? 'डेमो टोकन देखें:' : 'Try demo tokens:'}</span>
              <div className="flex gap-2 font-mono font-bold text-primary">
                <button
                  type="button"
                  onClick={() => router.push('/journey/patient_01')}
                  className="underline hover:text-primary-hover cursor-pointer"
                >
                  A-12
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => router.push('/journey/patient_02')}
                  className="underline hover:text-primary-hover cursor-pointer"
                >
                  A-05
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core USP Feature Cards */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t.howItSavesTitle || 'How Journey Queue Eliminates 4-6 Hours of Rural Hospital Waiting'}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              {t.howItSavesDesc || 'Connecting every step from Registration to Pharmacy into a single coordinated flow.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Parallel Scheduling */}
            <div className="card-calm p-6 border-l-4 border-l-sky-500 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t.featureParallelTitle || '1. Parallel Queue Scheduling'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t.featureParallelDesc || 'If the doctor queue is backed up, patients are automatically routed to Lab/X-Ray first so diagnostics are ready when they enter consultation.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.featureParallelStat || 'Average 1 hour 15 minutes saved'}</span>
              </div>
            </div>

            {/* Card 2: Auto-Handoff */}
            <div className="card-calm p-6 border-l-4 border-l-emerald-500 hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t.featureHandoffTitle || '2. Zero-Queue Prescription Auto-Handoff'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t.featureHandoffDesc || 'Doctors digital prescription alerts the pharmacy instantly. Medicine packs are prepared in advance with a 30-min collection timer.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.featureHandoffStat || 'No standing in pharmacy line again'}</span>
              </div>
            </div>

            {/* Card 3: Rural First */}
            <div className="card-calm p-6 border-l-4 border-l-primary hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-primary flex items-center justify-center mb-4">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t.featureRuralTitle || '3. Built for Rural Realities'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t.featureRuralDesc || 'Zero logins or app installs. Works on 2G feature phones with SMS fallbacks, loudspeaker voice calls, and senior citizen priority.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.featureRuralStat || 'Missed call token on basic phones'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Portals Bar */}
      <section className="py-10 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {t.staffAndDisplayTitle || 'Hospital Staff Portal & Hall TV Display'}
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                  {t.staffAndDisplayDesc || 'Call patients from the staff portal and watch real-time synchronisation across the hall TV board.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/staff"
                  className="btn-calm-secondary px-5 py-2.5 text-sm font-bold min-h-[44px]"
                >
                  <Users className="w-4 h-4" />
                  <span>{t.staffLoginBtn}</span>
                </Link>
                <Link
                  href="/display"
                  className="btn-calm-secondary px-5 py-2.5 text-sm font-bold min-h-[44px]"
                >
                  <Activity className="w-4 h-4 text-primary" />
                  <span>{t.navDisplay}</span>
                </Link>
                <Link
                  href="/demo"
                  className="btn-calm-primary px-5 py-2.5 text-sm font-bold min-h-[44px] bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                >
                  <Sparkles className="w-4 h-4" />
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

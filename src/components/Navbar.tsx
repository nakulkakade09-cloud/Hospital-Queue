'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SmsSimulatorModal } from './SmsSimulatorModal';
import {
  Activity,
  Calendar,
  Layers,
  Tv,
  Users,
  Smartphone,
  RotateCcw,
  Menu,
  X,
  Compass,
  Building2,
  Ticket,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { state, resetDemoData, setHospitalId } = useJourneyStore();
  const t = getTranslation(state.language);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeHospital = state.hospitals.find((h) => h.id === state.hospitalId) || state.hospitals[0];

  const navLinks = [
    { href: '/', label: t.navHome, icon: Compass },
    { href: '/checkin', label: t.navCheckin, icon: Ticket },
    { href: '/journey/patient_01', label: t.navTracker, icon: Activity },
    { href: '/specialists', label: t.navSpecialists, icon: Calendar },
    { href: '/staff', label: t.navStaff, icon: Users },
    { href: '/display', label: t.navDisplay, icon: Tv },
    { href: '/demo', label: t.navDemo, icon: Layers, highlight: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        {/* Top Government Hospital Ribbon */}
        <div className="bg-primary text-white text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-medium tracking-wide">
                महाराष्ट्र शासन • सार्वजनिक आरोग्य विभाग • Nashik District Healthcare Network
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs font-semibold">
              <span className="text-sky-200">थेट जोडणी: सक्रिय</span>
              <span>हेल्पलाईन: १०८ / ०२५३-२५२११०</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Hospital Info */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-sky-600 flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {t.appTitle}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-extrabold bg-sky-100 text-primary border border-sky-200 rounded-lg">
                      SMART QUEUE
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 line-clamp-1">
                    {t.appSubtitle}
                  </p>
                </div>
              </Link>

              {/* Hospital Selector Dropdown */}
              <div className="hidden xl:flex items-center ml-4 pl-4 border-l border-slate-200">
                <Building2 className="w-4 h-4 text-primary mr-1.5" />
                <select
                  value={state.hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-xl cursor-pointer focus:ring-2 focus:ring-primary focus:outline-hidden"
                  aria-label="Select Hospital"
                >
                  {state.hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name[state.language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href.startsWith('/journey') && pathname.startsWith('/journey'));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-base font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-100 text-primary font-bold shadow-xs'
                        : link.highlight
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 hover:bg-amber-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions: Language Switcher, SMS Sim, Reset */}
            <div className="flex items-center gap-2.5">
              <LanguageSwitcher />

              {/* SMS Simulator Trigger */}
              <button
                onClick={() => setIsSmsOpen(true)}
                className="relative min-h-[44px] px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl hover:bg-emerald-100 text-sm font-bold flex items-center gap-1.5 transition-colors"
                title="View SMS simulator for feature phone users"
              >
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span className="hidden sm:inline">{t.smsSimulator}</span>
                {state.smsAlerts.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {state.smsAlerts.length}
                  </span>
                )}
              </button>

              {/* Reset Demo Data Button */}
              <button
                onClick={() => {
                  if (confirm('सर्व डेमो डेटा पूर्ववत (Reset) करायचा का?')) {
                    resetDemoData();
                  }
                }}
                className="min-h-[44px] p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors"
                title="Reset Demo Data"
                aria-label="Reset Demo Data"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden min-h-[44px] p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-2">
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                रुग्णालय (Hospital)
              </label>
              <select
                value={state.hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full text-sm font-bold bg-slate-100 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl"
              >
                {state.hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name[state.language]}
                  </option>
                ))}
              </select>
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold ${
                    isActive ? 'bg-sky-100 text-primary' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* SMS Simulator Modal */}
      <SmsSimulatorModal isOpen={isSmsOpen} onClose={() => setIsSmsOpen(false)} />
    </>
  );
};

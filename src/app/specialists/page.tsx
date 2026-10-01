'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { SpecialistDoctor } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  ArrowRight,
  Filter,
  Building2,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

export default function SpecialistCalendarPage() {
  const router = useRouter();
  const {
    state,
    setHospitalId,
    bookSpecialist,
    cancelSpecialistSession,
    restoreSpecialistSession,
  } = useJourneyStore();
  const t = getTranslation(state.language);

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [activeBookingDoctor, setActiveBookingDoctor] = useState<SpecialistDoctor | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [bookingSuccessToken, setBookingSuccessToken] = useState<string | null>(null);

  // Filter specialists by hospital and specialty
  const filteredSpecialists = state.specialists.filter((spec) => {
    const matchHospital = spec.hospitalId === state.hospitalId;
    const matchSpecialty = selectedSpecialty === 'all' || spec.specialtyKey === selectedSpecialty;
    return matchHospital && matchSpecialty;
  });

  const specialties = [
    { key: 'all', label: t.allSpecialties },
    { key: 'eye', label: t.eyeSpecialist },
    { key: 'ortho', label: t.orthoSpecialist },
    { key: 'peds', label: t.pedsSpecialist },
    { key: 'gyn', label: t.gynSpecialist },
    { key: 'ent', label: t.entSpecialist },
    { key: 'skin', label: t.skinSpecialist },
  ];

  const handleOpenBooking = (doc: SpecialistDoctor) => {
    setActiveBookingDoctor(doc);
    setBookingDate(doc.nextAvailableDate);
    setSelectedSlot(doc.availableSlots[0] || '');
    setBookingSuccessToken(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingDoctor || !patientName.trim()) return;

    const newPatient = bookSpecialist({
      specialistId: activeBookingDoctor.id,
      patientName: patientName.trim(),
      mobile: patientMobile.trim() || '9822012345',
      date: bookingDate,
      timeSlot: selectedSlot || '10:00 AM',
    });

    if (newPatient) {
      setBookingSuccessToken(newPatient.tokenNumber);
      setTimeout(() => {
        router.push(`/journey/${newPatient.id}`);
      }, 1200);
    }
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-primary font-bold text-xs rounded-full mb-3">
                <Calendar className="w-3.5 h-3.5" />
                <span>ग्रामीण फिरते तज्ज्ञ डॉक्टर वेळापत्रक</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
                {t.specialistTitle}
              </h1>
              <p className="text-slate-600 text-base mt-2 max-w-3xl">
                {t.specialistSubtitle}
              </p>
            </div>

            {/* Hospital Selector */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {t.selectHospital}
              </label>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <select
                  value={state.hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="bg-white border-2 border-slate-200 font-bold text-base text-slate-800 rounded-xl px-3 py-2 cursor-pointer focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  {state.hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name[state.language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Specialty Filter Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              {t.filterSpecialty}
            </span>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSpecialty(s.key)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedSpecialty === s.key
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cancellation Protection Notice Banner */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-900">
              {t.doctorCancelledBanner}
            </p>
          </div>
          <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-3 py-1 rounded-full whitespace-nowrap hidden sm:inline">
            Zero-Wasted Rural Trip
          </span>
        </div>

        {/* Specialist Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialists.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
              <p className="text-lg font-bold">या रुग्णालयात या विभागाचे डॉक्टर उपलब्ध नाहीत.</p>
              <p className="text-sm mt-1">कृपया दुसरा विभाग किंवा शेजारील तालुका रुग्णालय निवडा.</p>
            </div>
          ) : (
            filteredSpecialists.map((doc) => {
              const isTodayCancelled = doc.cancelledDates.includes(doc.nextAvailableDate);
              const remainingSlots = doc.availableSlots.length;

              return (
                <div
                  key={doc.id}
                  className={`card-calm p-6 flex flex-col justify-between transition-all ${
                    isTodayCancelled
                      ? 'border-rose-300 bg-rose-50/40'
                      : 'hover:shadow-card hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    {/* Specialty & Hospital */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 bg-sky-100 text-primary text-xs font-black rounded-lg">
                        {doc.specialtyLabel[state.language]}
                      </span>
                      {isTodayCancelled ? (
                        <StatusBadge level="red" text="सत्र रद्द (Cancelled)" size="sm" />
                      ) : (
                        <StatusBadge
                          level="green"
                          text={`${remainingSlots} ${t.slotsRemaining}`}
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Doctor Name & Specialty */}
                    <h2 className="text-xl font-black text-slate-900">{doc.name}</h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {doc.specialty}
                    </p>

                    {/* Visit Days */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">{t.visitingDays}</span>
                        <span className="font-bold text-slate-800">
                          {state.language === 'mr'
                            ? doc.visitDaysMr.join(', ')
                            : state.language === 'hi'
                            ? doc.visitDaysHi.join(', ')
                            : doc.visitDays.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">वेळ:</span>
                        <span className="font-semibold text-slate-700">{doc.timings}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-500">{t.nextAvailable}</span>
                        <span className="font-bold text-primary font-mono">
                          {doc.nextAvailableDayLabel[state.language]}
                        </span>
                      </div>
                    </div>

                    {/* Cancellation Alert Message if active */}
                    {isTodayCancelled && (
                      <div className="mt-3 p-3 bg-rose-100 text-rose-900 rounded-xl text-xs font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <span>आजचे सत्र रद्द झाले आहे. सर्व नोंदणीकृत रुग्णांना SMS पाठवला गेला आहे.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => handleOpenBooking(doc)}
                      disabled={isTodayCancelled}
                      className={`btn-calm-primary w-full text-base font-bold min-h-[48px] ${
                        isTodayCancelled
                          ? 'opacity-40 cursor-not-allowed bg-slate-400'
                          : 'shadow-md shadow-primary/20'
                      }`}
                    >
                      <Calendar className="w-5 h-5 text-sky-200" />
                      <span>{t.bookSlotBtn}</span>
                    </button>

                    {/* Admin Cancellation Simulator Button */}
                    <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>परीक्षक डेमो:</span>
                      {isTodayCancelled ? (
                        <button
                          onClick={() => restoreSpecialistSession(doc.id, doc.nextAvailableDate)}
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.restoreDoctorBtn}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => cancelSpecialistSession(doc.id, doc.nextAvailableDate)}
                          className="font-bold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{t.simulateCancelBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Booking Modal */}
        {activeBookingDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {activeBookingDoctor.name}
              </h2>
              <p className="text-xs font-bold text-primary">
                {activeBookingDoctor.specialty} • {activeBookingDoctor.nextAvailableDayLabel[state.language]}
              </p>

              {bookingSuccessToken ? (
                <div className="my-8 text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {t.bookingConfirmed}
                  </h3>
                  <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 inline-block font-mono text-3xl font-black text-primary">
                    {bookingSuccessToken}
                  </div>
                  <p className="text-xs text-slate-500">
                    रुग्ण प्रवास ट्रॅकर उघडत आहे...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConfirmBooking} className="mt-5 space-y-4">
                  {/* Time Slot Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                      वेळ निवडा (Available Slots):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {activeBookingDoctor.availableSlots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`min-h-[44px] py-2 text-xs font-mono font-bold rounded-xl border-2 transition-all ${
                            selectedSlot === slot
                              ? 'border-primary bg-sky-50 text-primary shadow-xs'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patient Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      {t.patientNameLabel}
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="उदा. सखाराम शिंदे"
                        className="w-full pl-10 pr-3 py-2.5 text-base font-bold border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      {t.mobileLabel}
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={patientMobile}
                        onChange={(e) => setPatientMobile(e.target.value)}
                        placeholder="9822012345"
                        className="w-full pl-10 pr-3 py-2.5 text-base font-bold font-mono border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Modal Footer Buttons */}
                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveBookingDoctor(null)}
                      className="btn-calm-secondary flex-1 min-h-[48px] text-base"
                    >
                      रद्द करा
                    </button>
                    <button
                      type="submit"
                      className="btn-calm-primary flex-1 min-h-[48px] text-base shadow-elevated"
                    >
                      <span>टोकन निश्चित करा</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

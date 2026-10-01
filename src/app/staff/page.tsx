'use client';

import React, { useState } from 'react';
import { useJourneyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { DepartmentType, PriorityLevel, PrescriptionItem } from '@/types';
import {
  evaluateLoadBalancing,
  estimateDepartmentWait,
  getQueueStatusInfo,
  checkPrescriptionExpiryStatus,
} from '@/lib/rulesEngine';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Users,
  Activity,
  Clock,
  UserCheck,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  FilePlus,
  Pill,
  ArrowRight,
  ShieldAlert,
  Heart,
  Baby,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function StaffDashboardPage() {
  const {
    state,
    callNextPatient,
    completeStep,
    orderLabTest,
    submitPrescription,
    markPrescriptionReady,
    dispensePrescription,
  } = useJourneyStore();

  const t = getTranslation(state.language);
  const [activeTab, setActiveTab] = useState<'queue' | 'doctor' | 'pharmacy'>('queue');
  const [selectedDoctorPatientId, setSelectedDoctorPatientId] = useState<string>('patient_01');
  const [newTestInput, setNewTestInput] = useState('CBC व रक्तातील साखर (CBC & Blood Sugar)');
  const [activeMedicationInput, setActiveMedicationInput] = useState('टॅब. सिप्रोफ्लॉक्सासिन ५०० (Tab Cipro 500mg)');

  // Selected patient for doctor consultation
  const activeConsultationPatient =
    state.patients.find((p) => p.id === selectedDoctorPatientId) || state.patients[0];

  // Top Summary Calculations
  const waitingPatientsCount = state.patients.filter((p) => p.status !== 'completed').length;
  const avgWait = Math.round(
    state.patients.reduce((sum, p) => sum + p.totalEstimatedWaitMinutes, 0) /
      Math.max(1, state.patients.length)
  );

  // Load balancing check between OPD 1 and OPD 2
  const opd1 = state.departments.find((d) => d.id === 'opd_1')!;
  const opd2 = state.departments.find((d) => d.id === 'opd_2')!;
  const loadBalanceResult = evaluateLoadBalancing(opd1, opd2);

  // Handle Order Test Action
  const handleOrderTest = () => {
    if (!activeConsultationPatient || !newTestInput) return;
    orderLabTest(activeConsultationPatient.id, newTestInput);
    alert(
      state.language === 'mr'
        ? `टेस्ट ऑर्डर केली: ${newTestInput}. रुग्ण लॅब रांगेत आपोआप जोडला गेला.`
        : `Test ordered: ${newTestInput}. Patient auto-routed to Lab queue.`
    );
  };

  // Handle Submit Prescription Action
  const handleSubmitPrescription = () => {
    if (!activeConsultationPatient) return;
    const items: PrescriptionItem[] = [
      {
        name: activeMedicationInput,
        dosage: '१ गोळी दिवसातून २ वेळा',
        duration: '५ दिवस',
        instructions: 'जेवणानंतर',
      },
      {
        name: 'टॅब. व्हिटॅमिन B Complex',
        dosage: '१ गोळी रोज दुपारी',
        duration: '१० दिवस',
        instructions: 'पाण्यासोबत',
      },
    ];

    submitPrescription(activeConsultationPatient.id, 'डॉ. सचिन पाटील (OPD 1)', items);
    alert(
      state.language === 'mr'
        ? 'प्रिस्क्रिप्शन डिजिटल पाठवले! फार्मसी काउंटरवर तयार होत आहे.'
        : 'Prescription sent digitally! Pharmacy is preparing medication.'
    );
  };

  return (
    <div className="py-6 sm:py-8 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-primary font-bold text-xs rounded-full mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>थेट रुग्णालय नियंत्रण कक्ष (Live Staff Terminal)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {t.staffTitle}
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              {t.staffSubtitle}
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'queue'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              रांग नियंत्रण (Queues)
            </button>
            <button
              onClick={() => setActiveTab('doctor')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'doctor'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              डॉक्टर कन्सल्ट (Doctor)
            </button>
            <button
              onClick={() => setActiveTab('pharmacy')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pharmacy'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>फार्मसी (Pharmacy)</span>
              {state.prescriptions.filter((r) => r.status === 'preparing').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </button>
          </div>
        </div>

        {/* Load Balancing Recommendation Banner (Core Rules Engine Result) */}
        {loadBalanceResult.needed && (
          <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl shadow-md flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-200 shrink-0" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                  {t.loadBalanceAlert}
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {loadBalanceResult.message[state.language]}
                </p>
              </div>
            </div>
            <button
              onClick={() => callNextPatient('opd_2')}
              className="px-4 py-2 bg-white text-amber-900 rounded-xl font-bold text-xs shadow-xs hover:bg-amber-50 whitespace-nowrap"
            >
              OPD 2 मध्ये रुग्ण वळवा
            </button>
          </div>
        )}

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t.waitingPatients}</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-black text-slate-900 font-mono">
              {waitingPatientsCount}
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">सर्व विभागांमध्ये मिळून</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t.avgWaitTime}</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 font-mono">
              {avgWait} {t.minutes}
            </p>
            <p className="text-xs text-emerald-600 font-bold mt-1">↓ ४५% वेळेची बचत</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t.idleDoctors}</span>
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-600 font-mono">१ / ७</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">OPD 2 लगेच उपलब्ध</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t.busiestDept}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-700">OPD 1</p>
            <p className="text-xs text-rose-600 font-semibold mt-1">९ रुग्ण प्रतीक्षेत (४० मि.)</p>
          </div>
        </div>

        {/* Department Status Strip */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900">
              विभागनिहाय थेट प्रतीक्षा वेळ व गर्दी स्थिती
            </h2>
            <span className="text-xs text-slate-400">दर १० सेकंदांनी अद्ययावत</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {state.departments.slice(0, 6).map((dept) => {
              const waitMins = estimateDepartmentWait(
                dept.currentQueueLength,
                dept.avgConsultMins,
                dept.activeStaff
              );
              const info = getQueueStatusInfo(waitMins);

              return (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-700 line-clamp-1 block">
                      {dept.name[state.language]}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {dept.roomNumber}
                    </span>
                    <div className="my-2">
                      <span className="text-2xl font-black font-mono text-slate-900">
                        {waitMins}
                      </span>
                      <span className="text-xs font-bold text-slate-500 ml-1">{t.minutes}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <StatusBadge level={info.level} text={info.label[state.language]} size="sm" />
                    <button
                      onClick={() => callNextPatient(dept.id)}
                      className="w-full py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t.callNextBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TAB 1: QUEUE MANAGEMENT TABLE */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  सक्रिय रुग्ण रांग (स्मार्ट प्राधान्य क्रम)
                </h2>
                <p className="text-xs text-slate-500">
                  Emergency (१००० गुण) &gt; Pregnant (५०० गुण) &gt; Senior (२५० गुण) &gt; Normal (१०० गुण)
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => callNextPatient('opd_1')}
                  className="btn-calm-primary py-2 px-4 text-xs font-bold min-h-[40px]"
                >
                  <Volume2 className="w-4 h-4 text-sky-200" />
                  <span>OPD 1 पुढील रुग्ण</span>
                </button>
                <button
                  onClick={() => callNextPatient('lab')}
                  className="btn-calm-secondary py-2 px-4 text-xs font-bold min-h-[40px]"
                >
                  <span>लॅब पुढील रुग्ण</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">टोकन</th>
                    <th className="py-3 px-4">रुग्णाचे नाव</th>
                    <th className="py-3 px-4">प्राधान्य</th>
                    <th className="py-3 px-4">सध्याचा विभाग</th>
                    <th className="py-3 px-4">अपेक्षित वेळ</th>
                    <th className="py-3 px-4">स्थिती</th>
                    <th className="py-3 px-4 text-right">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {state.patients.map((p) => {
                    const step = p.steps[p.currentStepIndex] || p.steps[0];
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          p.priorityLevel === 'emergency' ? 'bg-rose-50/50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-black text-base text-primary">
                          {p.tokenNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {p.patientName}
                          {p.isParallelScheduled && (
                            <span className="block text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                              <Zap className="w-3 h-3" /> समांतर शेड्युलिंग (लॅब आधी)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.priorityLevel === 'emergency' && (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-black flex items-center gap-1 w-fit">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{t.priorityEmergency}</span>
                            </span>
                          )}
                          {p.priorityLevel === 'pregnant' && (
                            <span className="px-2.5 py-1 bg-pink-100 text-pink-800 rounded-lg text-xs font-black flex items-center gap-1 w-fit">
                              <Baby className="w-3.5 h-3.5" />
                              <span>{t.priorityPregnant}</span>
                            </span>
                          )}
                          {p.priorityLevel === 'senior' && (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black flex items-center gap-1 w-fit">
                              <Heart className="w-3.5 h-3.5" />
                              <span>{t.prioritySenior}</span>
                            </span>
                          )}
                          {p.priorityLevel === 'normal' && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold w-fit">
                              {t.priorityNormal}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {step.departmentName[state.language]}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          ~ {p.totalEstimatedWaitMinutes} {t.minutes}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === 'completed' ? (
                            <StatusBadge level="green" text="पूर्ण झाले" size="sm" />
                          ) : (
                            <StatusBadge
                              level={p.status === 'in_consultation' || p.status === 'in_lab' ? 'info' : 'amber'}
                              text={p.status}
                              size="sm"
                            />
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => completeStep(p.id)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
                          >
                            {t.doneBtn}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR CONSULTATION VIEW (AUTO-HANDOFF TO LAB & PHARMACY) */}
        {activeTab === 'doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Selector */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
              <h2 className="text-lg font-black text-slate-900 mb-3">
                तपासणीसाठी रुग्ण निवडा
              </h2>
              <div className="space-y-2">
                {state.patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedDoctorPatientId(p.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      selectedDoctorPatientId === p.id
                        ? 'border-primary bg-sky-50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-primary">{p.tokenNumber}</span>
                      <span className="text-xs font-bold text-slate-500">{p.priorityLevel}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-1">{p.patientName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      लक्षणे: {p.symptoms?.join(', ') || 'सामान्य ताप'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor Desk / Auto Handoff Controls */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500">
                    सध्या तपासणी सुरू असलेला रुग्ण:
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                    {activeConsultationPatient.patientName} ({activeConsultationPatient.tokenNumber})
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">तपासणी डॉक्टर:</span>
                  <p className="font-bold text-slate-800">डॉ. सचिन पाटील (OPD 1)</p>
                </div>
              </div>

              {/* Action 1: Order Test (Auto-Handoff to Lab) */}
              <div className="p-5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-primary" />
                  <h4 className="text-base font-bold text-slate-900">
                    १. लॅब टेस्ट पाठवा (Auto-Handoff to Lab Queue)
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  रुग्णाला पुन्हा लॅब रांगेत उभे राहावे लागत नाही. प्रणाली थेट लॅबमध्ये नाव पाठवेल.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTestInput}
                    onChange={(e) => setNewTestInput(e.target.value)}
                    placeholder="उदा. रक्त तपासणी CBC, मलेरिया टेस्ट, एक्स-रे"
                    className="flex-1 px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleOrderTest}
                    className="btn-calm-primary px-4 py-2 text-xs font-bold whitespace-nowrap min-h-[42px]"
                  >
                    {t.orderTestBtn}
                  </button>
                </div>
              </div>

              {/* Action 2: Digital Prescription (Auto-Handoff to Pharmacy) */}
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-700" />
                  <h4 className="text-base font-bold text-slate-900">
                    २. डिजिटल प्रिस्क्रिप्शन पाठवा (Auto-Handoff to Pharmacy)
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  औषधे थेट मोफत औषधालय स्क्रीनवर पाठवली जातील आणि फार्मसी पॅकिंग सुरू करेल.
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={activeMedicationInput}
                    onChange={(e) => setActiveMedicationInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleSubmitPrescription}
                    className="btn-calm-primary w-full py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 min-h-[44px]"
                  >
                    {t.submitPrescriptionBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PHARMACY VIEW (30-MIN AUTO-EXPIRY) */}
        {activeTab === 'pharmacy' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {t.prescriptionsTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  तयार झालेल्या औषधांसाठी ३० मिनिटांची मुदत. मुदतीनंतर आपोआप सूचना जाते.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span>तयार होत आहे (Preparing)</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 ml-2"></span>
                <span>घेण्यासाठी तयार (Ready)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.prescriptions.map((rx) => {
                const expiryInfo = checkPrescriptionExpiryStatus(rx);
                return (
                  <div
                    key={rx.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                      rx.status === 'ready'
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : rx.status === 'dispensed'
                        ? 'border-slate-200 bg-slate-50 opacity-70'
                        : 'border-amber-300 bg-amber-50/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono font-black text-base text-primary">
                          {rx.tokenNumber}
                        </span>
                        {rx.status === 'ready' && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {t.expiryWarning} {expiryInfo.minutesRemaining} मि.
                          </span>
                        )}
                        {rx.status === 'preparing' && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md animate-pulse">
                            तयार होत आहे
                          </span>
                        )}
                        {rx.status === 'dispensed' && (
                          <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                            दिले (Dispensed)
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-slate-900">{rx.patientName}</h4>
                      <p className="text-xs text-slate-500">{rx.doctorName}</p>

                      <div className="mt-3 p-3 bg-white/80 rounded-xl border border-slate-200/80 space-y-1.5">
                        {rx.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-bold text-slate-800">• {item.name}</span>
                            <span className="text-slate-500 block pl-2">
                              {item.dosage} ({item.duration})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex gap-2">
                      {rx.status === 'preparing' && (
                        <button
                          onClick={() => markPrescriptionReady(rx.id)}
                          className="btn-calm-primary w-full py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 min-h-[40px]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t.markReadyBtn}</span>
                        </button>
                      )}
                      {rx.status === 'ready' && (
                        <button
                          onClick={() => dispensePrescription(rx.id)}
                          className="btn-calm-primary w-full py-2 text-xs font-bold min-h-[40px]"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>{t.dispenseBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

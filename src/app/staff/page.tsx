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
import { sendSmsNotification } from '@/lib/sms';
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
  Phone,
  Send,
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

  // Test SMS states
  const [testNumber, setTestNumber] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{ ok: boolean; msg: string } | null>(null);

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

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testNumber.trim()) return;

    setSmsSending(true);
    setSmsResult(null);

    const testMsg =
      state.language === 'mr'
        ? `[जर्नी क्यू - सिन्नर रुग्णालय] ही चाचणी सूचना आहे. आपली प्रणाली सक्रिय आहे!`
        : state.language === 'hi'
        ? `[जर्नी क्यू - सिन्नर अस्पताल] यह परीक्षण सूचना है। आपकी प्रणाली सक्रिय है!`
        : `[Journey Queue - Sinnar Hospital] Test SMS notification. System active!`;

    const res = await sendSmsNotification(testNumber.trim(), testMsg);
    setSmsSending(false);
    if (res.ok) {
      setSmsResult({
        ok: true,
        msg: t.testSmsSent || 'Test SMS sent!',
      });
    } else {
      setSmsResult({
        ok: false,
        msg: res.error ? `${t.testSmsFailed || 'SMS Failed'}: ${res.error}` : (t.testSmsFailed || 'SMS failed'),
      });
    }
  };

  // Handle Order Test Action
  const handleOrderTest = () => {
    if (!activeConsultationPatient || !newTestInput) return;
    orderLabTest(activeConsultationPatient.id, newTestInput);
    alert(t.testOrderedAlert || 'Test ordered. Patient auto-routed to Lab queue.');
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

    submitPrescription(activeConsultationPatient.id, t.consultDoctorName || 'डॉ. सचिन पाटील (OPD 1)', items);
    alert(t.rxSentAlert || 'Prescription sent digitally! Pharmacy is preparing medication.');
  };

  return (
    <div className="py-6 sm:py-8 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-primary font-bold text-xs rounded-full mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t.liveStaffTerminal || 'Live Staff Terminal'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {t.staffTitle}
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              {t.staffSubtitle}
            </p>
          </div>

          {/* Navigation Sub-Tabs & Test SMS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.tabQueues || 'Queue Control'}
              </button>
              <button
                onClick={() => setActiveTab('doctor')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'doctor'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.tabDoctor || 'Doctor Consult'}
              </button>
              <button
                onClick={() => setActiveTab('pharmacy')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'pharmacy'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t.tabPharmacy || 'Pharmacy'}</span>
                {state.prescriptions.filter((r) => r.status === 'preparing').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Test SMS Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-sm font-bold text-slate-900 block">{t.sendTestSms || 'Send Test SMS'}</span>
              <span className="text-xs text-slate-500">Twilio API Live Dispatch (+91)</span>
            </div>
          </div>
          <form onSubmit={handleSendTestSms} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input
              type="tel"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder={t.testSmsNumber || '10-digit mobile number'}
              className="min-h-[42px] px-3 py-1.5 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary w-full sm:w-56"
            />
            <button
              type="submit"
              disabled={smsSending || !testNumber.trim()}
              className="btn-calm-primary min-h-[42px] px-4 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{smsSending ? 'Sending...' : (t.sendTestSms || 'Send SMS')}</span>
            </button>
            {smsResult && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  smsResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {smsResult.msg}
              </span>
            )}
          </form>
        </div>

        {/* Load Balancing Recommendation Banner */}
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
              className="px-4 py-2 bg-white text-amber-900 rounded-xl font-bold text-xs shadow-xs hover:bg-amber-50 whitespace-nowrap cursor-pointer"
            >
              {t.redirectToOpd2 || 'Redirect to OPD 2'}
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
            <p className="text-xs text-slate-400 font-semibold mt-1">{t.acrossAllDepts || 'Across all departments'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t.avgWaitTime}</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 font-mono">
              {avgWait} {t.minutes}
            </p>
            <p className="text-xs text-emerald-600 font-bold mt-1">{t.timeSavedPercent || '↓ 45% time saved'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t.idleDoctors}</span>
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-600 font-mono">{t.idleDoctorsValue || '1 / 7'}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">{t.idleDoctorsNote || 'OPD 2 available immediately'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t.busiestDept}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-700">{t.busiestDeptValue || 'OPD 1'}</p>
            <p className="text-xs text-rose-600 font-semibold mt-1">{t.busiestDeptNote || '9 patients waiting (40 min)'}</p>
          </div>
        </div>

        {/* Department Status Strip */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900">
              {t.deptWaitTitle || 'Department-wise Live Wait Time & Crowd Status'}
            </h2>
            <span className="text-xs text-slate-400">{t.updatesEvery10s || 'Updates every 10 seconds'}</span>
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
                      className="w-full py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer"
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
                  {t.activeQueueTitle || 'Active Patient Queue (Smart Priority Order)'}
                </h2>
                <p className="text-xs text-slate-500">
                  {t.priorityScoreDesc || 'Emergency (1000) > Pregnant (500) > Senior (250) > Normal (100)'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => callNextPatient('opd_1')}
                  className="btn-calm-primary py-2 px-4 text-xs font-bold min-h-[40px] cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-sky-200" />
                  <span>{t.opdNextPatient || 'OPD 1 Next Patient'}</span>
                </button>
                <button
                  onClick={() => callNextPatient('lab')}
                  className="btn-calm-secondary py-2 px-4 text-xs font-bold min-h-[40px] cursor-pointer"
                >
                  <span>{t.labNextPatient || 'Lab Next Patient'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">{t.thToken || 'Token'}</th>
                    <th className="py-3 px-4">{t.thName || 'Patient Name'}</th>
                    <th className="py-3 px-4">{t.thPriority || 'Priority'}</th>
                    <th className="py-3 px-4">{t.thDept || 'Current Dept'}</th>
                    <th className="py-3 px-4">{t.thTime || 'Est. Time'}</th>
                    <th className="py-3 px-4">{t.thStatus || 'Status'}</th>
                    <th className="py-3 px-4 text-right">{t.thAction || 'Action'}</th>
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
                              <Zap className="w-3 h-3" /> {t.parallelSchedulingNote || 'Parallel Scheduling (Lab First)'}
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
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {step?.departmentName[state.language]}
                          <span className="text-xs text-slate-400 block font-mono">
                            {step?.counterNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {p.totalEstimatedWaitMinutes} {t.minutes}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.status === 'in_consultation'
                                ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                : p.status === 'in_lab'
                                ? 'bg-purple-100 text-purple-800'
                                : p.status === 'completed'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.status !== 'completed' ? (
                            <button
                              onClick={() => completeStep(p.id)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.doneBtn}</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">{t.completed || 'Completed'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR CONSULTATION & AUTO-HANDOFF */}
        {activeTab === 'doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Select Patient */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
              <h3 className="text-lg font-black text-slate-900 mb-3">
                {t.selectPatientForConsult || 'Select patient for consultation'}
              </h3>
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {state.patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedDoctorPatientId(p.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeConsultationPatient?.id === p.id
                        ? 'border-primary bg-sky-50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-primary">{p.tokenNumber}</span>
                      <span className="text-xs font-bold text-slate-500">{p.priorityLevel}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">{p.patientName}</p>
                    <p className="text-xs text-slate-500">
                      {t.symptoms || 'Symptoms:'} {p.symptoms?.join(', ') || t.defaultSymptom || 'General fever'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Consultation & 2 Instant Auto-Handoff Actions */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
              <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                    {t.currentlyConsulting || 'Currently consulting patient:'}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">
                    {activeConsultationPatient?.patientName} ({activeConsultationPatient?.tokenNumber})
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{t.consultingDoctor || 'Consulting doctor:'}</span>
                  <span className="text-sm font-bold text-slate-800">{t.consultDoctorName || 'Dr. Sachin Patil (OPD 1)'}</span>
                </div>
              </div>

              {/* AUTO-HANDOFF 1: Lab Test Ordering */}
              <div className="p-5 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center gap-2 text-purple-900 font-black text-base">
                  <FilePlus className="w-5 h-5 text-purple-700" />
                  <span>{t.labAutoHandoffTitle || '1. Order Lab Test (Auto-Handoff to Lab Queue)'}</span>
                </div>
                <p className="text-xs text-purple-700">
                  {t.labAutoHandoffDesc || 'Patient does not need to stand in line again. System sends name directly to lab.'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTestInput}
                    onChange={(e) => setNewTestInput(e.target.value)}
                    placeholder={t.labTestPlaceholder || 'e.g. CBC, Malaria Test, X-Ray'}
                    className="flex-1 px-4 py-2.5 bg-white border border-purple-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleOrderTest}
                    className="btn-calm-primary py-2.5 px-5 text-sm font-bold bg-purple-700 hover:bg-purple-800 shadow-purple-700/20 whitespace-nowrap min-h-[44px] cursor-pointer"
                  >
                    {t.orderTestBtn}
                  </button>
                </div>
              </div>

              {/* AUTO-HANDOFF 2: Digital Prescription Submit */}
              <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
                  <Pill className="w-5 h-5 text-emerald-700" />
                  <span>{t.rxAutoHandoffTitle || '2. Submit Digital Prescription (Auto-Handoff to Pharmacy)'}</span>
                </div>
                <p className="text-xs text-emerald-700">
                  {t.rxAutoHandoffDesc || 'Medicines sent directly to pharmacy screen. Pharmacy starts packing immediately.'}
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={activeMedicationInput}
                    onChange={(e) => setActiveMedicationInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSubmitPrescription}
                    className="btn-calm-primary w-full py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 min-h-[44px] cursor-pointer"
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
                  {t.pharmacyExpiryDesc || '30-minute collection window for ready medicines. Auto-notification after expiry.'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span>{t.preparing || 'Preparing'}</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 ml-2"></span>
                <span>{t.readyForPickup || 'Ready'}</span>
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
                            {t.expiryWarning} {expiryInfo.minutesRemaining} {t.minutes}
                          </span>
                        )}
                        {rx.status === 'preparing' && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md animate-pulse">
                            {t.preparing || 'Preparing'}
                          </span>
                        )}
                        {rx.status === 'dispensed' && (
                          <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                            {t.dispensed || 'Dispensed'}
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
                          className="btn-calm-primary w-full py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 min-h-[40px] cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t.markReadyBtn}</span>
                        </button>
                      )}
                      {rx.status === 'ready' && (
                        <button
                          onClick={() => dispensePrescription(rx.id)}
                          className="btn-calm-primary w-full py-2 text-xs font-bold min-h-[40px] cursor-pointer"
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

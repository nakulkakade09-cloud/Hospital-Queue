'use client';

import React, { useState } from 'react';
import { useJourneyStore } from '@/lib/store';
import { Smartphone, X, PhoneCall, MessageSquare, Bell, ArrowRight, ShieldCheck } from 'lucide-react';

interface SmsSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmsSimulatorModal: React.FC<SmsSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { state, simulateMissedCallCheckin } = useJourneyStore();
  const [phoneNumberInput, setPhoneNumberInput] = useState('9822055667');
  const [justSimulated, setJustSimulated] = useState(false);

  if (!isOpen) return null;

  const handleMissedCall = () => {
    simulateMissedCallCheckin(phoneNumberInput);
    setJustSimulated(true);
    setTimeout(() => setJustSimulated(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden">
        {/* Phone Top Notch Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm tracking-wide">
              {state.language === 'mr' ? 'ग्रामीण SMS व मिस्ड कॉल सिम्युलेटर' : state.language === 'hi' ? 'SMS एवं मिस्ड कॉल सिम्युलेटर' : 'Rural SMS & Missed Call Sim'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Phone Screen Preview */}
        <div className="bg-slate-100 p-4 border-b border-slate-200">
          <div className="bg-emerald-700 text-white p-3 rounded-2xl shadow-inner flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-200 font-bold">2G / 3G Offline Network</p>
              <p className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>NO App • NO Internet • NO Login</span>
              </p>
            </div>
            <div className="text-right text-xs text-emerald-100 font-mono">
              BSNL 4G <br /> 10:15 AM
            </div>
          </div>

          {/* Missed Call Simulation Action */}
          <div className="mt-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-primary" />
              <span>
                {state.language === 'mr'
                  ? 'मिस्ड कॉल देऊन घरबसल्या टोकन मिळवा:'
                  : state.language === 'hi'
                  ? 'मिस्ड कॉल देकर घर बैठे टोकन पाएं:'
                  : 'Missed Call Token Generation (Toll-Free):'}
              </span>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={phoneNumberInput}
                onChange={(e) => setPhoneNumberInput(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleMissedCall}
                className="btn-calm-primary px-3 py-2 text-xs min-h-[40px] whitespace-nowrap bg-emerald-600 hover:bg-emerald-700"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{state.language === 'mr' ? 'कॉल करा' : state.language === 'hi' ? 'कॉल करें' : 'Missed Call'}</span>
              </button>
            </div>
            {justSimulated && (
              <p className="text-xs text-emerald-700 font-semibold mt-1.5 animate-bounce">
                ✓ मिस्ड कॉल नोंदवला! खाली SMS पहा.
              </p>
            )}
          </div>
        </div>

        {/* SMS List */}
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-3 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>इनबॉक्स ({state.smsAlerts.length} मेसेजेस)</span>
            <span>नवीनतम वर</span>
          </div>

          {state.smsAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">कोणतेही नवीन SMS नाहीत.</p>
            </div>
          ) : (
            state.smsAlerts.map((sms) => (
              <div
                key={sms.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  sms.type === 'doctor_cancelled'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : sms.type === 'pharmacy_ready'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : sms.type === 'parallel_shift'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                    <span>VK-MHGOVT</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono">
                      {sms.tokenNumber}
                    </span>
                  </span>
                  <span className="text-slate-500 font-mono">{sms.timestamp}</span>
                </div>
                <p className="text-sm leading-relaxed font-sans">{sms.text}</p>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                  <span>रुग्ण: {sms.patientName}</span>
                  <span className="font-mono">{sms.mobile}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

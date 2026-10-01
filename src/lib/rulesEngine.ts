import { PriorityFlags, PriorityLevel, Department, PatientJourney, Prescription } from '@/types';

/**
 * JOURNEY QUEUE RULES ENGINE
 * Deterministic, explainable business logic for rural hospital queue routing.
 * No black-box AI — 100% transparent rules for government healthcare compliance.
 */

// 1. PRIORITY SCORING RULE
// Emergency > Pregnant > Senior (60+) > Normal
// Higher score sorts to the front of queue.
export function calculatePriorityScore(flags: PriorityFlags): { score: number; level: PriorityLevel } {
  if (flags.isEmergency) {
    return { score: 1000, level: 'emergency' };
  }
  if (flags.isPregnant) {
    return { score: 500, level: 'pregnant' };
  }
  if (flags.isSenior) {
    return { score: 250, level: 'senior' };
  }
  return { score: 100, level: 'normal' };
}

// 2. ESTIMATE DEPARTMENT WAIT TIME RULE
// Formula: (peopleAhead * averageConsultTime) / activeStaff
export function estimateDepartmentWait(
  peopleAhead: number,
  avgConsultMins: number,
  activeStaff: number
): number {
  if (peopleAhead <= 0) return 0;
  const staff = Math.max(1, activeStaff);
  const rawWait = (peopleAhead * avgConsultMins) / staff;
  return Math.round(rawWait);
}

// 3. PARALLEL SCHEDULING RULE (CORE USP)
// Traditional hospitals force: Reg -> Doctor -> Lab -> Doctor -> Pharmacy
// If Doctor wait is long (e.g. > Lab wait + 25 mins) and patient has lab indications,
// the system routes them to Lab/X-Ray first so reports are ready when meeting the doctor!
export interface ParallelRoutingDecision {
  shouldRouteToLabFirst: boolean;
  reason: {
    mr: string;
    hi: string;
    en: string;
  };
  timeSavedMinutes: number;
}

export function evaluateParallelScheduling(
  doctorWaitMinutes: number,
  labWaitMinutes: number,
  hasLabIndication: boolean
): ParallelRoutingDecision {
  const PARALLEL_THRESHOLD_MINUTES = 25; // if doctor wait exceeds lab wait by 25+ mins

  if (hasLabIndication && doctorWaitMinutes >= labWaitMinutes + PARALLEL_THRESHOLD_MINUTES) {
    const estimatedSaved = Math.round(doctorWaitMinutes * 0.45); // save duplicate consultation & idle cycle
    return {
      shouldRouteToLabFirst: true,
      timeSavedMinutes: estimatedSaved,
      reason: {
        mr: `डॉक्टर रांग लांब आहे (${doctorWaitMinutes} मि.). आधी लॅब/तपासणीला जा, तुम्ही येईपर्यंत रिपोर्ट तयार असेल!`,
        hi: `डॉक्टर कतार लंबी है (${doctorWaitMinutes} मि.). पहले लैब जांच करवाएं, आने तक रिपोर्ट तैयार होगी!`,
        en: `Doctor queue is currently long (${doctorWaitMinutes} min). Visit Lab first so test reports are ready for your doctor!`,
      },
    };
  }

  return {
    shouldRouteToLabFirst: false,
    timeSavedMinutes: 0,
    reason: {
      mr: '',
      hi: '',
      en: '',
    },
  };
}

// 4. LOAD BALANCING RULE (OPD 1 vs OPD 2)
// If wait(OPD 1) - wait(OPD 2) > 20 min, suggest load balance redirect
export interface LoadBalanceRecommendation {
  needed: boolean;
  fromDeptId: string;
  toDeptId: string;
  differenceMinutes: number;
  message: {
    mr: string;
    hi: string;
    en: string;
  };
}

export function evaluateLoadBalancing(
  opd1Dept: Department,
  opd2Dept: Department
): LoadBalanceRecommendation {
  const opd1Wait = estimateDepartmentWait(opd1Dept.currentQueueLength, opd1Dept.avgConsultMins, opd1Dept.activeStaff);
  const opd2Wait = estimateDepartmentWait(opd2Dept.currentQueueLength, opd2Dept.avgConsultMins, opd2Dept.activeStaff);
  const diff = Math.abs(opd1Wait - opd2Wait);

  const THRESHOLD = 20;

  if (diff >= THRESHOLD) {
    const fromDept = opd1Wait > opd2Wait ? opd1Dept : opd2Dept;
    const toDept = opd1Wait > opd2Wait ? opd2Dept : opd1Dept;

    return {
      needed: true,
      fromDeptId: fromDept.id,
      toDeptId: toDept.id,
      differenceMinutes: diff,
      message: {
        mr: `भार संतुलन: ${fromDept.name.mr} वर जास्त गर्दी आहे (${Math.max(opd1Wait, opd2Wait)} मि.). नवीन रुग्ण ${toDept.name.mr} कडे वळवा (${Math.min(opd1Wait, opd2Wait)} मि.).`,
        hi: `भार संतुलन: ${fromDept.name.hi} पर अधिक भीड़ है (${Math.max(opd1Wait, opd2Wait)} मि.). नए मरीज ${toDept.name.hi} की ओर भेजें (${Math.min(opd1Wait, opd2Wait)} मि.).`,
        en: `Load Balance: High load at ${fromDept.name.en} (${Math.max(opd1Wait, opd2Wait)} min). Suggest routing to ${toDept.name.en} (${Math.min(opd1Wait, opd2Wait)} min).`,
      },
    };
  }

  return {
    needed: false,
    fromDeptId: '',
    toDeptId: '',
    differenceMinutes: 0,
    message: { mr: '', hi: '', en: '' },
  };
}

// 5. PHARMACY AUTO-EXPIRY CHECK (30 MINUTES RULE)
export function checkPrescriptionExpiryStatus(prescription: Prescription): {
  isExpired: boolean;
  minutesRemaining: number;
} {
  if (prescription.status !== 'ready' || !prescription.readyAt) {
    return { isExpired: false, minutesRemaining: 30 };
  }

  const readyTime = new Date(prescription.readyAt).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - readyTime) / (1000 * 60);
  const remaining = Math.max(0, Math.round(30 - elapsedMinutes));

  return {
    isExpired: elapsedMinutes >= 30,
    minutesRemaining: remaining,
  };
}

// 6. FORMAT WAIT TIME FOR RURAL USERS (Simple language)
export function formatWaitDuration(minutes: number, lang: 'mr' | 'hi' | 'en'): string {
  if (minutes <= 0) {
    if (lang === 'mr') return 'लगेच नंबर येईल';
    if (lang === 'hi') return 'तुरंत नंबर आएगा';
    return 'Immediate turn';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours > 0) {
    if (lang === 'mr') return `${hours} तास ${remainingMins} मिनिटे`;
    if (lang === 'hi') return `${hours} घंटे ${remainingMins} मिनट`;
    return `${hours}h ${remainingMins}m`;
  }

  if (lang === 'mr') return `${remainingMins} मिनिटे`;
  if (lang === 'hi') return `${remainingMins} मिनट`;
  return `${remainingMins} mins`;
}

// 7. GET STATUS LEVEL (Green / Amber / Red with text & icon)
export function getQueueStatusInfo(waitMinutes: number): {
  level: 'green' | 'amber' | 'red';
  label: { mr: string; hi: string; en: string };
} {
  if (waitMinutes <= 15) {
    return {
      level: 'green',
      label: {
        mr: 'कमी गर्दी (लगेच होईल)',
        hi: 'कम भीड़ (जल्दी होगा)',
        en: 'Low Wait (Swift)',
      },
    };
  }
  if (waitMinutes <= 45) {
    return {
      level: 'amber',
      label: {
        mr: 'थोडी गर्दी (मध्यम वेळ)',
        hi: 'मध्यम भीड़ (सामान्य समय)',
        en: 'Moderate Wait',
      },
    };
  }
  return {
    level: 'red',
    label: {
      mr: 'जास्त गर्दी (अधिक वेळ)',
      hi: 'ज्यादा भीड़ (लंबा इंतजार)',
      en: 'High Wait',
    },
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Language,
  Hospital,
  Department,
  SpecialistDoctor,
  PatientJourney,
  Prescription,
  SMSAlert,
  PriorityFlags,
  DepartmentType,
  PrescriptionItem,
} from '@/types';
import {
  MOCK_HOSPITALS,
  MOCK_DEPARTMENTS,
  MOCK_SPECIALISTS,
  MOCK_PATIENTS,
  MOCK_PRESCRIPTIONS,
  MOCK_SMS_ALERTS,
} from './mockData';
import {
  calculatePriorityScore,
  evaluateParallelScheduling,
  estimateDepartmentWait,
} from './rulesEngine';
import { announcer } from './speech';

const STORAGE_KEY = 'journey_queue_v1_state';
const BROADCAST_CHANNEL_NAME = 'journey_queue_realtime_bus';

export interface AppState {
  language: Language;
  hospitalId: string;
  hospitals: Hospital[];
  departments: Department[];
  specialists: SpecialistDoctor[];
  patients: PatientJourney[];
  prescriptions: Prescription[];
  smsAlerts: SMSAlert[];
  soundEnabled: boolean;
  nowServing: {
    token: string;
    departmentName: string;
    roomNumber: string;
    announcementText?: string;
    timestamp: string;
  } | null;
  lastSync: number;
}

const INITIAL_STATE: AppState = {
  language: 'mr',
  hospitalId: 'sinnar',
  hospitals: MOCK_HOSPITALS,
  departments: MOCK_DEPARTMENTS,
  specialists: MOCK_SPECIALISTS,
  patients: MOCK_PATIENTS,
  prescriptions: MOCK_PRESCRIPTIONS,
  smsAlerts: MOCK_SMS_ALERTS,
  soundEnabled: true,
  nowServing: {
    token: 'A-08',
    departmentName: 'सामान्य बाह्यरुग्ण (OPD 1)',
    roomNumber: 'खोली क्र. २',
    announcementText: 'टोकन क्रमांक A-08, कृपया सामान्य बाह्यरुग्ण (OPD 1), खोली क्र. २ येथे या.',
    timestamp: '10:12 AM',
  },
  lastSync: Date.now(),
};

// Global memory cache to prevent flashes
let memoryState: AppState = INITIAL_STATE;
const listeners = new Set<(state: AppState) => void>();
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      memoryState = JSON.parse(saved);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  try {
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          memoryState = event.data;
          listeners.forEach((listener) => listener(memoryState));
        }
      };
    }
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }

  // Cross-tab storage fallback
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        memoryState = JSON.parse(event.newValue);
        listeners.forEach((listener) => listener(memoryState));
      } catch (err) {
        console.error(err);
      }
    }
  });
}

function persistState(newState: AppState) {
  memoryState = { ...newState, lastSync: Date.now() };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      if (broadcastChannel) {
        broadcastChannel.postMessage(memoryState);
      }
    } catch (err) {
      console.error('Persist failed:', err);
    }
  }
  listeners.forEach((listener) => listener(memoryState));
}

export function useJourneyStore() {
  const [state, setState] = useState<AppState>(memoryState);

  useEffect(() => {
    const handleUpdate = (updatedState: AppState) => {
      setState(updatedState);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  // LANGUAGE
  const setLanguage = useCallback((lang: Language) => {
    persistState({ ...memoryState, language: lang });
  }, []);

  // HOSPITAL
  const setHospitalId = useCallback((hospitalId: string) => {
    persistState({ ...memoryState, hospitalId });
  }, []);

  // SOUND TOGGLE
  const setSoundEnabled = useCallback((enabled: boolean) => {
    persistState({ ...memoryState, soundEnabled: enabled });
  }, []);

  // SMS SIMULATION HELPER
  const sendSimulatedSms = useCallback((mobile: string, patientName: string, token: string, text: string, type: SMSAlert['type']) => {
    const newAlert: SMSAlert = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mobile,
      patientName,
      tokenNumber: token,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
    };
    persistState({
      ...memoryState,
      smsAlerts: [newAlert, ...memoryState.smsAlerts],
    });
  }, []);

  // CHECK IN PATIENT (ONE TOKEN, ONE JOURNEY)
  const checkInPatient = useCallback(
    (params: {
      name: string;
      mobile: string;
      age?: number;
      gender?: 'M' | 'F' | 'O';
      flags: PriorityFlags;
      symptoms: string[];
      deptPreference?: DepartmentType;
    }) => {
      const { score, level } = calculatePriorityScore(params.flags);
      
      // Determine token prefix
      const prefix = level === 'emergency' ? 'E' : level === 'pregnant' ? 'P' : 'A';
      const existingCount = memoryState.patients.filter((p) => p.tokenNumber.startsWith(prefix)).length;
      const tokenNumber = `${prefix}-${String(existingCount + 1).padStart(2, '0')}`;

      // Check parallel scheduling rule
      const opd1 = memoryState.departments.find((d) => d.id === 'opd_1')!;
      const lab = memoryState.departments.find((d) => d.id === 'lab')!;
      const docWait = estimateDepartmentWait(opd1.currentQueueLength, opd1.avgConsultMins, opd1.activeStaff);
      const labWait = estimateDepartmentWait(lab.currentQueueLength, lab.avgConsultMins, lab.activeStaff);
      
      const hasLabIndication = params.symptoms.some((s) => s.includes('छाती') || s.includes('ताप') || s.includes('Chest') || s.includes('Fever'));
      const parallelDecision = evaluateParallelScheduling(docWait, labWait, hasLabIndication);

      const steps: PatientJourney['steps'] = [
        {
          id: `step_${Date.now()}_1`,
          departmentId: 'registration',
          departmentName: { mr: 'नोंदणी व ट्रियाज', hi: 'पंजीकरण', en: 'Registration' },
          counterNumber: 'काउंटर १',
          estimatedWaitMinutes: 3,
          status: 'completed',
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];

      if (parallelDecision.shouldRouteToLabFirst) {
        // Parallel Scheduling: Route to Lab FIRST!
        steps.push({
          id: `step_${Date.now()}_2`,
          departmentId: 'lab',
          departmentName: { mr: 'पॅथॉलॉजी लॅब (रक्त तपासणी)', hi: 'पैथोलॉजी लैब', en: 'Pathology Lab' },
          counterNumber: 'खोली क्र. ५',
          estimatedWaitMinutes: 8,
          status: 'in_progress',
          isParallelShifted: true,
          notes: 'समांतर शेड्युलिंग: डॉक्टर रांग जास्त असल्याने आधी लॅब तपासणी.',
        });
        steps.push({
          id: `step_${Date.now()}_3`,
          departmentId: 'doctor',
          departmentName: { mr: 'डॉक्टर तपासणी (OPD 1)', hi: 'डॉक्टर परामर्श', en: 'Doctor Consultation' },
          counterNumber: 'खोली क्र. २',
          estimatedWaitMinutes: 25,
          status: 'pending',
          notes: 'लॅब रिपोर्ट तयार झाल्यावर प्राधान्याने बोलावले जाईल.',
        });
      } else {
        // Standard queue
        steps.push({
          id: `step_${Date.now()}_2`,
          departmentId: params.deptPreference || 'opd_1',
          departmentName: { mr: 'डॉक्टर तपासणी (OPD)', hi: 'डॉक्टर परामर्श', en: 'Doctor Consultation' },
          counterNumber: 'खोली क्र. २',
          estimatedWaitMinutes: Math.max(5, docWait),
          status: 'in_progress',
        });
      }

      // Add Pharmacy step
      steps.push({
        id: `step_${Date.now()}_pharmacy`,
        departmentId: 'pharmacy',
        departmentName: { mr: 'मोफत औषधालय', hi: 'मुफ्त फार्मेसी', en: 'Pharmacy' },
        counterNumber: 'काउंटर क्र. २',
        estimatedWaitMinutes: 8,
        status: 'pending',
      });

      const totalEstimated = steps.reduce((sum, s) => sum + s.estimatedWaitMinutes, 0);

      const newPatient: PatientJourney = {
        id: `patient_${Date.now()}`,
        tokenNumber,
        patientName: params.name,
        mobile: params.mobile,
        age: params.age,
        gender: params.gender || 'M',
        language: memoryState.language,
        hospitalId: memoryState.hospitalId,
        priorityLevel: level,
        priorityScore: score,
        priorityFlags: params.flags,
        symptoms: params.symptoms,
        departmentPreference: params.deptPreference || 'opd_1',
        currentStepIndex: 1,
        steps,
        totalEstimatedWaitMinutes: totalEstimated,
        isParallelScheduled: parallelDecision.shouldRouteToLabFirst,
        parallelReason: parallelDecision.shouldRouteToLabFirst ? parallelDecision.reason : undefined,
        status: parallelDecision.shouldRouteToLabFirst ? 'in_lab' : 'waiting',
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Simulated SMS
      const smsText = parallelDecision.shouldRouteToLabFirst
        ? `[जर्नी क्यू - सिन्नर रुग्णालय] नमस्कार ${params.name}, आपला टोकन क्र. ${tokenNumber} आहे. डॉक्टर रांग लांब असल्याने वेळेच्या बचतीसाठी आधी खोली ५ (लॅब) मध्ये रक्त तपासणीसाठी जा.`
        : `[जर्नी क्यू - सिन्नर रुग्णालय] नमस्कार ${params.name}, आपला टोकन क्र. ${tokenNumber} तयार झाला आहे. एकूण अंदाजे वेळ: ${totalEstimated} मि. कृपया खोली क्र. २ समोरील हॉलमध्ये थांबा.`;

      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile: params.mobile,
        patientName: params.name,
        tokenNumber,
        text: smsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: parallelDecision.shouldRouteToLabFirst ? 'parallel_shift' : 'token_generated',
        read: false,
      };

      persistState({
        ...memoryState,
        patients: [newPatient, ...memoryState.patients],
        smsAlerts: [newSms, ...memoryState.smsAlerts],
      });

      return newPatient;
    },
    []
  );

  // CALL NEXT PATIENT (BY STAFF)
  const callNextPatient = useCallback(
    (deptId: DepartmentType) => {
      const dept = memoryState.departments.find((d) => d.id === deptId);
      if (!dept) return;

      // Find highest priority patient waiting for this department
      const waitingPatients = memoryState.patients.filter((p) => {
        const step = p.steps[p.currentStepIndex];
        return step && (step.departmentId === deptId || (deptId.startsWith('opd') && step.departmentId === 'doctor')) && step.status !== 'completed';
      });

      // Sort by priorityScore desc, then checkin time
      waitingPatients.sort((a, b) => b.priorityScore - a.priorityScore);

      const nextPatient = waitingPatients[0];
      if (!nextPatient) {
        // If queue empty, just clear or set status
        return;
      }

      const updatedDept = {
        ...dept,
        currentServingToken: nextPatient.tokenNumber,
        currentQueueLength: Math.max(0, dept.currentQueueLength - 1),
      };

      const updatedPatients = memoryState.patients.map((p) => {
        if (p.id === nextPatient.id) {
          const updatedSteps = [...p.steps];
          updatedSteps[p.currentStepIndex] = {
            ...updatedSteps[p.currentStepIndex],
            status: 'in_progress',
          };
          return {
            ...p,
            steps: updatedSteps,
            status: deptId === 'lab' ? ('in_lab' as const) : deptId === 'pharmacy' ? ('in_pharmacy' as const) : ('in_consultation' as const),
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return p;
      });

      const updatedDepartments = memoryState.departments.map((d) => (d.id === deptId ? updatedDept : d));

      const announcementText = `टोकन क्रमांक ${nextPatient.tokenNumber}, कृपया ${dept.name.mr}, ${dept.roomNumber} येथे या.`;

      // Announce via Voice if sound enabled
      if (memoryState.soundEnabled) {
        announcer.speakTokenTurn(nextPatient.tokenNumber, dept.name[memoryState.language], dept.roomNumber, memoryState.language);
      }

      // Send SMS alert
      const smsText = `[सिन्नर रुग्णालय] टोकन ${nextPatient.tokenNumber}: आपला नंबर आला आहे! कृपया लगेच ${dept.name.mr}, ${dept.roomNumber} येथे या.`;
      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile: nextPatient.mobile,
        patientName: nextPatient.patientName,
        tokenNumber: nextPatient.tokenNumber,
        text: smsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'turn_alert',
        read: false,
      };

      persistState({
        ...memoryState,
        departments: updatedDepartments,
        patients: updatedPatients,
        smsAlerts: [newSms, ...memoryState.smsAlerts],
        nowServing: {
          token: nextPatient.tokenNumber,
          departmentName: dept.name[memoryState.language],
          roomNumber: dept.roomNumber,
          announcementText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });
    },
    []
  );

  // COMPLETE STEP (ADVANCE JOURNEY)
  const completeStep = useCallback(
    (patientId: string) => {
      const patient = memoryState.patients.find((p) => p.id === patientId);
      if (!patient) return;

      const nextStepIndex = patient.currentStepIndex + 1;
      const isFinished = nextStepIndex >= patient.steps.length;

      const updatedPatients = memoryState.patients.map((p) => {
        if (p.id === patientId) {
          const updatedSteps = [...p.steps];
          updatedSteps[p.currentStepIndex] = {
            ...updatedSteps[p.currentStepIndex],
            status: 'completed',
            completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          if (!isFinished && updatedSteps[nextStepIndex]) {
            updatedSteps[nextStepIndex] = {
              ...updatedSteps[nextStepIndex],
              status: 'in_progress',
            };
          }

          return {
            ...p,
            currentStepIndex: isFinished ? p.steps.length - 1 : nextStepIndex,
            status: isFinished ? ('completed' as const) : ('waiting' as const),
            steps: updatedSteps,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return p;
      });

      persistState({
        ...memoryState,
        patients: updatedPatients,
      });
    },
    []
  );

  // AUTO-HANDOFF 1: DOCTOR ORDERS LAB TEST
  const orderLabTest = useCallback(
    (patientId: string, testName: string) => {
      const patient = memoryState.patients.find((p) => p.id === patientId);
      if (!patient) return;

      const updatedPatients = memoryState.patients.map((p) => {
        if (p.id === patientId) {
          const newSteps = [...p.steps];
          // Check if lab step already exists
          const existingLabIndex = newSteps.findIndex((s) => s.departmentId === 'lab');
          if (existingLabIndex === -1) {
            newSteps.splice(p.currentStepIndex + 1, 0, {
              id: `step_${Date.now()}_lab`,
              departmentId: 'lab',
              departmentName: { mr: `पॅथॉलॉजी (${testName})`, hi: `पैथोलॉजी (${testName})`, en: `Lab Test (${testName})` },
              counterNumber: 'खोली क्र. ५',
              estimatedWaitMinutes: 8,
              status: 'pending',
              notes: `डॉक्टरांनी टेस्ट ऑर्डर केली: ${testName}`,
            });
          }
          return {
            ...p,
            steps: newSteps,
            activeAlert: {
              id: `alert_${Date.now()}`,
              type: 'info' as const,
              message: {
                mr: `डॉक्टरांनी '${testName}' तपासणी दिली आहे. लॅब रांगेत स्वयंचलित जोडले गेले आहात!`,
                hi: `डॉक्टर ने '${testName}' जांच लिखी है। लैब कतार में स्वतः जोड़ दिए गए हैं!`,
                en: `Doctor ordered '${testName}'. Auto-added to Lab queue!`,
              },
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          };
        }
        return p;
      });

      // Send SMS
      const smsText = `[सिन्नर रुग्णालय] टोकन ${patient.tokenNumber}: डॉक्टरांनी '${testName}' तपासणी सुचवली आहे. कृपया खोली क्र. ५ (लॅब) मध्ये जा, नंबर आपोआप जोडला आहे.`;
      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile: patient.mobile,
        patientName: patient.patientName,
        tokenNumber: patient.tokenNumber,
        text: smsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'turn_alert',
        read: false,
      };

      persistState({
        ...memoryState,
        patients: updatedPatients,
        smsAlerts: [newSms, ...memoryState.smsAlerts],
      });
    },
    []
  );

  // AUTO-HANDOFF 2: DOCTOR SUBMITS PRESCRIPTION
  const submitPrescription = useCallback(
    (patientId: string, doctorName: string, items: PrescriptionItem[]) => {
      const patient = memoryState.patients.find((p) => p.id === patientId);
      if (!patient) return;

      const newRx: Prescription = {
        id: `rx_${Date.now()}`,
        patientId,
        patientName: patient.patientName,
        tokenNumber: patient.tokenNumber,
        doctorName,
        items,
        status: 'preparing',
        counterNumber: 'काउंटर क्र. २',
        createdAt: new Date().toISOString(),
      };

      const updatedPatients = memoryState.patients.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            activeAlert: {
              id: `alert_${Date.now()}`,
              type: 'info' as const,
              message: {
                mr: 'डॉक्टरांनी डिजिटल औषधे पाठवली आहेत. फार्मसी काउंटरवर औषधे तयार होत आहेत!',
                hi: 'डॉक्टर ने दवाएं डिजिटल रूप से भेज दी हैं। फार्मेसी में तैयारी जारी है!',
                en: 'Doctor sent prescription digitally. Pharmacy is packing your medicines now!',
              },
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          };
        }
        return p;
      });

      const smsText = `[सिन्नर रुग्णालय] टोकन ${patient.tokenNumber}: डॉक्टरांनी औषधे प्रणालीत पाठवली आहेत. औषधे तयार झाल्यावर तुम्हाला लगेच SMS येईल.`;
      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile: patient.mobile,
        patientName: patient.patientName,
        tokenNumber: patient.tokenNumber,
        text: smsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'turn_alert',
        read: false,
      };

      persistState({
        ...memoryState,
        prescriptions: [newRx, ...memoryState.prescriptions],
        patients: updatedPatients,
        smsAlerts: [newSms, ...memoryState.smsAlerts],
      });
    },
    []
  );

  // PHARMACY: MARK READY (TRIGGERS 30-MIN EXPIRY TIMER & READY ALERT)
  const markPrescriptionReady = useCallback(
    (rxId: string) => {
      const rx = memoryState.prescriptions.find((r) => r.id === rxId);
      if (!rx) return;

      const readyAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const updatedRxList = memoryState.prescriptions.map((r) =>
        r.id === rxId ? { ...r, status: 'ready' as const, readyAt, expiresAt } : r
      );

      // Alert patient
      const updatedPatients = memoryState.patients.map((p) => {
        if (p.id === rx.patientId) {
          return {
            ...p,
            activeAlert: {
              id: `alert_${Date.now()}`,
              type: 'success' as const,
              message: {
                mr: 'आपली औषधे तयार आहेत! कृपया पुढील ३० मिनिटांत काउंटर क्र. २ वरून मोफत औषधे घ्या.',
                hi: 'आपकी दवाएं तैयार हैं! कृपया अगले ३० मिनट में काउंटर २ से दवाएं प्राप्त करें।',
                en: 'Your medicines are ready! Please collect from Counter 2 within 30 minutes.',
              },
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          };
        }
        return p;
      });

      const smsText = `[सिन्नर रुग्णालय] टोकन ${rx.tokenNumber}: आपली मोफत औषधे तयार आहेत! कृपया ३० मिनिटांत फार्मसी काउंटर क्र. २ वरून औषधे गोळा करा.`;
      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile: '9822012345',
        patientName: rx.patientName,
        tokenNumber: rx.tokenNumber,
        text: smsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'pharmacy_ready',
        read: false,
      };

      if (memoryState.soundEnabled) {
        announcer.speak(`टोकन ${rx.tokenNumber}, औषध तयार आहे, फार्मसी काउंटर दोनवर या.`, memoryState.language);
      }

      persistState({
        ...memoryState,
        prescriptions: updatedRxList,
        patients: updatedPatients,
        smsAlerts: [newSms, ...memoryState.smsAlerts],
      });
    },
    []
  );

  // PHARMACY: DISPENSE
  const dispensePrescription = useCallback(
    (rxId: string) => {
      const rx = memoryState.prescriptions.find((r) => r.id === rxId);
      if (!rx) return;

      const updatedRxList = memoryState.prescriptions.map((r) =>
        r.id === rxId ? { ...r, status: 'dispensed' as const } : r
      );

      // Mark patient pharmacy step completed
      const updatedPatients = memoryState.patients.map((p) => {
        if (p.id === rx.patientId) {
          const newSteps = p.steps.map((s) => (s.departmentId === 'pharmacy' ? { ...s, status: 'completed' as const } : s));
          return {
            ...p,
            steps: newSteps,
            status: 'completed' as const,
            activeAlert: {
              id: `alert_${Date.now()}`,
              type: 'success' as const,
              message: {
                mr: 'आपला रुग्णालय प्रवास यशस्वीरीत्या पूर्ण झाला आहे! लवकर बरे व्हा.',
                hi: 'आपकी अस्पताल यात्रा सफलतापूर्वक पूर्ण हुई! शीघ्र स्वास्थ्य लाभ की कामना।',
                en: 'Your hospital visit is complete! Wishing you a speedy recovery.',
              },
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          };
        }
        return p;
      });

      persistState({
        ...memoryState,
        prescriptions: updatedRxList,
        patients: updatedPatients,
      });
    },
    []
  );

  // SPECIALIST: BOOK SLOT
  const bookSpecialist = useCallback(
    (booking: {
      specialistId: string;
      patientName: string;
      mobile: string;
      date: string;
      timeSlot: string;
    }) => {
      const specialist = memoryState.specialists.find((s) => s.id === booking.specialistId);
      if (!specialist) return;

      const tokenNumber = `S-${String(specialist.bookedSlotsCount + 1).padStart(2, '0')}`;

      // Update specialist booked count
      const updatedSpecialists = memoryState.specialists.map((s) => {
        if (s.id === booking.specialistId) {
          return {
            ...s,
            bookedSlotsCount: s.bookedSlotsCount + 1,
            availableSlots: s.availableSlots.filter((slot) => slot !== booking.timeSlot),
          };
        }
        return s;
      });

      // Create a Patient Journey directly
      const newPatient: PatientJourney = {
        id: `patient_spec_${Date.now()}`,
        tokenNumber,
        patientName: booking.patientName,
        mobile: booking.mobile,
        language: memoryState.language,
        hospitalId: specialist.hospitalId,
        priorityLevel: 'normal',
        priorityScore: 100,
        priorityFlags: { isEmergency: false, isPregnant: false, isSenior: false },
        currentStepIndex: 1,
        totalEstimatedWaitMinutes: 20,
        isParallelScheduled: false,
        status: 'waiting',
        checkInTime: booking.timeSlot,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: [
          {
            id: `step_spec_reg`,
            departmentId: 'registration',
            departmentName: { mr: 'ऑनलाइन आगाऊ नोंदणी', hi: 'ऑनलाइन पंजीकरण', en: 'Online Advance Check-in' },
            counterNumber: 'थेट खोलीकडे जा',
            estimatedWaitMinutes: 0,
            status: 'completed',
          },
          {
            id: `step_spec_doc`,
            departmentId: 'specialist',
            departmentName: { mr: specialist.name, hi: specialist.name, en: specialist.name },
            counterNumber: specialist.specialty,
            estimatedWaitMinutes: 15,
            status: 'in_progress',
          },
          {
            id: `step_spec_pharmacy`,
            departmentId: 'pharmacy',
            departmentName: { mr: 'मोफत औषधालय', hi: 'मुफ्त फार्मेसी', en: 'Pharmacy' },
            counterNumber: 'काउंटर क्र. २',
            estimatedWaitMinutes: 5,
            status: 'pending',
          },
        ],
      };

      const smsText = `[सिन्नर रुग्णालय] नमस्कार ${booking.patientName}, आपली ${specialist.name} (${specialist.specialty}) यांच्याकडे तारीख ${booking.date}, वेळ ${booking.timeSlot} ची भेट निश्चित झाली आहे. टोकन क्र. ${tokenNumber}.`;
      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile: booking.mobile,
        patientName: booking.patientName,
        tokenNumber,
        text: smsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'token_generated',
        read: false,
      };

      persistState({
        ...memoryState,
        specialists: updatedSpecialists,
        patients: [newPatient, ...memoryState.patients],
        smsAlerts: [newSms, ...memoryState.smsAlerts],
      });

      return newPatient;
    },
    []
  );

  // SPECIALIST: CANCEL VISITING DOCTOR (SIMULATION)
  const cancelSpecialistSession = useCallback(
    (specialistId: string, date: string) => {
      const specialist = memoryState.specialists.find((s) => s.id === specialistId);
      if (!specialist) return;

      const updatedSpecialists = memoryState.specialists.map((s) => {
        if (s.id === specialistId) {
          return {
            ...s,
            cancelledDates: [...s.cancelledDates, date],
          };
        }
        return s;
      });

      // Dispatch urgent SMS cancellation alert to all booked patients
      const cancelSmsText = `[महत्त्वाची सूचना - सिन्नर रुग्णालय] अपरिहार्य कारणास्तव ${specialist.name} यांचे आजचे (${date}) सत्र रद्द झाले आहे. आपली अपॉइंटमेंट पुढील गुरुवारी आपोआप हस्तांतरित झाली आहे. अधिक माहिती: ०२५३-२५२११०.`;
      
      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile: '9822014589',
        patientName: 'नोंदणीकृत रुग्ण',
        tokenNumber: 'S-All',
        text: cancelSmsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'doctor_cancelled',
        read: false,
      };

      persistState({
        ...memoryState,
        specialists: updatedSpecialists,
        smsAlerts: [newSms, ...memoryState.smsAlerts],
      });
    },
    []
  );

  // RESTORE CANCELLED DOCTOR
  const restoreSpecialistSession = useCallback(
    (specialistId: string, date: string) => {
      const updatedSpecialists = memoryState.specialists.map((s) => {
        if (s.id === specialistId) {
          return {
            ...s,
            cancelledDates: s.cancelledDates.filter((d) => d !== date),
          };
        }
        return s;
      });
      persistState({
        ...memoryState,
        specialists: updatedSpecialists,
      });
    },
    []
  );

  // MISSED CALL SIMULATION FOR LOW-TECH RURAL USERS
  const simulateMissedCallCheckin = useCallback(
    (mobile: string = '9822055667') => {
      const tokenNumber = `M-${Math.floor(10 + Math.random() * 90)}`;
      const smsText = `[सिन्नर रुग्णालय] आपल्या मिस्ड कॉलवरून टोकन क्र. ${tokenNumber} तयार करण्यात आला आहे. सरासरी वेळ ३० मिनिटे. रुग्णालयात पोहोचल्यावर खिडकी १ वर दाखवा.`;

      const newSms: SMSAlert = {
        id: `sms_${Date.now()}`,
        mobile,
        patientName: 'मिस्ड कॉल रुग्ण (Auto)',
        tokenNumber,
        text: smsText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'token_generated',
        read: false,
      };

      const newPatient: PatientJourney = {
        id: `patient_mc_${Date.now()}`,
        tokenNumber,
        patientName: `मिस्ड कॉल रुग्ण (${mobile.slice(-4)})`,
        mobile,
        language: memoryState.language,
        hospitalId: memoryState.hospitalId,
        priorityLevel: 'normal',
        priorityScore: 100,
        priorityFlags: { isEmergency: false, isPregnant: false, isSenior: false },
        currentStepIndex: 0,
        totalEstimatedWaitMinutes: 30,
        isParallelScheduled: false,
        status: 'waiting',
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: [
          {
            id: `step_mc_1`,
            departmentId: 'registration',
            departmentName: { mr: 'मिस्ड कॉल पडताळणी', hi: 'मिस्ड कॉल सत्यापन', en: 'Missed Call Verification' },
            counterNumber: 'काउंटर १',
            estimatedWaitMinutes: 2,
            status: 'in_progress',
          },
          {
            id: `step_mc_2`,
            departmentId: 'opd_1',
            departmentName: { mr: 'सामान्य डॉक्टर तपासणी', hi: 'डॉक्टर परामर्श', en: 'Doctor Consultation' },
            counterNumber: 'खोली क्र. २',
            estimatedWaitMinutes: 20,
            status: 'pending',
          },
          {
            id: `step_mc_3`,
            departmentId: 'pharmacy',
            departmentName: { mr: 'मोफत औषधालय', hi: 'मुफ्त फार्मेसी', en: 'Pharmacy' },
            counterNumber: 'काउंटर क्र. २',
            estimatedWaitMinutes: 8,
            status: 'pending',
          },
        ],
      };

      persistState({
        ...memoryState,
        patients: [newPatient, ...memoryState.patients],
        smsAlerts: [newSms, ...memoryState.smsAlerts],
      });

      return newPatient;
    },
    []
  );

  // RESET DEMO DATA
  const resetDemoData = useCallback(() => {
    persistState(INITIAL_STATE);
  }, []);

  return {
    state,
    setLanguage,
    setHospitalId,
    setSoundEnabled,
    checkInPatient,
    callNextPatient,
    completeStep,
    orderLabTest,
    submitPrescription,
    markPrescriptionReady,
    dispensePrescription,
    bookSpecialist,
    cancelSpecialistSession,
    restoreSpecialistSession,
    simulateMissedCallCheckin,
    sendSimulatedSms,
    resetDemoData,
  };
}

export type Language = 'mr' | 'hi' | 'en';

export type PriorityLevel = 'emergency' | 'pregnant' | 'senior' | 'normal';

export interface PriorityFlags {
  isEmergency: boolean;
  isPregnant: boolean;
  isSenior: boolean; // 60+
}

export type DepartmentType = 
  | 'registration' 
  | 'doctor'
  | 'opd_1' 
  | 'opd_2' 
  | 'specialist'
  | 'lab' 
  | 'xray' 
  | 'report' 
  | 'pharmacy';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface JourneyStep {
  id: string;
  departmentId: DepartmentType;
  departmentName: {
    mr: string;
    hi: string;
    en: string;
  };
  counterNumber?: string;
  estimatedWaitMinutes: number;
  actualDurationMinutes?: number;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  isParallelShifted?: boolean;
}

export interface PatientJourney {
  id: string;
  tokenNumber: string; // e.g. "A-12", "E-04"
  patientName: string;
  mobile: string;
  age?: number;
  gender?: 'M' | 'F' | 'O';
  language: Language;
  hospitalId: string;
  priorityLevel: PriorityLevel;
  priorityScore: number;
  priorityFlags: PriorityFlags;
  symptoms?: string[];
  departmentPreference?: DepartmentType;
  currentStepIndex: number;
  steps: JourneyStep[];
  totalEstimatedWaitMinutes: number;
  isParallelScheduled: boolean;
  parallelReason?: {
    mr: string;
    hi: string;
    en: string;
  };
  status: 'waiting' | 'in_consultation' | 'in_lab' | 'in_pharmacy' | 'completed' | 'cancelled';
  checkInTime: string;
  lastUpdated: string;
  activeAlert?: {
    id: string;
    type: 'info' | 'warning' | 'success' | 'action';
    message: {
      mr: string;
      hi: string;
      en: string;
    };
    timestamp: string;
  };
}

export interface Department {
  id: DepartmentType;
  name: {
    mr: string;
    hi: string;
    en: string;
  };
  hospitalId: string;
  roomNumber: string;
  doctorOrStaffName: string;
  activeStaff: number;
  avgConsultMins: number;
  currentQueueLength: number;
  currentServingToken: string | null;
  statusLevel: 'green' | 'amber' | 'red';
  statusLabel: {
    mr: string;
    hi: string;
    en: string;
  };
  isIdle?: boolean;
}

export interface SpecialistDoctor {
  id: string;
  hospitalId: string;
  name: string;
  specialty: string;
  specialtyKey: 'eye' | 'ent' | 'skin' | 'ortho' | 'peds' | 'gyn';
  specialtyLabel: {
    mr: string;
    hi: string;
    en: string;
  };
  photoUrl?: string;
  visitDays: string[]; // e.g. ['Monday', 'Thursday']
  visitDaysMr: string[]; // e.g. ['सोमवार', 'गुरुवार']
  visitDaysHi: string[];
  timings: string;
  capacityPerDay: number;
  nextAvailableDate: string; // YYYY-MM-DD
  nextAvailableDayLabel: {
    mr: string;
    hi: string;
    en: string;
  };
  availableSlots: string[]; // ["09:30 AM", "10:00 AM", ...]
  bookedSlotsCount: number;
  cancelledDates: string[]; // dates that doctor cancelled
}

export interface SpecialistBooking {
  id: string;
  specialistId: string;
  specialistName: string;
  specialty: string;
  hospitalId: string;
  patientName: string;
  mobile: string;
  date: string;
  timeSlot: string;
  tokenNumber: string;
  createdAt: string;
  isCancelled: boolean;
}

export interface PrescriptionItem {
  name: string;
  dosage: string; // e.g. "1 गोळी सकाळ संध्याकाळ"
  duration: string; // e.g. "5 दिवस"
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  tokenNumber: string;
  doctorName: string;
  items: PrescriptionItem[];
  status: 'preparing' | 'ready' | 'dispensed' | 'expired';
  counterNumber: string;
  createdAt: string;
  readyAt?: string;
  expiresAt?: string; // 30 minutes after readyAt
}

export interface SMSAlert {
  id: string;
  mobile: string;
  patientName: string;
  tokenNumber: string;
  text: string;
  timestamp: string;
  type: 'token_generated' | 'turn_alert' | 'parallel_shift' | 'pharmacy_ready' | 'doctor_cancelled';
  read: boolean;
}

export interface Hospital {
  id: string;
  name: {
    mr: string;
    hi: string;
    en: string;
  };
  district: string;
  location: string;
  contactNumber: string;
  emergencyPhone: string;
  totalActivePatients: number;
}

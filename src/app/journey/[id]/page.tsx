import { JourneyClient } from './JourneyClient';

export function generateStaticParams() {
  return [
    { id: 'patient_01' },
    { id: 'patient_02' },
    { id: 'patient_03' },
    { id: 'patient_04' },
    { id: 'patient_05' },
    { id: 'A-12' },
    { id: 'A-05' },
    { id: 'E-01' },
    { id: 'A-15' },
    { id: 'A-18' },
    { id: 'default' },
  ];
}

export default function JourneyPage() {
  return <JourneyClient />;
}

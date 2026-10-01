'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { announcer } from '@/lib/speech';
import { useJourneyStore } from '@/lib/store';

interface AudioVoiceButtonProps {
  textToSpeak: string;
  label?: string;
  size?: 'md' | 'lg';
  className?: string;
}

export const AudioVoiceButton: React.FC<AudioVoiceButtonProps> = ({
  textToSpeak,
  label = 'मराठीत ऐका (मोठ्याने बोला)',
  size = 'lg',
  className = '',
}) => {
  const { state } = useJourneyStore();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    announcer.speak(textToSpeak, state.language, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <button
      onClick={handleSpeak}
      className={`group relative overflow-hidden flex items-center justify-center gap-3 font-bold transition-all border ${
        isSpeaking
          ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30 animate-pulse'
          : 'bg-primary hover:bg-primary-hover text-white border-primary shadow-md hover:shadow-lg active:scale-98'
      } ${
        size === 'lg'
          ? 'min-h-[58px] px-6 py-3.5 text-xl rounded-2xl w-full'
          : 'min-h-[48px] px-4 py-2 text-base rounded-xl'
      } ${className}`}
      aria-label="Speak announcement aloud"
    >
      {isSpeaking ? (
        <>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-6 bg-white rounded-full voice-bar"></span>
            <span className="w-1.5 h-8 bg-white rounded-full voice-bar"></span>
            <span className="w-1.5 h-4 bg-white rounded-full voice-bar"></span>
            <span className="w-1.5 h-7 bg-white rounded-full voice-bar"></span>
          </div>
          <span>आवाज सुरू आहे... (थांबवा)</span>
        </>
      ) : (
        <>
          <Volume2 className={size === 'lg' ? 'w-7 h-7 text-sky-200' : 'w-5 h-5 text-sky-200'} />
          <span>{label}</span>
          <Sparkles className="w-5 h-5 text-amber-300 ml-auto opacity-80 group-hover:scale-125 transition-transform" />
        </>
      )}
    </button>
  );
};

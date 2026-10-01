import { Language } from '@/types';

class VoiceAnnouncer {
  private synth: SpeechSynthesis | null = null;
  private isSupported: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isSupported = true;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  private playChime() {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // AudioContext may be blocked before gesture
    }
  }

  public speak(text: string, lang: Language = 'mr', onEnd?: () => void) {
    if (!this.isSupported || !this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // cancel any active speech
      this.playChime();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // clear, gentle tempo for rural public address
      utterance.pitch = 1.0;

      // Map language code to standard speech tags
      const langTag = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.lang = langTag;

      // Select best matching voice if available
      const matchingVoice = this.voices.find((v) => v.lang === langTag || v.lang.startsWith(lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = () => onEnd();
      }

      // Short delay after chime
      setTimeout(() => {
        if (this.synth) {
          this.synth.speak(utterance);
        }
      }, 350);
    } catch (e) {
      console.warn('Voice announcement failed:', e);
      if (onEnd) onEnd();
    }
  }

  public speakTokenTurn(token: string, departmentName: string, counterOrRoom: string, lang: Language = 'mr') {
    let announcement = '';
    if (lang === 'mr') {
      announcement = `लक्ष द्या! टोकन क्रमांक ${token}, कृपया ${departmentName}, ${counterOrRoom} येथे या.`;
    } else if (lang === 'hi') {
      announcement = `ध्यान दें! टोकन नंबर ${token}, कृपया ${departmentName}, ${counterOrRoom} में आएं.`;
    } else {
      announcement = `Attention please! Token number ${token}, please proceed to ${departmentName}, ${counterOrRoom}.`;
    }

    this.speak(announcement, lang);
    return announcement;
  }
}

export const announcer = new VoiceAnnouncer();

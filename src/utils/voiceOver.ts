import { LanguageCode } from '../types/game';

const VOICE_LOCALE_BY_LANG: Record<LanguageCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  ar: 'ar-SA',
  zh: 'zh-CN',
  ja: 'ja-JP',
  pt: 'pt-BR',
  de: 'de-DE',
  ko: 'ko-KR',
};

function findMatchingVoices(lang: LanguageCode): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  try {
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.toLowerCase();
    return voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  } catch {
    return [];
  }
}

class TutorialVoiceOver {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeId = 0;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  getVoicesForLanguage(lang: LanguageCode): SpeechSynthesisVoice[] {
    return findMatchingVoices(lang);
  }

  stop(): void {
    this.activeId += 1;
    this.currentUtterance = null;
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel failures
    }
  }

  speak(
    text: string,
    options: {
      lang?: LanguageCode;
      voiceURI?: string;
      muted?: boolean;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onBlocked?: () => void;
    } = {}
  ): boolean {
    if (options.muted || !this.isSupported() || !text.trim()) {
      return false;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }

    const callId = ++this.activeId;
    const langCode: LanguageCode = options.lang ?? 'en';
    const locale = VOICE_LOCALE_BY_LANG[langCode] ?? 'en-US';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = 0.95;

    try {
      const allVoices = window.speechSynthesis.getVoices();
      const matchingVoices = allVoices.filter((v) =>
        v.lang.toLowerCase().startsWith(langCode.toLowerCase())
      );

      let chosen: SpeechSynthesisVoice | undefined;
      if (options.voiceURI) {
        chosen = matchingVoices.find((v) => v.voiceURI === options.voiceURI) ||
          allVoices.find((v) => v.voiceURI === options.voiceURI);
      }
      if (!chosen && matchingVoices.length > 0) {
        chosen =
          matchingVoices.find((v) =>
            /natural|neural|google|samantha|daniel|karen|aria|guy|lekha|monica|paulina|thomas|amélie|kyoko|yuna|ting|meijia/i.test(
              v.name
            )
          ) || matchingVoices[0];
      }
      if (chosen) {
        utterance.voice = chosen;
        utterance.lang = chosen.lang || locale;
      }
    } catch {
      // Fallback to locale tag + default voice
    }

    let started = false;
    utterance.onstart = () => {
      if (this.activeId !== callId) return;
      started = true;
      options.onStart?.();
    };
    utterance.onend = () => {
      if (this.activeId !== callId) return;
      this.currentUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = (ev) => {
      if (this.activeId !== callId) return;
      this.currentUtterance = null;
      if (ev.error === 'not-allowed' || ev.error === 'interrupted') {
        options.onBlocked?.();
      } else {
        options.onEnd?.();
      }
    };

    this.currentUtterance = utterance;
    try {
      window.speechSynthesis.speak(utterance);
      // Detect silent autoplay blocks if speech never enters speaking state quickly
      window.setTimeout(() => {
        if (this.activeId !== callId) return;
        if (!started && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          options.onBlocked?.();
        }
      }, 450);
      return true;
    } catch {
      options.onBlocked?.();
      return false;
    }
  }
}

export const tutorialVoiceOver = new TutorialVoiceOver();

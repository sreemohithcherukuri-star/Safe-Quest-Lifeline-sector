import {
  BookOpen,
  Globe,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getTutorialStrings, TutorialChapterContent } from '../data/tutorialTranslations';
import { LANGUAGES } from '../i18n/translations';
import { LanguageCode } from '../types/game';
import { tutorialVoiceOver } from '../utils/voiceOver';

const TOTAL_DURATION_SEC = 33;

function getChapterIndex(chapters: TutorialChapterContent[], timeSec: number): number {
  for (let i = 0; i < chapters.length; i++) {
    if (timeSec < chapters[i].endSec) return i;
  }
  return chapters.length - 1;
}

interface TutorialVideoModalProps {
  voiceLang: LanguageCode;
  muted: boolean;
  onChangeVoiceLang: (lang: LanguageCode) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

export function TutorialVideoModal({
  voiceLang,
  muted,
  onChangeVoiceLang,
  onToggleMute,
  onClose,
}: TutorialVideoModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  const [voiceBlocked, setVoiceBlocked] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  const currentTimeRef = useRef(0);
  const playingRef = useRef(true);
  const lastSpokenKeyRef = useRef<string>('');
  playingRef.current = playing;

  const ui = getTutorialStrings(voiceLang);
  const chapters = ui.chapters;
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;

  const activeChapterIdx = getChapterIndex(chapters, currentTime);
  const activeChapter = chapters[activeChapterIdx];

  // Refresh available system voices for selected voice-over language
  useEffect(() => {
    const syncVoices = () => {
      const matches = tutorialVoiceOver.getVoicesForLanguage(voiceLang);
      setAvailableVoices(matches);
      setSelectedVoiceURI((prev) =>
        prev && matches.some((v) => v.voiceURI === prev) ? prev : ''
      );
    };
    syncVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener?.('voiceschanged', syncVoices);
      return () => {
        window.speechSynthesis.removeEventListener?.('voiceschanged', syncVoices);
      };
    }
  }, [voiceLang]);

  const speakChapter = useCallback(
    (idx: number, langOverride?: LanguageCode, voiceURIOverride?: string) => {
      const targetLang = langOverride ?? voiceLang;
      const targetVoiceURI = voiceURIOverride !== undefined ? voiceURIOverride : selectedVoiceURI;
      if (muted) {
        tutorialVoiceOver.stop();
        setVoiceSpeaking(false);
        return;
      }
      const targetStrings = getTutorialStrings(targetLang);
      const ch = targetStrings.chapters[idx];
      if (!ch) return;
      lastSpokenKeyRef.current = `${targetLang}:${targetVoiceURI}:${idx}`;
      setVoiceBlocked(false);
      tutorialVoiceOver.speak(ch.narration, {
        lang: targetLang,
        voiceURI: targetVoiceURI || undefined,
        muted,
        rate: 1.0,
        onStart: () => {
          setVoiceSpeaking(true);
          setVoiceBlocked(false);
        },
        onEnd: () => {
          setVoiceSpeaking(false);
        },
        onBlocked: () => {
          setVoiceSpeaking(false);
          setVoiceBlocked(true);
        },
      });
    },
    [muted, selectedVoiceURI, voiceLang]
  );

  // Stop voiceover on unmount
  useEffect(() => {
    return () => {
      tutorialVoiceOver.stop();
    };
  }, []);

  // Trigger chapter narration when playing & chapter/language/voice changes or unmuted
  useEffect(() => {
    if (!playing || muted) {
      tutorialVoiceOver.stop();
      setVoiceSpeaking(false);
      return;
    }
    const key = `${voiceLang}:${selectedVoiceURI}:${activeChapterIdx}`;
    if (lastSpokenKeyRef.current !== key) {
      speakChapter(activeChapterIdx);
    }
  }, [activeChapterIdx, muted, playing, selectedVoiceURI, speakChapter, voiceLang]);

  // Playback timer & animated video renderer
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const drawVideoFrame = (tSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const currentChapters = chaptersRef.current;
      const chIdx = getChapterIndex(currentChapters, tSec);
      const ch = currentChapters[chIdx];
      const localT = Math.max(0, tSec - ch.startSec);
      const localDur = ch.endSec - ch.startSec;
      const u = Math.min(1, localT / localDur);

      ctx.clearRect(0, 0, W, H);

      // Sky gradient (transitions day -> sunset/wildfire -> night with street lights)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      if (chIdx === 0) {
        skyGrad.addColorStop(0, '#0f2744');
        skyGrad.addColorStop(0.6, '#1e3a5f');
        skyGrad.addColorStop(1, '#111827');
      } else if (chIdx === 1) {
        skyGrad.addColorStop(0, '#0b1324');
        skyGrad.addColorStop(1, '#162238');
      } else {
        const isNightScene = u > 0.45;
        skyGrad.addColorStop(0, isNightScene ? '#040812' : '#2a1612');
        skyGrad.addColorStop(0.65, isNightScene ? '#0a1428' : '#4a2117');
        skyGrad.addColorStop(1, '#0b111b');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle perspective grid ground
      const groundY = H * 0.72;
      ctx.fillStyle = chIdx === 2 && u > 0.45 ? '#0d1522' : '#1b2636';
      ctx.fillRect(0, groundY, W, H - groundY);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + i * 42, groundY);
        ctx.lineTo(W / 2 + i * 110, H);
        ctx.stroke();
      }

      if (chIdx === 0) {
        // CHAPTER 1: 2-Day Survival & 30s Helicopter Objective
        // Distant blocky skyline
        const buildings = [
          { x: 60, w: 72, h: 115, c: '#233044' },
          { x: 150, w: 86, h: 150, c: '#1f2b3d' },
          { x: 580, w: 90, h: 135, c: '#253449' },
          { x: 685, w: 76, h: 105, c: '#1e293b' },
        ];
        for (const b of buildings) {
          ctx.fillStyle = b.c;
          ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
          for (let wy = groundY - b.h + 14; wy < groundY - 22; wy += 24) {
            ctx.fillRect(b.x + 12, wy, 14, 12);
            ctx.fillRect(b.x + b.w - 26, wy, 14, 12);
          }
        }

        // Day -> Night -> Day 2 -> Helicopter Landing animation
        const sunAngle = u * Math.PI * 2;
        const orbX = W / 2 + Math.cos(sunAngle - Math.PI) * 230;
        const orbY = groundY - 70 - Math.abs(Math.sin(sunAngle)) * 120;
        ctx.beginPath();
        ctx.arc(orbX, orbY, 20, 0, Math.PI * 2);
        ctx.fillStyle = u > 0.28 && u < 0.68 ? '#bae6fd' : '#fbbf24';
        ctx.fill();

        // Rescue Helicopter descending in second half
        const heliAlpha = Math.min(1, Math.max(0, (u - 0.35) / 0.25));
        if (heliAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = heliAlpha;
          const hx = W * 0.62 - Math.sin(u * 4) * 8;
          const hy = groundY - 125 + Math.min(1, (u - 0.35) / 0.45) * 62;

          // Green landing beacon ring
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(W * 0.62, groundY + 12, 58, 16, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Helicopter voxel body
          ctx.fillStyle = '#334155';
          ctx.fillRect(hx - 48, hy - 22, 86, 36);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(hx - 48, hy - 4, 86, 8);
          ctx.fillRect(hx + 38, hy - 14, 46, 12);
          ctx.fillStyle = '#7dd3fc';
          ctx.fillRect(hx - 44, hy - 18, 22, 14);
          // Spinning rotor
          const rotorW = 55 + Math.cos(tSec * 28) * 55;
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(hx - rotorW, hy - 30, rotorW * 2, 4);
          ctx.restore();
        }

        // Running Blocky Survivor toward Helicopter
        const sx = 180 + u * 230;
        const bob = Math.abs(Math.sin(tSec * 9)) * 6;
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(sx - 12, groundY - 38 - bob, 24, 24);
        ctx.fillStyle = '#e2a885';
        ctx.fillRect(sx - 10, groundY - 58 - bob, 20, 20);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx - 11, groundY - 14, 10, 14);
        ctx.fillRect(sx + 1, groundY - 14, 10, 14);

        // Callout card
        ctx.fillStyle = 'rgba(11, 17, 27, 0.88)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.fillRect(28, 26, 340, 88);
        ctx.strokeRect(28, 26, 340, 88);
        ctx.fillStyle = '#34d399';
        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('OBJECTIVE: SURVIVE 2 DAYS & BOARD CHOPPER', 42, 50);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('• Helicopter lands for ONLY 30s every 2 days', 42, 72);
        ctx.fillText('• Miss it? Hold out 2 more days for next pickup', 42, 92);
      } else if (chIdx === 1) {
        // CHAPTER 2: Using the App (Characters, Cameras, PC/Mobile/Controller, 23 Disasters)
        // Mock UI panel showcase
        const cards = [
          {
            title: '1. PICK CHARACTER',
            lines: ['Adult (110 HP · Balanced)', 'Child (85 HP · +18% Speed)', 'Custom Outfit Colors'],
            color: '#f59e0b',
            x: 36,
          },
          {
            title: '2. CAMERA & CONTROLS',
            lines: ['3rd Person · 1st Person (V)', 'PC Free Cam Scout (C)', 'Roblox PC · Mobile · Controller'],
            color: '#38bdf8',
            x: 286,
          },
          {
            title: '3. 23 DISASTERS & MAP',
            lines: ['6 World Map Regions', '5 Difficulty Tiers', 'Optional Predators & Guns'],
            color: '#a78bfa',
            x: 536,
          },
        ];

        cards.forEach((card, idx) => {
          const activeCard = Math.floor(u * 3) === idx;
          const lift = activeCard ? -8 : 0;
          ctx.fillStyle = activeCard ? 'rgba(24, 35, 54, 0.96)' : 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = activeCard ? card.color : '#334155';
          ctx.lineWidth = activeCard ? 2.5 : 1.2;
          ctx.fillRect(card.x, 42 + lift, 228, 220);
          ctx.strokeRect(card.x, 42 + lift, 228, 220);

          ctx.fillStyle = card.color;
          ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(card.title, card.x + 16, 72 + lift);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
          card.lines.forEach((ln, li) => {
            ctx.fillText(ln, card.x + 16, 112 + li * 34 + lift);
          });

          // Mini blocky badge icon inside card
          ctx.fillStyle = card.color;
          ctx.fillRect(card.x + 16, 224 + lift, activeCard ? 196 : 90, 6);
        });

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          'PC Roblox Controls: W/A/S/D or ↑/↓ Move · ←/→ Turn · Drag Look · Space Jump · I/O Zoom',
          38,
          H - 42
        );
      } else {
        // CHAPTER 3: Hospitals, Supermarkets, Closing Wildfires, Night Street Lights & Flashlight, Sharing Resources
        const isNight = u > 0.45;

        // Hospital (Left) & Supermarket (Right)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(60, groundY - 95, 130, 95);
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(102, groundY - 82, 46, 16);
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('HOSPITAL', 100, groundY - 52);

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(W - 210, groundY - 95, 145, 95);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(W - 178, groundY - 82, 82, 16);
        ctx.fillStyle = '#0f172a';
        ctx.fillText('SUPERMARKET', W - 174, groundY - 52);

        // Dim Street Lights turning on during night
        for (const lx of [250, 520]) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(lx, groundY - 125, 8, 125);
          ctx.fillRect(lx, groundY - 125, 28, 6);
          ctx.fillStyle = isNight ? '#ffd28a' : '#475569';
          ctx.fillRect(lx + 18, groundY - 119, 12, 8);
          if (isNight) {
            const glow = ctx.createRadialGradient(lx + 24, groundY - 110, 4, lx + 24, groundY - 70, 90);
            glow.addColorStop(0, 'rgba(255, 207, 135, 0.24)');
            glow.addColorStop(1, 'rgba(255, 207, 135, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(lx - 70, groundY - 130, 190, 140);
          }
        }

        // Closing Wildfire Flames on far edges creeping inward
        const fireIn = u < 0.48 ? u * 85 : 40;
        for (let fx = 10; fx <= fireIn + 40; fx += 24) {
          const fh = 38 + Math.sin(tSec * 11 + fx) * 14;
          ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
          ctx.fillRect(fx, groundY - fh, 18, fh);
          ctx.fillRect(W - fx - 18, groundY - fh, 18, fh);
        }

        // Survivor at center with 5m Flashlight aura at night
        const px = W / 2 - 40 + Math.sin(u * Math.PI) * 50;
        if (isNight) {
          const aura = ctx.createRadialGradient(px, groundY - 25, 8, px, groundY - 25, 120);
          aura.addColorStop(0, 'rgba(255, 243, 209, 0.42)');
          aura.addColorStop(1, 'rgba(255, 243, 209, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(px, groundY - 25, 120, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(px - 12, groundY - 38, 24, 24);
        ctx.fillStyle = '#e2a885';
        ctx.fillRect(px - 10, groundY - 58, 20, 20);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 11, groundY - 14, 10, 14);
        ctx.fillRect(px + 1, groundY - 14, 10, 14);

        // Rescued civilian companion next to player sharing supply icon
        ctx.fillStyle = '#14b8a6';
        ctx.fillRect(px - 52, groundY - 36, 20, 22);
        ctx.fillStyle = '#d9a788';
        ctx.fillRect(px - 50, groundY - 54, 16, 18);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 51, groundY - 14, 8, 14);
        ctx.fillRect(px - 41, groundY - 14, 8, 14);

        // Callout card
        ctx.fillStyle = 'rgba(11, 17, 27, 0.88)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.fillRect(28, 24, 410, 96);
        ctx.strokeRect(28, 24, 410, 96);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('SURVIVAL TACTICS IN THE FIELD', 42, 48);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 11.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('• Hospitals = Medkits | Supermarkets = Food | Press F for Doors', 42, 68);
        ctx.fillText('• Wildfires close in around you — stay inside safe perimeter!', 42, 86);
        ctx.fillText('• Press L at night for 5m Torch · Civilians share your supplies', 42, 104);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTs) / 1000));
      lastTs = now;
      if (playingRef.current) {
        let next = currentTimeRef.current + dt;
        if (next >= TOTAL_DURATION_SEC) {
          next = TOTAL_DURATION_SEC;
          setPlaying(false);
          playingRef.current = false;
        }
        currentTimeRef.current = next;
        setCurrentTime(next);
      }
      drawVideoFrame(currentTimeRef.current);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleSelectChapter = (idx: number) => {
    const ch = chapters[idx];
    if (!ch) return;
    currentTimeRef.current = ch.startSec;
    setCurrentTime(ch.startSec);
    setPlaying(true);
    playingRef.current = true;
    lastSpokenKeyRef.current = '';
    speakChapter(idx);
  };

  const handleTogglePlay = () => {
    if (playing) {
      setPlaying(false);
      playingRef.current = false;
      tutorialVoiceOver.stop();
      setVoiceSpeaking(false);
    } else {
      if (currentTimeRef.current >= TOTAL_DURATION_SEC - 0.1) {
        currentTimeRef.current = 0;
        setCurrentTime(0);
      }
      setPlaying(true);
      playingRef.current = true;
      lastSpokenKeyRef.current = '';
      speakChapter(getChapterIndex(chapters, currentTimeRef.current));
    }
  };

  const handleRestart = () => {
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setPlaying(true);
    playingRef.current = true;
    lastSpokenKeyRef.current = '';
    speakChapter(0);
  };

  const handleScrub = (val: number) => {
    currentTimeRef.current = val;
    setCurrentTime(val);
    lastSpokenKeyRef.current = '';
    if (playingRef.current && !muted) {
      speakChapter(getChapterIndex(chapters, val));
    }
  };

  const handleLanguageChange = (nextLang: LanguageCode) => {
    setSelectedVoiceURI('');
    onChangeVoiceLang(nextLang);
    lastSpokenKeyRef.current = '';
    if (!muted) {
      setPlaying(true);
      playingRef.current = true;
      speakChapter(activeChapterIdx, nextLang, '');
    }
  };

  const handleVoiceChange = (nextURI: string) => {
    setSelectedVoiceURI(nextURI);
    lastSpokenKeyRef.current = '';
    if (!muted) {
      setPlaying(true);
      playingRef.current = true;
      speakChapter(activeChapterIdx, voiceLang, nextURI);
    }
  };

  const handleClose = () => {
    tutorialVoiceOver.stop();
    onClose();
  };

  const progressPct = Math.min(100, (currentTime / TOTAL_DURATION_SEC) * 100);
  const fmt = (sec: number) => {
    const s = Math.floor(sec);
    return `0:${String(s).padStart(2, '0')}`;
  };

  const selectedLangInfo = LANGUAGES.find((l) => l.code === voiceLang);
  const isRtl = selectedLangInfo?.dir === 'rtl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-video-title"
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full max-w-4xl max-h-[94dvh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#131C2B] p-4 sm:p-6 space-y-4 shadow-2xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>{ui.badge}</span>
            </div>
            <h2
              id="tutorial-video-title"
              className="font-display text-2xl sm:text-3xl font-bold text-white"
            >
              {ui.heading}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Voice-Over Language Picker */}
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/45 bg-slate-900 px-2.5 py-1.5 text-xs">
              <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span className="text-slate-400 font-medium hidden sm:inline">
                {ui.voiceLanguageLabel}:
              </span>
              <select
                aria-label={ui.voiceLanguageLabel}
                value={voiceLang}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-slate-900 text-slate-100">
                    {opt.nativeName} ({opt.name})
                  </option>
                ))}
              </select>
            </label>

            {/* Optional System Voice Picker if multiple voices exist for chosen language */}
            {availableVoices.length > 1 && (
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs">
                <Volume2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <select
                  aria-label={ui.voiceLabel}
                  value={selectedVoiceURI}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer max-w-[140px]"
                >
                  <option value="" className="bg-slate-900 text-slate-100">
                    {ui.autoVoice}
                  </option>
                  {availableVoices.map((v) => (
                    <option
                      key={v.voiceURI}
                      value={v.voiceURI}
                      className="bg-slate-900 text-slate-100"
                    >
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close tutorial video"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chapter Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {chapters.map((ch, idx) => {
            const active = idx === activeChapterIdx;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleSelectChapter(idx)}
                className={`rounded-lg border px-3 py-2 text-start text-xs font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
                  active
                    ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                    : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600'
                }`}
              >
                {ch.title}
              </button>
            );
          })}
        </div>

        {/* Animated Video Canvas */}
        <div
          dir="ltr"
          onClick={() => {
            if (voiceBlocked && !muted) {
              speakChapter(activeChapterIdx);
            }
          }}
          className="relative overflow-hidden rounded-xl border border-slate-700 bg-[#0B111B]"
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={380}
            className="block w-full h-auto aspect-[800/380]"
          />

          {/* Voice-Over Status Overlay if browser paused initial autoplay */}
          {voiceBlocked && !muted && (
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakChapter(activeChapterIdx);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-400 cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>{ui.playVoiceBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Voice-Over Subtitles */}
        <div className="rounded-lg border border-slate-800 bg-[#0B111B]/90 px-4 py-2.5 flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-semibold text-sky-300">
              {muted
                ? ui.mutedLabel
                : voiceSpeaking
                ? `${ui.speakingLabel} (${selectedLangInfo?.nativeName ?? 'English'})`
                : `${ui.scriptLabel} (${selectedLangInfo?.nativeName ?? 'English'})`}
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {activeChapter.caption}
            </p>
          </div>
          {!muted && (
            <button
              type="button"
              onClick={() => speakChapter(activeChapterIdx)}
              className="shrink-0 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:border-sky-400 cursor-pointer whitespace-nowrap"
            >
              {ui.replayVoiceBtn}
            </button>
          )}
        </div>

        {/* Video Transport Controls & Timeline */}
        <div className="space-y-2.5">
          <div dir="ltr" className="flex items-center gap-3">
            <span className="font-mono-tabular text-xs text-slate-300 w-10 shrink-0">
              {fmt(currentTime)}
            </span>
            <input
              type="range"
              aria-label="Tutorial video timeline"
              min={0}
              max={TOTAL_DURATION_SEC}
              step={0.25}
              value={currentTime}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
              style={{
                backgroundSize: `${progressPct}% 100%`,
              }}
            />
            <span className="font-mono-tabular text-xs text-slate-400 w-10 text-right shrink-0">
              {fmt(TOTAL_DURATION_SEC)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400 cursor-pointer whitespace-nowrap"
              >
                {playing ? (
                  <Pause className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-amber-400" />
                )}
                <span>{playing ? ui.pause : ui.play}</span>
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{ui.restart}</span>
              </button>
              <button
                type="button"
                onClick={onToggleMute}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-sky-400 cursor-pointer whitespace-nowrap"
              >
                {muted ? (
                  <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>{muted ? ui.unmuteVoice : ui.muteVoice}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{ui.continueBtn}</span>
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

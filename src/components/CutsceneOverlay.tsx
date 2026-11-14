import { FastForward, Radio } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import { DisasterId } from '../types/game';

interface CutsceneOverlayProps {
  scenarioId: DisasterId;
  mode: 'intro' | 'extraction';
  progress: number; // 0..1
  onSkip: () => void;
}

export function CutsceneOverlay({
  scenarioId,
  mode,
  progress,
  onSkip,
}: CutsceneOverlayProps) {
  const scenario = SCENARIOS[scenarioId];

  const beat =
    mode === 'extraction'
      ? progress < 0.32
        ? {
            tag: 'RESCUE AIRLIFT · 30s EXTRACTION WINDOW',
            headline: 'Boarding Rescue Helicopter',
            detail:
              'Taking a seat inside the open rescue cabin before the 30-second pickup window closes.',
          }
        : progress < 0.72
        ? {
            tag: 'CABIN DOOR VIEW · CLIMBING OVER SECTOR',
            headline: `Ascending Above ${scenario.title}`,
            detail: `Looking out the chopper door at the blocky ${scenario.location} terrain shrinking below.`,
          }
        : {
            tag: 'SAFE CORRIDOR REACHED · MISSION EXTRACTION',
            headline: 'Clear of the Hazard Zone',
            detail: 'Flying safely away from the disaster sector after completing extraction.',
          }
      : progress < 0.34
      ? {
          tag: `EMERGENCY DISPATCH · ${scenario.location.toUpperCase()}`,
          headline: `${scenario.title} Confirmed`,
          detail: scenario.briefing.split('.')[0] + '.',
        }
      : progress < 0.72
      ? {
          tag: 'SECTOR SCAN · HOSPITALS & SUPERMARKETS',
          headline: 'Scavenge Medkits & Food Inside Buildings',
          detail: 'Enter Hospitals for Medkits, Supermarkets for Food, and use your Flashlight (L) at night.',
        }
      : {
          tag: 'HOW TO SURVIVE · 2-DAY CYCLES',
          headline: 'Catch the 30s Rescue Helicopter Every 2 Days',
          detail: `Shelter during ${scenario.severeLabel.toLowerCase()}, guide survivors, and board within 30s when the helicopter lands — miss it and survive 2 more days.`,
        };

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-between pointer-events-none select-none"
      role="region"
      aria-label={mode === 'extraction' ? 'Extraction helicopter cutscene' : 'Opening disaster cutscene'}
    >
      {/* Top Cinematic Letterbox Bar */}
      <div className="pointer-events-auto bg-[#060910] border-b border-slate-800/80 px-5 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Radio
            className={`h-4 w-4 shrink-0 ${
              mode === 'extraction' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          />
          <span
            className={`font-mono-tabular text-xs font-semibold tracking-wider truncate ${
              mode === 'extraction' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {beat.tag}
          </span>
        </div>
        <span className="font-mono-tabular text-xs text-slate-400 shrink-0">
          {mode === 'extraction' ? 'CHOPPER CAM · AIRLIFT' : 'LIVE SECTOR FEED'}
        </span>
      </div>

      {/* Bottom Cinematic Letterbox Bar + Caption & Skip */}
      <div className="pointer-events-auto bg-[#060910] border-t border-slate-800/80 px-5 py-4 sm:px-8 sm:py-5">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {beat.headline}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {beat.detail}
            </p>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-2 self-start sm:self-end rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-amber-400 hover:text-amber-300 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>
              {mode === 'extraction' ? 'Skip to Summary (Space)' : 'Skip Cutscene (Space)'}
            </span>
            <FastForward className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Smooth Progress Bar */}
        <div className="mx-auto max-w-4xl mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-[width] duration-100 ${
              mode === 'extraction' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

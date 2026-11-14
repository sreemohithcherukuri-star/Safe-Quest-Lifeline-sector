import { Award, CheckCircle2, Globe, Lock, ShieldCheck, Trophy, Users, X } from 'lucide-react';
import { ACHIEVEMENTS, REGION_ORDER } from '../data/achievements';
import { DISASTER_ORDER } from '../data/scenarios';
import { t } from '../i18n/translations';
import { CareerStats, LanguageCode } from '../types/game';

interface StatsAchievementsModalProps {
  lang: LanguageCode;
  careerStats: CareerStats;
  onClose: () => void;
}

export function StatsAchievementsModal({
  lang,
  careerStats,
  onClose,
}: StatsAchievementsModalProps) {
  const uniqueDisastersCompleted = Object.keys(careerStats.completedDisasters).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#131C2B] p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 id="stats-modal-title" className="font-display text-2xl font-bold text-slate-100">
              {t(lang, 'achievementsStats')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, 'close')}
            className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Career Telemetry Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[11px] text-slate-400">Survived / Runs</p>
            <p className="font-mono-tabular text-xl font-bold text-emerald-400 mt-0.5">
              {careerStats.runsSurvived}/{careerStats.runsCompleted}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[11px] text-slate-400 inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-sky-400" />
              <span>Best Safety</span>
            </p>
            <p className="font-mono-tabular text-xl font-bold text-sky-300 mt-0.5">
              {careerStats.bestSafetyScore}/100
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[11px] text-slate-400">Career Points</p>
            <p className="font-mono-tabular text-xl font-bold text-amber-300 mt-0.5">
              {careerStats.totalPoints.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[11px] text-slate-400 inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-emerald-400" />
              <span>Civilians Saved</span>
            </p>
            <p className="font-mono-tabular text-xl font-bold text-slate-100 mt-0.5">
              {careerStats.totalCiviliansSaved}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[11px] text-slate-400">Disasters Cleared</p>
            <p className="font-mono-tabular text-xl font-bold text-slate-100 mt-0.5">
              {uniqueDisastersCompleted}/{DISASTER_ORDER.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[11px] text-slate-400 inline-flex items-center gap-1">
              <Globe className="h-3 w-3 text-amber-400" />
              <span>Regions</span>
            </p>
            <p className="font-mono-tabular text-xl font-bold text-slate-100 mt-0.5">
              {careerStats.unlockedRegions.length}/{REGION_ORDER.length}
            </p>
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 inline-flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <span>
                Achievements ({careerStats.achievements.length}/{ACHIEVEMENTS.length})
              </span>
            </h3>
            <span className="font-mono-tabular text-xs text-slate-400">
              Signs Inspected: {careerStats.signsReadCount}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = careerStats.achievements.includes(ach.id);
              const tierColors =
                ach.tier === 'gold'
                  ? 'border-amber-400/60 text-amber-300 bg-amber-500/10'
                  : ach.tier === 'silver'
                  ? 'border-sky-400/60 text-sky-300 bg-sky-500/10'
                  : 'border-orange-400/50 text-orange-300 bg-orange-500/10';
              return (
                <div
                  key={ach.id}
                  className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                    unlocked
                      ? 'border-emerald-500/50 bg-slate-900/80'
                      : 'border-slate-800 bg-slate-900/35 opacity-75'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {unlocked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-100 truncate">{ach.title}</p>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${tierColors}`}
                      >
                        {ach.tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
}

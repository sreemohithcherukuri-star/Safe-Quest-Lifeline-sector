import {
  AlertTriangle,
  Award,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Skull,
  Sparkles,
  Trophy,
  UserMinus,
} from 'lucide-react';
import { DIFFICULTIES } from '../data/achievements';
import { GAME_MODES } from '../data/gameModes';
import { SCENARIOS } from '../data/scenarios';
import { t } from '../i18n/translations';
import {
  ActiveRunState,
  LanguageCode,
  PerformanceEvaluation,
  SurvivorStatus,
} from '../types/game';

interface EndReportModalProps {
  run: ActiveRunState;
  bestPoints: number;
  lang: LanguageCode;
  performanceEval: PerformanceEvaluation | null;
  newlyUnlockedAchievements: string[];
  newlyUnlockedRegion: string | null;
  onPlayAgain: () => void;
  onChangeScenario: () => void;
}

export function EndReportModal({
  run,
  bestPoints,
  lang,
  performanceEval,
  newlyUnlockedAchievements,
  newlyUnlockedRegion,
  onPlayAgain,
  onChangeScenario,
}: EndReportModalProps) {
  const scenario = SCENARIOS[run.scenarioId];
  const isVictory = run.outcome === 'extracted';

  const encounteredSurvivors = Object.values(run.survivorStates).filter(
    (s) => s.status !== 'stranded' || s.inHazard
  );

  const savedSurvivors = Object.values(run.survivorStates).filter(
    (s) => s.status === 'rescued' || s.status === 'self_evacuated' || s.status === 'escorted'
  );

  const getFateDisplay = (status: SurvivorStatus) => {
    switch (status) {
      case 'rescued':
      case 'escorted':
        return { label: 'Rescued with Party', color: 'text-emerald-400', icon: CheckCircle2 };
      case 'self_evacuated':
        return { label: 'Self-Evacuated via Supply', color: 'text-sky-400', icon: CheckCircle2 };
      case 'left_behind':
        return { label: 'Left Behind', color: 'text-amber-400', icon: UserMinus };
      case 'lost':
        return { label: 'Lost to Disaster', color: 'text-red-400', icon: Skull };
      default:
        return { label: 'Stranded in Sector', color: 'text-slate-400', icon: ShieldAlert };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-report-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#131C2B] p-6 md:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{scenario.title}</span>
            <span aria-hidden="true">·</span>
            <span className="text-sky-300">{GAME_MODES[run.gameMode].title}</span>
            <span aria-hidden="true">·</span>
            <span>{scenario.location}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-amber-300">{DIFFICULTIES[run.difficulty].label}</span>
          </div>
          <h2
            id="end-report-title"
            className={`font-display text-3xl md:text-4xl font-bold ${
              isVictory ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isVictory ? 'Extraction Complete' : 'Responder Down'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">{run.outcomeReason}</p>
        </div>

        {/* Unlocks Banner */}
        {(newlyUnlockedRegion || newlyUnlockedAchievements.length > 0) && (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/30 p-3.5 flex flex-wrap items-center gap-3 text-xs">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            {newlyUnlockedRegion && (
              <span className="font-semibold text-emerald-200">
                New Region Unlocked: <strong className="text-white">{newlyUnlockedRegion}</strong>
              </span>
            )}
            {newlyUnlockedAchievements.map((title) => (
              <span
                key={title}
                className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-300"
              >
                <Award className="h-3 w-3" />
                <span>Badge: {title}</span>
              </span>
            ))}
          </div>
        )}

        {/* Run Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 border-b border-slate-800 pb-5">
          <div>
            <p className="text-xs text-slate-400 inline-flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t(lang, 'pointsLabel')}</span>
            </p>
            <p className="font-mono-tabular text-2xl font-bold text-emerald-400">
              {run.points.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-mono-tabular">
              Best: {Math.max(bestPoints, run.points).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Civilians Saved</p>
            <p className="font-mono-tabular text-2xl font-bold text-slate-100">
              {isVictory ? savedSurvivors.length : 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Signs Read</p>
            <p className="font-mono-tabular text-2xl font-bold text-sky-300">
              {Object.keys(run.signsReadIds).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Predators Shot</p>
            <p className="font-mono-tabular text-2xl font-bold text-rose-400">
              {run.predatorsDefeatedCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Items Found</p>
            <p className="font-mono-tabular text-2xl font-bold text-slate-100">
              {run.itemsCollectedCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Time Survived</p>
            <p className="font-mono-tabular text-2xl font-bold text-slate-100">
              {Math.round(run.elapsedSec)}s
            </p>
          </div>
        </div>

        {/* 4-Pillar Safety Performance Score + What You Did vs What You Should Have Done */}
        {performanceEval && (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-display text-xl font-bold text-slate-100">
                    {t(lang, 'safetyScore')}
                  </h3>
                </div>
                <span
                  className={`font-mono-tabular text-2xl font-bold ${
                    performanceEval.totalScore >= 80
                      ? 'text-emerald-400'
                      : performanceEval.totalScore >= 55
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {performanceEval.totalScore} / 100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: t(lang, 'decisionMaking'), val: performanceEval.decisionScore },
                  { label: t(lang, 'hazardAwareness'), val: performanceEval.awarenessScore },
                  { label: t(lang, 'resourceManagement'), val: performanceEval.resourceScore },
                  { label: t(lang, 'officialCompliance'), val: performanceEval.complianceScore },
                ].map((pillar) => (
                  <div
                    key={pillar.label}
                    className="rounded-lg border border-slate-800 bg-[#0B111B]/80 p-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-300 truncate">{pillar.label}</span>
                      <span className="font-mono-tabular font-bold text-sky-300">
                        {pillar.val}/25
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-sky-400"
                        style={{ width: `${Math.min(100, (pillar.val / 25) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT YOU DID VS WHAT YOU SHOULD HAVE DONE Comparison */}
            <div className="space-y-3">
              <h3 className="font-display text-xl font-bold text-amber-300 uppercase tracking-wide">
                {t(lang, 'comparisonTitle')}
              </h3>
              <div className="space-y-2.5">
                {performanceEval.rows.map((row) => {
                  const badge =
                    row.verdict === 'good'
                      ? { text: 'SAFE', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
                      : row.verdict === 'improve'
                      ? { text: 'IMPROVE', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
                      : { text: 'RISK', cls: 'bg-red-500/20 text-red-300 border-red-500/40' };
                  return (
                    <div
                      key={row.topic}
                      className="rounded-xl border border-slate-800 bg-slate-900/55 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-slate-100">{row.topic}</span>
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg border border-slate-800/90 bg-[#0B111B]/70 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            {t(lang, 'whatYouDid')}
                          </p>
                          <p className="text-slate-200 leading-relaxed">{row.whatYouDid}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                            {t(lang, 'whatYouShouldDo')}
                          </p>
                          <p className="text-slate-100 leading-relaxed">{row.whatYouShouldDo}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-sky-300 leading-relaxed">
                        <strong className="text-sky-200">{t(lang, 'whySafer')}:</strong> {row.whySafer}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Civilian Ledger */}
        {encounteredSurvivors.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-200">Civilian Outcome Ledger</h3>
            <div className="divide-y divide-slate-800/80 rounded-lg border border-slate-800 bg-slate-900/50 max-h-[180px] overflow-y-auto">
              {encounteredSurvivors.map((s) => {
                const effectiveStatus: SurvivorStatus =
                  !isVictory && s.status === 'escorted' ? 'lost' : s.status;
                const fate = getFateDisplay(effectiveStatus);
                const Icon = fate.icon;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {s.name} ·{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          {s.role} ({s.roomName})
                        </span>
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${fate.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{fate.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Official Authority Disclaimer */}
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/25 px-4 py-3 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t(lang, 'authorityDisclaimer')}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onChangeScenario}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t(lang, 'changeScenario')}
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t(lang, 'playAgain')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

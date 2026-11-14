import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { t } from '../i18n/translations';
import { LanguageCode, WarningSign } from '../types/game';

interface SignModalProps {
  sign: WarningSign;
  lang: LanguageCode;
  onClose: () => void;
}

export function SignModal({ sign, lang, onClose }: SignModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warning-sign-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-amber-500/60 bg-[#131C2B] p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{t(lang, 'warningSignHeading')}</span>
            </span>
            <h2 id="warning-sign-modal-title" className="font-display text-2xl font-bold text-slate-100">
              {sign.title}
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

        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200 leading-relaxed">
          {sign.message}
        </div>

        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/25 p-4 space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>{t(lang, 'officialGuidanceHeading')}</span>
          </p>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{sign.officialGuidance}</p>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <span className="text-[11px] font-mono-tabular text-emerald-400">+50 Situation Awareness PTS</span>
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

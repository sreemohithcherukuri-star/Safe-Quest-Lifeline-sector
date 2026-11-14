import {
  Camera,
  Compass,
  Eye,
  Gamepad2,
  Globe,
  Keyboard,
  Monitor,
  Moon,
  Settings,
  Smartphone,
  Sparkles,
  Sun,
  Unlock,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { LANGUAGES, t } from '../i18n/translations';
import {
  CameraViewMode,
  ControlPlatform,
  CustomMusicControls,
  GraphicsQuality,
  LanguageCode,
  ThemeMode,
} from '../types/game';
import { CustomMusicPlayer } from './CustomMusicPlayer';

interface SettingsModalProps {
  lang: LanguageCode;
  graphicsQuality: GraphicsQuality;
  viewMode: CameraViewMode;
  controlPlatform: ControlPlatform;
  controllerConnected: boolean;
  theme: ThemeMode;
  muted: boolean;
  sandboxUnlockAll: boolean;
  music: CustomMusicControls;
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangeGraphics: (q: GraphicsQuality) => void;
  onChangeViewMode: (m: CameraViewMode) => void;
  onChangeControlPlatform: (platform: ControlPlatform) => void;
  onOpenControls: () => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onToggleSandbox: () => void;
  onClose: () => void;
}

export function SettingsModal({
  lang,
  graphicsQuality,
  viewMode,
  controlPlatform,
  controllerConnected,
  theme,
  muted,
  sandboxUnlockAll,
  music,
  onChangeLanguage,
  onChangeGraphics,
  onChangeViewMode,
  onChangeControlPlatform,
  onOpenControls,
  onToggleTheme,
  onToggleMute,
  onToggleSandbox,
  onClose,
}: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-[#131C2B] p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-amber-400" />
            <h2 id="settings-modal-title" className="font-display text-2xl font-bold text-slate-100">
              {t(lang, 'settings')}
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

        {/* Language Selection (10 Languages) */}
        <div className="space-y-2.5">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Globe className="h-4 w-4 text-sky-400" />
            <span>{t(lang, 'languageLabel')}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LANGUAGES.map((opt) => {
              const active = opt.code === lang;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => onChangeLanguage(opt.code)}
                  className={`rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-amber-400 bg-amber-500 text-slate-950 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-semibold truncate">{opt.nativeName}</p>
                  <p className={`text-[10px] truncate ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                    {opt.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graphics Quality */}
        <div className="space-y-2.5 border-t border-slate-800 pt-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Monitor className="h-4 w-4 text-emerald-400" />
            <span>{t(lang, 'graphicsQuality')}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'balanced', label: 'Balanced', detail: '1x DPR · Fast Laptop' },
                { id: 'high', label: 'High', detail: '1.5x DPR · Soft Shadows' },
                { id: 'ultra', label: 'Ultra', detail: '2x DPR · Max Particles' },
              ] as Array<{ id: GraphicsQuality; label: string; detail: string }>
            ).map((q) => {
              const active = graphicsQuality === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onChangeGraphics(q.id)}
                  className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-sky-400 bg-sky-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-bold">{q.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{q.detail}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera Perspective */}
        <div className="space-y-2.5 border-t border-slate-800 pt-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Compass className="h-4 w-4 text-amber-400" />
            <span>{t(lang, 'cameraViewLabel')}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onChangeViewMode('third_person')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'third_person'
                  ? 'border-sky-400 bg-sky-400 text-slate-950'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{t(lang, 'thirdPerson')}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('first_person')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'first_person'
                  ? 'border-amber-400 bg-amber-500 text-slate-950'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{t(lang, 'firstPerson')}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('free_cam')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'free_cam'
                  ? 'border-violet-400 bg-violet-400 text-slate-950'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Free Cam (PC)</span>
            </button>
          </div>
        </div>

        {/* Input Profile & Platform Controls */}
        <div className="space-y-2.5 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Gamepad2 className="h-4 w-4 text-sky-400" />
              <span>Controls (PC · Mobile · Controller)</span>
            </label>
            <span
              className={`text-[11px] font-semibold ${
                controllerConnected ? 'text-emerald-300' : 'text-slate-400'
              }`}
            >
              {controllerConnected ? 'Controller Detected' : 'Plug-and-Play Gamepad'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'auto', label: 'Auto Detect', Icon: Sparkles },
                { id: 'pc', label: 'PC (Keys/Mouse)', Icon: Keyboard },
                { id: 'mobile', label: 'Mobile Touch', Icon: Smartphone },
                { id: 'controller', label: 'Controller', Icon: Gamepad2 },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = controlPlatform === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChangeControlPlatform(id)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onOpenControls}
            className="w-full flex items-center justify-between rounded-lg border border-sky-500/40 bg-sky-950/30 px-3.5 py-2 text-xs font-semibold text-sky-200 hover:border-sky-400 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-sky-400" />
              <span>Open Full Controls Guide (PC / Free Cam / Mobile / Controller)</span>
            </span>
            <span className="text-[11px] text-sky-300">Open</span>
          </button>
        </div>

        {/* Display, Audio & Explorer Progression */}
        <div className="space-y-2.5 border-t border-slate-800 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-sky-400" />
                )}
                <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 uppercase">
                {theme}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                {muted ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                )}
                <span>Sound Effects &amp; Sirens</span>
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                {muted ? 'MUTED' : 'ACTIVE'}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleSandbox}
            className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              sandboxUnlockAll
                ? 'border-emerald-500/60 bg-emerald-950/35 text-emerald-200'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="inline-flex items-center gap-2 text-left">
              <Unlock className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{t(lang, 'sandboxUnlock')}</span>
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                sandboxUnlockAll ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {sandboxUnlockAll ? 'ON' : 'OFF'}
            </span>
          </button>

          <div className="border-t border-slate-800 pt-3">
            <CustomMusicPlayer
              music={music}
              muted={muted}
              onUnmute={() => {
                if (muted) onToggleMute();
              }}
            />
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

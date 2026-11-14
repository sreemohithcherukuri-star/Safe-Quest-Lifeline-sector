import {
  ArrowRight,
  Camera,
  Eye,
  Gamepad2,
  Globe,
  Heart,
  Keyboard,
  Palette,
  PlayCircle,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  User,
  Wind,
  Zap,
} from 'lucide-react';
import { CHARACTER_ORDER, CHARACTERS, CharacterDefinition } from '../data/characters';
import { LANGUAGES, t } from '../i18n/translations';
import {
  CameraViewMode,
  CharacterId,
  ControlPlatform,
  CustomMusicControls,
  LanguageCode,
} from '../types/game';
import { CustomMusicPlayer } from './CustomMusicPlayer';

const OUTFIT_SWATCHES: Array<{ label: string; hex?: string; preview: string }> = [
  { label: 'Default', hex: undefined, preview: 'transparent' },
  { label: 'Rescue Red', hex: '#dc2626', preview: '#dc2626' },
  { label: 'Signal Amber', hex: '#d97706', preview: '#d97706' },
  { label: 'Forest Green', hex: '#15803d', preview: '#15803d' },
  { label: 'Responder Cyan', hex: '#0284c7', preview: '#0284c7' },
  { label: 'Cobalt Indigo', hex: '#4338ca', preview: '#4338ca' },
  { label: 'Charcoal Slate', hex: '#334155', preview: '#334155' },
];

interface StartPageProps {
  selectedCharacter: CharacterId;
  customShirtHex?: string;
  viewMode: CameraViewMode;
  controlPlatform: ControlPlatform;
  controllerConnected: boolean;
  lang: LanguageCode;
  muted: boolean;
  music: CustomMusicControls;
  onSelectCharacter: (id: CharacterId) => void;
  onSelectShirtHex: (hex?: string) => void;
  onSelectViewMode: (mode: CameraViewMode) => void;
  onChangeControlPlatform: (platform: ControlPlatform) => void;
  onOpenControls: () => void;
  onOpenTutorial: () => void;
  onChangeLanguage: (lang: LanguageCode) => void;
  onUnmute: () => void;
  onOpenSettings: () => void;
  onEnterGame: () => void;
}

function BlockCharacterPortrait({
  character,
  shirtOverrideHex,
  size = 'lg',
}: {
  character: CharacterDefinition;
  shirtOverrideHex?: string;
  size?: 'sm' | 'lg';
}) {
  const isChild = character.id === 'child';
  const scaleClass =
    size === 'lg'
      ? isChild
        ? 'scale-[0.76] origin-bottom'
        : 'scale-100'
      : isChild
      ? 'scale-[0.44] origin-top'
      : 'scale-[0.58] origin-top';
  const shirtHex = shirtOverrideHex ?? character.shirtHex;

  return (
    <div
      className={`relative flex items-center justify-center ${
        size === 'lg' ? 'h-56 w-44' : 'h-28 w-24'
      }`}
    >
      <div className={`relative flex flex-col items-center ${scaleClass}`}>
        {character.hatStyle === 'hardhat' && (
          <div className="relative z-10 -mb-2 flex flex-col items-center">
            <div
              className="h-3.5 w-16 border-2 border-slate-950/60"
              style={{ backgroundColor: character.accentHex }}
            />
            <div
              className="h-2 w-20 border-2 border-t-0 border-slate-950/60"
              style={{ backgroundColor: character.accentHex }}
            />
          </div>
        )}
        {character.hatStyle === 'cap' && (
          <div className="relative z-10 -mb-1.5 flex flex-col items-center">
            <div
              className="h-3.5 w-16 border-2 border-slate-950/60"
              style={{ backgroundColor: shirtHex }}
            />
            <div
              className="h-1.5 w-20 translate-x-1.5 border-2 border-t-0 border-slate-950/60"
              style={{ backgroundColor: character.accentHex }}
            />
          </div>
        )}
        {character.hatStyle === 'medic' && (
          <div className="relative z-10 -mb-1.5 flex h-4 w-16 items-center justify-center border-2 border-slate-950/60 bg-white">
            <span className="text-[11px] font-black leading-none text-red-600">+</span>
          </div>
        )}

        {/* Cubic Head */}
        <div
          className="relative h-14 w-14 border-2 border-slate-950/70 shadow-md"
          style={{ backgroundColor: character.skinHex }}
        >
          <div className="h-4 w-full" style={{ backgroundColor: character.hairHex }} />
          {character.hatStyle === 'headband' && (
            <div
              className="h-2 w-full border-y border-slate-950/50"
              style={{ backgroundColor: character.accentHex }}
            />
          )}
          {character.hatStyle === 'visor' ? (
            <div
              className="mx-1 mt-1.5 h-3.5 border border-slate-950/70"
              style={{ backgroundColor: character.accentHex }}
            />
          ) : (
            <div className="mt-2 flex justify-between px-2.5">
              <div className="h-2.5 w-2.5 bg-slate-900" />
              <div className="h-2.5 w-2.5 bg-slate-900" />
            </div>
          )}
          <div className="mx-auto mt-1.5 h-1.5 w-4 bg-slate-900/35" />
        </div>

        {/* Torso + Arms */}
        <div className="mt-0.5 flex items-start justify-center gap-0.5">
          <div
            className="h-16 w-4.5 border-2 border-slate-950/70"
            style={{ backgroundColor: shirtHex }}
          />
          <div
            className="relative h-16 w-14 border-2 border-slate-950/70 flex flex-col items-center justify-center"
            style={{ backgroundColor: shirtHex }}
          >
            <div
              className="h-2 w-full opacity-90"
              style={{ backgroundColor: character.accentHex }}
            />
          </div>
          <div
            className="h-16 w-4.5 border-2 border-slate-950/70"
            style={{ backgroundColor: shirtHex }}
          />
        </div>

        {/* Legs */}
        <div className="mt-0.5 flex justify-center gap-0.5">
          <div
            className="h-14 w-6.5 border-2 border-slate-950/70"
            style={{ backgroundColor: character.pantsHex }}
          />
          <div
            className="h-14 w-6.5 border-2 border-slate-950/70"
            style={{ backgroundColor: character.pantsHex }}
          />
        </div>
      </div>
    </div>
  );
}

export function StartPage({
  selectedCharacter,
  customShirtHex,
  viewMode,
  controlPlatform,
  controllerConnected,
  lang,
  muted,
  music,
  onSelectCharacter,
  onSelectShirtHex,
  onSelectViewMode,
  onChangeControlPlatform,
  onOpenControls,
  onOpenTutorial,
  onChangeLanguage,
  onUnmute,
  onOpenSettings,
  onEnterGame,
}: StartPageProps) {
  const activeChar = CHARACTERS[selectedCharacter];

  return (
    <main className="mx-auto max-w-[1320px] px-3.5 sm:px-6 py-5 sm:py-8 md:py-10 space-y-6 sm:space-y-8">
      {/* Starting Hero Banner & Primary Enter Game Action */}
      <section className="rounded-2xl border border-slate-800 bg-[#131C2B] p-4 sm:p-6 md:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t(lang, 'brandSubtitle')}</span>
                </span>
              </div>

              {/* Quick Language + Settings Bar */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs">
                  <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <select
                    aria-label={t(lang, 'languageLabel')}
                    value={lang}
                    onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
                    className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {LANGUAGES.map((opt) => (
                      <option key={opt.code} value={opt.code} className="bg-slate-900 text-slate-100">
                        {opt.nativeName} ({opt.name})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={onOpenControls}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:border-sky-400 cursor-pointer"
                >
                  <Gamepad2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Controls</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-amber-400 cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-300" />
                  <span>{t(lang, 'settings')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white text-balance">
                {t(lang, 'chooseSurvivor')}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Deploy as <span className="text-amber-300 font-semibold">Adult</span> or{' '}
                <span className="text-sky-300 font-semibold">Child</span> across 23 natural disasters.
                Track down rare <span className="text-rose-300 font-semibold">Hospitals (Medkits)</span> and{' '}
                <span className="text-emerald-300 font-semibold">Supermarkets (Food)</span>, switch on your
                night <span className="text-amber-200 font-semibold">Flashlight (L)</span>, scout with PC{' '}
                <span className="text-violet-300 font-semibold">Free Cam (C)</span>, and board the{' '}
                <span className="text-emerald-300 font-semibold">Rescue Helicopter</span> during its{' '}
                <span className="text-white font-semibold">30s window every 2 days</span>.
              </p>
            </div>

            {/* Outfit Customization Swatches */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Palette className="h-3.5 w-3.5 text-amber-400" />
                <span>{t(lang, 'customizeOutfit')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {OUTFIT_SWATCHES.map((sw) => {
                  const active = (customShirtHex ?? undefined) === sw.hex;
                  return (
                    <button
                      key={sw.label}
                      type="button"
                      onClick={() => onSelectShirtHex(sw.hex)}
                      title={sw.label}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'border-amber-400 bg-slate-800 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-sm border border-slate-500/60"
                        style={{
                          backgroundColor: sw.hex ?? activeChar.shirtHex,
                        }}
                      />
                      <span>{sw.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera View Selector (3rd Person Default + 1st Person + PC Free Cam) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 max-w-lg">
                <span className="font-medium text-slate-300">{t(lang, 'cameraViewLabel')}</span>
                <span>V: View · C: Free Cam (PC)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-w-lg rounded-xl bg-slate-900 p-1.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectViewMode('third_person')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'third_person'
                      ? 'bg-sky-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>{t(lang, 'thirdPerson')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectViewMode('first_person')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'first_person'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span>{t(lang, 'firstPerson')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectViewMode('free_cam')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === 'free_cam'
                      ? 'bg-violet-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5 shrink-0" />
                  <span>Free Cam</span>
                </button>
              </div>
            </div>

            {/* Input Platform Selector (PC / Mobile / Controller) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 max-w-lg">
                <span className="font-medium text-slate-300">Controls (PC · Mobile · Controller)</span>
                <button
                  type="button"
                  onClick={onOpenControls}
                  className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                >
                  {controllerConnected ? 'Controller Ready · Guide' : 'View Keybindings'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-w-lg rounded-xl bg-slate-900 p-1.5 border border-slate-800">
                {(
                  [
                    { id: 'auto', label: 'Auto', Icon: Sparkles },
                    { id: 'pc', label: 'PC', Icon: Keyboard },
                    { id: 'mobile', label: 'Mobile', Icon: Smartphone },
                    { id: 'controller', label: 'Pad', Icon: Gamepad2 },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const active = controlPlatform === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChangeControlPlatform(id)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-emerald-400 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 max-w-md">
              <CustomMusicPlayer music={music} muted={muted} onUnmute={onUnmute} />
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onEnterGame}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-lg cursor-pointer whitespace-nowrap"
              >
                <span>{t(lang, 'enterGame')}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onOpenTutorial}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/50 bg-sky-950/35 px-5 py-3.5 text-sm font-semibold text-sky-200 hover:bg-sky-900/50 hover:border-sky-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <PlayCircle className="h-4 w-4 text-sky-400 shrink-0" />
                <span>Watch Tutorial Video</span>
              </button>
            </div>
          </div>

          {/* Selected Character Spotlight */}
          <div className="lg:col-span-5 rounded-xl border border-slate-700/80 bg-[#0B111B] p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-4 shrink-0">
              <BlockCharacterPortrait
                character={activeChar}
                shirtOverrideHex={customShirtHex}
                size="lg"
              />
            </div>

            <div className="space-y-3 min-w-0 flex-1 text-center sm:text-left">
              <div>
                <p
                  className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                  style={{ color: activeChar.accentHex }}
                >
                  {activeChar.callsign} · {activeChar.role}
                </p>
                <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                  {activeChar.name}
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {activeChar.tagline}
                </p>
              </div>

              <div className="space-y-1.5 border-t border-slate-800 pt-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    <span>Max Health</span>
                  </span>
                  <span className="font-mono-tabular font-semibold text-slate-100">
                    {100 + activeChar.bonusHealth} HP
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Wind className="h-3.5 w-3.5 text-sky-400" />
                    <span>Max Stamina</span>
                  </span>
                  <span className="font-mono-tabular font-semibold text-slate-100">
                    {100 + activeChar.bonusStamina}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Move Speed</span>
                  </span>
                  <span className="font-mono-tabular font-semibold text-slate-100">
                    {Math.round(activeChar.speedMultiplier * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Hazard Armor</span>
                  </span>
                  <span className="font-mono-tabular font-semibold text-slate-100">
                    {Math.round((1 - activeChar.damageMultiplier) * 100)}% Resist
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Playable Character Grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-100">
              Select Block Character
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Your chosen character and outfit color appear live in 3rd-Person View and apply custom survival stats.
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-semibold text-emerald-300">
            Active: {activeChar.name} ({activeChar.callsign})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 max-w-3xl gap-4">
          {CHARACTER_ORDER.map((id) => {
            const c = CHARACTERS[id];
            const isSelected = id === selectedCharacter;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCharacter(c.id)}
                className={`text-left rounded-xl border p-4 transition-all cursor-pointer flex items-center gap-4 ${
                  isSelected
                    ? 'border-amber-400 bg-[#182336] shadow-lg'
                    : 'border-slate-800 bg-[#131C2B] hover:border-slate-600'
                }`}
              >
                <div className="flex h-24 w-20 items-center justify-center rounded-lg border border-slate-800 bg-[#0B111B] shrink-0 overflow-hidden pt-2">
                  <BlockCharacterPortrait
                    character={c}
                    shirtOverrideHex={isSelected ? customShirtHex : undefined}
                    size="sm"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono-tabular text-[10px] font-bold tracking-wider uppercase truncate"
                      style={{ color: c.accentHex }}
                    >
                      {c.role}
                    </span>
                    {isSelected && (
                      <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shrink-0">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-white truncate">{c.name}</h3>
                  <p className="text-[11px] font-medium text-emerald-300 truncate">{c.perkLabel}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-snug">{c.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

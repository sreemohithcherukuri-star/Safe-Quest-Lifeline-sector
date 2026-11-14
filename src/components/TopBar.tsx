import { Award, Gamepad2, Globe, Moon, PlayCircle, Settings, Sun, Users, Volume2, VolumeX } from 'lucide-react';
import { t } from '../i18n/translations';
import { GameState, LanguageCode, ThemeMode } from '../types/game';

interface TopBarProps {
  gameState: GameState;
  lang: LanguageCode;
  muted: boolean;
  theme: ThemeMode;
  onToggleMute: () => void;
  onToggleTheme: () => void;
  onGoStartPage: () => void;
  onGoMenu: () => void;
  onOpenStats: () => void;
  onOpenControls: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  onScrollSection: (id: string) => void;
  onPrimaryAction: () => void;
}

export function TopBar({
  gameState,
  lang,
  muted,
  theme,
  onToggleMute,
  onToggleTheme,
  onGoStartPage,
  onGoMenu,
  onOpenStats,
  onOpenControls,
  onOpenTutorial,
  onOpenSettings,
  onScrollSection,
  onPrimaryAction,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0B111B]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 sm:gap-8 px-3 sm:px-6 py-2.5 sm:py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={onGoStartPage}
          className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-100 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
        >
          {t(lang, 'brandTitle')}
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-400">
          {gameState === 'TITLE_MENU' ? (
            <>
              <button
                type="button"
                onClick={onGoStartPage}
                className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Users className="h-4 w-4 text-amber-400" />
                <span>Characters</span>
              </button>
              <button
                type="button"
                onClick={() => onScrollSection('world-map')}
                className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Globe className="h-4 w-4 text-sky-400" />
                <span>{t(lang, 'worldMap')}</span>
              </button>
              <button
                type="button"
                onClick={() => onScrollSection('scenarios-grid')}
                className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t(lang, 'disasters')}
              </button>
            </>
          ) : gameState !== 'START_PAGE' ? (
            <button
              type="button"
              onClick={onGoMenu}
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t(lang, 'changeScenario')}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpenStats}
            className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Award className="h-4 w-4 text-emerald-400" />
            <span>{t(lang, 'achievementsStats')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlayCircle className="h-4 w-4 text-amber-400" />
            <span>Tutorial</span>
          </button>

          <button
            type="button"
            onClick={onOpenControls}
            className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Gamepad2 className="h-4 w-4 text-sky-400" />
            <span>Controls</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="h-4 w-4 text-slate-300" />
            <span>{t(lang, 'settings')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-sky-400" />
            )}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </nav>

        {/* Zone 3: Quick action icons on smaller viewports + primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenStats}
            className="lg:hidden rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:border-emerald-400 cursor-pointer"
            aria-label={t(lang, 'achievementsStats')}
          >
            <Award className="h-4 w-4 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="lg:hidden rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:border-amber-400 cursor-pointer"
            aria-label="Tutorial Video"
          >
            <PlayCircle className="h-4 w-4 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={onOpenControls}
            className="lg:hidden rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:border-sky-400 cursor-pointer"
            aria-label="Controls"
          >
            <Gamepad2 className="h-4 w-4 text-sky-400" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="lg:hidden rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:border-amber-400 cursor-pointer"
            aria-label={t(lang, 'settings')}
          >
            <Settings className="h-4 w-4 text-slate-200" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="lg:hidden rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:border-amber-400 cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-sky-400" />
            )}
          </button>
          <button
            type="button"
            onClick={onPrimaryAction}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            {gameState === 'START_PAGE'
              ? t(lang, 'enterGame')
              : gameState === 'TITLE_MENU'
              ? t(lang, 'deploySimulation')
              : t(lang, 'playAgain')}
          </button>
        </div>
      </div>
    </header>
  );
}

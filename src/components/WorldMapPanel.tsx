import { CheckCircle2, Globe, Lock, MapPin, Unlock } from 'lucide-react';
import { REGIONS, REGION_ORDER } from '../data/achievements';
import { SCENARIOS } from '../data/scenarios';
import { t } from '../i18n/translations';
import { CareerStats, LanguageCode, RegionId } from '../types/game';

interface WorldMapPanelProps {
  lang: LanguageCode;
  careerStats: CareerStats;
  selectedRegion: RegionId | 'all';
  onSelectRegion: (region: RegionId | 'all') => void;
}

export function WorldMapPanel({
  lang,
  careerStats,
  selectedRegion,
  onSelectRegion,
}: WorldMapPanelProps) {
  const isRegionUnlocked = (regionId: RegionId) =>
    careerStats.sandboxUnlockAll || careerStats.unlockedRegions.includes(regionId);

  return (
    <section id="world-map" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-sky-400" />
            <span>{t(lang, 'worldMap')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore 6 geographical biomes and 23 disaster scenarios. Complete scenarios to unlock new regions or enable Explorer Mode in Settings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectRegion('all')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            selectedRegion === 'all'
              ? 'border-amber-400 bg-amber-500 text-slate-950'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          All 6 Regions ({Object.keys(SCENARIOS).length} Disasters)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Interactive Topographic SVG World Map */}
        <div className="lg:col-span-7 relative rounded-xl border border-slate-800 bg-[#0D1624] p-4 overflow-hidden min-h-[280px] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-2">
            <span className="font-mono-tabular uppercase tracking-wider text-sky-300 font-semibold">
              SafeQuest Global Sector Grid
            </span>
            <span className="font-mono-tabular">
              {careerStats.sandboxUnlockAll
                ? '6/6 Explorer Active'
                : `${careerStats.unlockedRegions.length}/${REGION_ORDER.length} Regions Unlocked`}
            </span>
          </div>

          <div className="relative w-full aspect-[16/9] rounded-lg border border-slate-800/90 bg-[#08101B] overflow-hidden">
            {/* Stylized Continental Topographic Silhouette */}
            <svg
              viewBox="0 0 100 60"
              className="h-full w-full"
              role="img"
              aria-label="SafeQuest Interactive World Map"
            >
              {/* Grid lines */}
              <g stroke="#1e293b" strokeWidth="0.25" strokeDasharray="1 1">
                <line x1="0" y1="15" x2="100" y2="15" />
                <line x1="0" y1="30" x2="100" y2="30" />
                <line x1="0" y1="45" x2="100" y2="45" />
                <line x1="25" y1="0" x2="25" y2="60" />
                <line x1="50" y1="0" x2="50" y2="60" />
                <line x1="75" y1="0" x2="75" y2="60" />
              </g>

              {/* Continental landmasses */}
              <path
                d="M8,16 L24,10 L35,14 L38,24 L31,31 L20,30 L12,24 Z"
                fill="#172536"
                stroke="#293d57"
                strokeWidth="0.4"
              />
              <path
                d="M19,33 L33,34 L36,44 L29,52 L22,49 L17,40 Z"
                fill="#1b2636"
                stroke="#293d57"
                strokeWidth="0.4"
              />
              <path
                d="M41,10 L62,8 L72,15 L65,24 L45,25 L39,18 Z"
                fill="#18283b"
                stroke="#293d57"
                strokeWidth="0.4"
              />
              <path
                d="M41,24 L56,24 L59,36 L52,47 L43,43 L38,32 Z"
                fill="#172334"
                stroke="#293d57"
                strokeWidth="0.4"
              />
              <path
                d="M65,16 L88,14 L92,26 L84,35 L69,34 L63,25 Z"
                fill="#19283c"
                stroke="#293d57"
                strokeWidth="0.4"
              />
              <path
                d="M70,38 L85,37 L88,48 L77,52 L67,46 Z"
                fill="#162436"
                stroke="#293d57"
                strokeWidth="0.4"
              />

              {/* Travel routes connecting regions */}
              <polyline
                points={REGION_ORDER.map(
                  (id) => `${REGIONS[id].mapX},${(REGIONS[id].mapY / 100) * 60}`
                ).join(' ')}
                fill="none"
                stroke="#334155"
                strokeWidth="0.35"
                strokeDasharray="1.2 1.2"
              />
            </svg>

            {/* Interactive Region Pin Buttons */}
            {REGION_ORDER.map((regionId) => {
              const reg = REGIONS[regionId];
              const unlocked = isRegionUnlocked(regionId);
              const isSelected = selectedRegion === regionId;
              const completedInRegion = reg.disasters.filter(
                (d) => (careerStats.completedDisasters[d] ?? 0) > 0
              ).length;

              return (
                <button
                  key={regionId}
                  type="button"
                  onClick={() => onSelectRegion(isSelected ? 'all' : regionId)}
                  style={{
                    left: `${reg.mapX}%`,
                    top: `${reg.mapY}%`,
                    borderColor: isSelected ? '#fbbf24' : unlocked ? reg.accentHex : '#475569',
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2 py-1 text-[10px] font-semibold transition-transform cursor-pointer flex items-center gap-1 shadow-lg whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 scale-110 z-20'
                      : unlocked
                      ? 'bg-[#0B111B]/95 text-slate-100 hover:scale-105 z-10'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 z-10'
                  }`}
                >
                  {unlocked ? (
                    <MapPin
                      className="h-3 w-3 shrink-0"
                      style={{ color: isSelected ? '#0f172a' : reg.accentHex }}
                    />
                  ) : (
                    <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                  )}
                  <span>{reg.name.split('&')[0].trim()}</span>
                  <span className="font-mono-tabular opacity-80">
                    {completedInRegion}/{reg.disasters.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Directory Cards */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {REGION_ORDER.map((regionId) => {
            const reg = REGIONS[regionId];
            const unlocked = isRegionUnlocked(regionId);
            const isSelected = selectedRegion === regionId;
            const completedCount = reg.disasters.filter(
              (d) => (careerStats.completedDisasters[d] ?? 0) > 0
            ).length;

            return (
              <button
                key={regionId}
                type="button"
                onClick={() => onSelectRegion(isSelected ? 'all' : regionId)}
                className={`text-left rounded-xl border p-3 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-amber-400 bg-[#182336]'
                    : 'border-slate-800 bg-[#131C2B] hover:border-slate-600'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: reg.accentHex }}
                    />
                    <span className="font-display text-base font-bold text-slate-100 truncate">
                      {reg.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-300 font-medium">{reg.biome}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{reg.description}</p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                      <Unlock className="h-3 w-3" />
                      <span>Open</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                      <Lock className="h-3 w-3" />
                      <span>Locked</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-mono-tabular text-[11px] text-slate-300">
                    <CheckCircle2 className="h-3 w-3 text-amber-400" />
                    <span>
                      {completedCount}/{reg.disasters.length}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

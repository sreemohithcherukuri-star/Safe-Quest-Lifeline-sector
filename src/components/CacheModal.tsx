import { Package, X } from 'lucide-react';
import { createItem, SCENARIOS } from '../data/scenarios';
import { ActiveRunState, CacheNode, ItemType } from '../types/game';

interface CacheModalProps {
  run: ActiveRunState;
  cache: CacheNode;
  remainingItems: ItemType[];
  onTakeItem: (cacheId: string, itemType: ItemType, idx: number) => void;
  onTakeAll: (cacheId: string) => void;
  onClose: () => void;
}

export function CacheModal({
  run,
  cache,
  remainingItems,
  onTakeItem,
  onTakeAll,
  onClose,
}: CacheModalProps) {
  const scenario = SCENARIOS[run.scenarioId];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cache-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-sky-500/60 bg-[#131C2B] p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-sky-400">
              {cache.roomName || 'Supply Cache'}
            </p>
            <h3
              id="cache-modal-title"
              className="font-display text-2xl font-bold text-slate-100 inline-flex items-center gap-2"
            >
              <Package className="h-5 w-5 text-sky-400" />
              <span>{cache.label}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cache dialog"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Supplies Inside</span>
            <span className="font-mono-tabular text-emerald-400">
              Storage: Unlimited ({run.inventory.length} carried)
            </span>
          </div>

          {remainingItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-3">This supply chest is empty.</p>
          ) : (
            <div className="space-y-2">
              {remainingItems.map((itemType, idx) => {
                const tpl = createItem(itemType, scenario, `cache-item-${idx}`);
                return (
                  <div
                    key={`${itemType}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl leading-none shrink-0" aria-hidden="true">
                        {tpl.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100">{tpl.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{tpl.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTakeItem(cache.id, itemType, idx)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold shrink-0 bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                    >
                      Take
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {remainingItems.length > 1 && (
            <button
              type="button"
              onClick={() => onTakeAll(cache.id)}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              Take All ({remainingItems.length})
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

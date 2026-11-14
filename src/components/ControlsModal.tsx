import { Camera, Gamepad2, Keyboard, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { ControlPlatform } from '../types/game';

interface ControlsModalProps {
  controlPlatform: ControlPlatform;
  controllerConnected: boolean;
  onSelectPlatform: (platform: ControlPlatform) => void;
  onClose: () => void;
}

type TabId = 'pc' | 'mobile' | 'controller';

export function ControlsModal({
  controlPlatform,
  controllerConnected,
  onSelectPlatform,
  onClose,
}: ControlsModalProps) {
  const initialTab: TabId =
    controlPlatform === 'mobile'
      ? 'mobile'
      : controlPlatform === 'controller' || (controlPlatform === 'auto' && controllerConnected)
      ? 'controller'
      : 'pc';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const pcBindings: Array<{ keys: string; action: string }> = [
    { keys: 'W A S D / ↑ ↓', action: 'Walk Forward / Back & Strafe' },
    { keys: '← → Arrows / , . / Q E', action: 'Turn Camera Left / Right (Roblox)' },
    { keys: 'Right-Click or Left Drag', action: 'Rotate Camera Look' },
    { keys: 'Scroll Wheel / I & O', action: 'Zoom Camera In / Out (3rd-Person)' },
    { keys: 'Shift', action: 'Sprint (Boosts Jump Distance)' },
    { keys: 'Space', action: 'Jump / Vault Low Rubble' },
    { keys: 'F', action: 'Interact / Doors / Rescue / Board Heli' },
    { keys: 'L', action: 'Toggle Night Flashlight' },
    { keys: 'H', action: 'Quick-Use Trauma Medkit' },
    { keys: 'Left Click / G', action: 'Fire Equipped 30s Gun' },
    { keys: 'V', action: 'Switch 3rd-Person / 1st-Person View' },
    { keys: 'C', action: 'Toggle PC Free Cam' },
    { keys: 'M', action: 'Expand / Minimize World Map' },
  ];

  const freeCamBindings: Array<{ keys: string; action: string }> = [
    { keys: 'C', action: 'Enter or Exit PC Free Cam' },
    { keys: 'W A S D / ↑ ↓', action: 'Fly Freely in Camera Direction' },
    { keys: '← → Arrows / Mouse Drag', action: 'Turn Left / Right & 360° Look' },
    { keys: 'Space / PageUp', action: 'Fly Straight Up (+Altitude)' },
    { keys: 'X / PageDown', action: 'Fly Straight Down (-Altitude)' },
    { keys: 'Shift', action: 'Turbo Fly Boost (2.2× Speed)' },
    { keys: 'Mouse Scroll Wheel', action: 'Adjust Free Cam Flight Speed' },
  ];

  const mobileBindings: Array<{ input: string; action: string }> = [
    { input: 'Left Half Drag (Floating Stick)', action: 'Walk & Run in Any Direction' },
    { input: 'Right Half Drag', action: 'Rotate Camera & Aim' },
    { input: 'Tap Screen / FIRE Button', action: 'Fire Equipped 30s Gun' },
    { input: 'PROMPT (F) Card Tap', action: 'Pick Up Supplies, Open Doors, Rescue, Board' },
    { input: 'LIGHT Button', action: 'Toggle Flashlight During Night Time' },
    { input: 'SPRINT / JUMP Buttons', action: 'Toggle Sprint & Jump Over Debris' },
    { input: 'Pack Pills & Heal (H)', action: 'Use Medkits, Food & Flares' },
    { input: 'Minimap Tap', action: 'Open Full Sector Map & Zoom' },
  ];

  const controllerBindings: Array<{ button: string; action: string }> = [
    { button: 'Left Stick', action: 'Move Survivor' },
    { button: 'Right Stick', action: 'Look / Aim Camera' },
    { button: 'A / Cross', action: 'Jump' },
    { button: 'X / Square', action: 'Interact / Doors / Rescue / Board Heli' },
    { button: 'B / Circle', action: 'Quick Heal (Use Medkit)' },
    { button: 'Y / Triangle', action: 'Toggle 3rd-Person / 1st-Person View' },
    { button: 'LB / L3', action: 'Hold to Sprint' },
    { button: 'RB / RT', action: 'Fire Equipped Gun' },
    { button: 'LT / D-Pad Up', action: 'Toggle Night Flashlight' },
    { button: 'D-Pad Down', action: 'Quick Heal (Use Medkit)' },
    { button: 'Start / View', action: 'Toggle Expanded World Map' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="controls-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-xl border border-slate-700 bg-[#131C2B] p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="h-5 w-5 text-amber-400" />
            <div>
              <h2 id="controls-modal-title" className="font-display text-2xl font-bold text-slate-100">
                Controls: PC, Mobile &amp; Controller
              </h2>
              <p className="text-xs text-slate-400">
                All three input devices work automatically — choose your preferred HUD hint profile below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close controls dialog"
            className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Active HUD Input Profile Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-300">Active Input Profile</span>
            {controllerConnected && (
              <span className="rounded bg-emerald-500/20 border border-emerald-500/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                Controller Detected
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'auto', label: 'Auto Detect', sub: 'Adaptive' },
                { id: 'pc', label: 'PC', sub: 'Keyboard + Free Cam' },
                { id: 'mobile', label: 'Mobile', sub: 'Touch Joystick' },
                { id: 'controller', label: 'Controller', sub: 'Gamepad Glyphs' },
              ] as Array<{ id: ControlPlatform; label: string; sub: string }>
            ).map((opt) => {
              const selected = controlPlatform === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectPlatform(opt.id);
                    if (opt.id !== 'auto') setActiveTab(opt.id);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'border-amber-400 bg-amber-500 text-slate-950'
                      : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className={`text-[10px] ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
                    {opt.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Guide Tabs */}
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('pc')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'pc' ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>PC &amp; Free Cam</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'mobile' ? 'bg-emerald-400 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile Touch</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('controller')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'controller'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>Controller</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'pc' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pcBindings.map((item) => (
                <div
                  key={item.keys}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs"
                >
                  <span className="text-slate-300">{item.action}</span>
                  <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-amber-300 shrink-0">
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-violet-500/45 bg-violet-950/25 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                <Camera className="h-4 w-4" />
                <span>PC Free Cam Mode (Scout Rare Hospitals, Supermarkets &amp; Helicopter)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {freeCamBindings.map((item) => (
                  <div
                    key={item.keys}
                    className="flex items-center justify-between gap-2 rounded-lg border border-violet-500/30 bg-slate-950/60 px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-slate-200">{item.action}</span>
                    <kbd className="rounded bg-violet-900/60 border border-violet-500/40 px-2 py-0.5 font-mono-tabular text-[10px] font-semibold text-violet-200 shrink-0">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mobile' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mobileBindings.map((item) => (
              <div
                key={item.input}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-1"
              >
                <p className="text-xs font-bold text-emerald-300">{item.input}</p>
                <p className="text-xs text-slate-300">{item.action}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'controller' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Supports standard Xbox, PlayStation DualSense/DualShock, Switch Pro, and Backbone/mobile Bluetooth controllers via browser Gamepad API.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {controllerBindings.map((item) => (
                <div
                  key={item.button}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs"
                >
                  <span className="text-slate-300">{item.action}</span>
                  <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-amber-300 shrink-0">
                    {item.button}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

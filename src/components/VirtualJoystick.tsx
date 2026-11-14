import { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onVectorChange: (vec: { x: number; y: number }) => void;
}

export function VirtualJoystick({ onVectorChange }: VirtualJoystickProps) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);

  const maxRadius = typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 48;

  const updateKnob = (clientX: number, clientY: number) => {
    const orig = originRef.current;
    if (!orig) return;
    let dx = clientX - orig.x;
    let dy = clientY - orig.y;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnob({ x: dx, y: dy });
    onVectorChange({
      x: dx / maxRadius,
      y: dy / maxRadius,
    });
  };

  const reset = useCallback(() => {
    pointerIdRef.current = null;
    originRef.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    onVectorChange({ x: 0, y: 0 });
  }, [onVectorChange]);

  useEffect(() => {
    const onBlurOrHide = () => {
      if (pointerIdRef.current !== null) reset();
    };
    window.addEventListener('blur', onBlurOrHide);
    document.addEventListener('visibilitychange', onBlurOrHide);
    return () => {
      window.removeEventListener('blur', onBlurOrHide);
      document.removeEventListener('visibilitychange', onBlurOrHide);
    };
  }, [reset]);

  return (
    <div
      role="application"
      aria-label="Dynamic Movement Joystick Zone"
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.stopPropagation();
        pointerIdRef.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore if capture is unsupported
        }
        const pos = { x: e.clientX, y: e.clientY };
        originRef.current = pos;
        setOrigin(pos);
        setKnob({ x: 0, y: 0 });
        onVectorChange({ x: 0, y: 0 });
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        updateKnob(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current === e.pointerId) {
          e.stopPropagation();
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {
            // ignore if capture already released
          }
          reset();
        }
      }}
      onPointerCancel={(e) => {
        if (pointerIdRef.current === e.pointerId) {
          reset();
        }
      }}
      className="fixed inset-y-0 left-0 w-1/2 z-10 touch-none select-none cursor-crosshair"
    >
      {/* Compact resting hint in bottom-left when joystick is not pressed */}
      {!origin && (
        <div className="pointer-events-none absolute bottom-3 left-3 sm:bottom-6 sm:left-6 flex items-center gap-2 opacity-75">
          <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full border-2 border-dashed border-slate-500/70 bg-slate-950/55 flex items-center justify-center">
            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-slate-300/80" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 bg-slate-950/75 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-slate-800">
            <span className="sm:hidden">Move</span>
            <span className="hidden sm:inline">Drag left for Move</span>
          </span>
        </div>
      )}

      {/* Floating Joystick spawned exactly at press coordinates */}
      {origin && (
        <div
          style={{
            left: `${origin.x}px`,
            top: `${origin.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none fixed h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-amber-400/90 bg-slate-950/70 flex items-center justify-center shadow-2xl"
        >
          <div className="absolute inset-2.5 sm:inset-3 rounded-full border border-slate-600/60" />
          <div
            style={{
              transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
            }}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-amber-200 bg-amber-500 shadow-lg"
          />
        </div>
      )}
    </div>
  );
}

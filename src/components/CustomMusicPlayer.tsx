import { Music, Pause, Play, Repeat, Upload, Volume2, VolumeX, X } from 'lucide-react';
import { useRef } from 'react';
import { CustomMusicControls } from '../types/game';

interface CustomMusicPlayerProps {
  music: CustomMusicControls;
  muted?: boolean;
  variant?: 'full' | 'compact';
  onUnmute?: () => void;
}

export function CustomMusicPlayer({
  music,
  muted = false,
  variant = 'full',
  onUnmute,
}: CustomMusicPlayerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      music.onUploadFile(file);
    }
    e.target.value = '';
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-col items-end gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
          className="hidden"
          onChange={handleFileChange}
        />
        {!music.hasTrack ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              fileInputRef.current?.click();
              e.currentTarget.blur();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#0B111B]/90 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-sky-400/70 hover:text-white shadow-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Music className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>Upload Music</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#0B111B]/92 px-2.5 py-1.5 shadow-xl max-w-[275px]">
            <Music className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] font-medium text-slate-100 truncate min-w-0 flex-1">
              {music.trackName}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                if (muted && onUnmute) onUnmute();
                music.onTogglePlay();
                e.currentTarget.blur();
              }}
              title={music.isPlaying ? 'Pause music' : 'Play music'}
              aria-label={music.isPlaying ? 'Pause music' : 'Play music'}
              className="rounded p-1 bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer shrink-0"
            >
              {music.isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <button
              type="button"
              aria-pressed={music.isLooping}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                music.onToggleLoop();
                e.currentTarget.blur();
              }}
              title={music.isLooping ? 'Repeat ON' : 'Repeat OFF'}
              className={`rounded p-1 transition-colors cursor-pointer shrink-0 ${
                music.isLooping
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Repeat className="h-3 w-3" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                fileInputRef.current?.click();
                e.currentTarget.blur();
              }}
              title="Upload new track"
              aria-label="Upload new track"
              className="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <Upload className="h-3 w-3" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                music.onClearTrack();
                e.currentTarget.blur();
              }}
              title="Remove music"
              aria-label="Remove music"
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {music.error && (
          <p className="rounded-lg border border-amber-500/60 bg-amber-950/90 px-2.5 py-1 text-[10px] font-medium text-amber-200 max-w-[275px]">
            {music.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <Music className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span>Custom Music Player</span>
        </span>
        <span className="text-[11px] text-slate-400">
          {music.hasTrack
            ? music.isPlaying
              ? music.isLooping
                ? 'Playing on repeat'
                : 'Playing'
              : 'Ready to play'
            : 'MP3, WAV, OGG, M4A'}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
        className="hidden"
        onChange={handleFileChange}
      />

      {!music.hasTrack ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/75 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-sky-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span>Upload Audio Track (MP3, WAV, OGG, M4A)</span>
        </button>
      ) : (
        <div className="rounded-lg border border-slate-700/80 bg-slate-900/90 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-100 truncate">{music.trackName}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (muted && onUnmute) onUnmute();
                  music.onTogglePlay();
                }}
                title={music.isPlaying ? 'Pause music' : 'Play music'}
                className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-2.5 py-1 text-xs font-semibold text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer"
              >
                {music.isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Play</span>
                  </>
                )}
              </button>
              <button
                type="button"
                aria-pressed={music.isLooping}
                onClick={music.onToggleLoop}
                title="Toggle Repeat"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  music.isLooping
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Repeat className="h-3 w-3" />
                <span>{music.isLooping ? 'Repeat' : 'Once'}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change audio file"
                className="rounded-md bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={music.onClearTrack}
                title="Remove track"
                aria-label="Remove track"
                className="rounded-md bg-slate-800 p-1.5 text-slate-400 hover:bg-red-950/60 hover:text-red-300 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {muted ? (
              <VolumeX className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={music.volume}
              onChange={(e) => music.onVolumeChange(Number(e.target.value))}
              aria-label="Music volume"
              className="h-1.5 w-full accent-sky-400 cursor-pointer"
            />
            <span className="font-mono-tabular w-8 text-right text-slate-300">
              {Math.round(music.volume * 100)}%
            </span>
          </div>

          {muted && (
            <div className="flex items-center justify-between gap-2 rounded bg-rose-950/40 border border-rose-500/40 px-2.5 py-1 text-[11px] text-rose-200">
              <span>Audio is currently muted.</span>
              {onUnmute && (
                <button
                  type="button"
                  onClick={onUnmute}
                  className="font-semibold text-amber-300 hover:underline cursor-pointer"
                >
                  Unmute
                </button>
              )}
            </div>
          )}

          {music.error && (
            <p className="rounded bg-amber-950/45 border border-amber-500/50 px-2.5 py-1 text-[11px] text-amber-200">
              {music.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

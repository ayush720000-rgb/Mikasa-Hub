import { appPath } from '../utils/basePath';
import React, { useState } from 'react';
import { ChevronLeft, Info, Moon, Sun, Trophy, Volume2, VolumeX } from 'lucide-react';
import { PlayerProfile } from '../types/ludo';
import { sound } from '../utils/soundEffects';
import { PlayerOnlineBadge } from './PlayerOnlineBadge';

interface HeaderProps {
  user: PlayerProfile;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentRoom?: string | null;
  onLeaveRoom?: () => void;
  onOpenProfile: () => void;
  onOpenHowToPlay: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  onToggleTheme,
  currentRoom,
  onLeaveRoom,
  onOpenProfile,
  onOpenHowToPlay,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  const isLight = theme === 'light';

  return (
    <header
      className={`sticky top-0 z-30 w-full px-4 py-2.5 transition-colors duration-200 border-b ${
        isLight
          ? 'fake-glass-light text-slate-900 border-slate-200'
          : 'fake-glass-dark text-slate-100 border-emerald-500/30'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-3">
          {currentRoom ? (
            <button
              onClick={onLeaveRoom}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-600 shadow-xs'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 text-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Leave</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Mascot Mini Badge */}
              <div className="relative">
                <img
                  src={appPath("/assets/mikasa-mascot.jpg")}
                  alt="Mikasa Mascot"
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 text-[11px] animate-pulse">🎲</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-sm flex items-center gap-1.5">
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>
                    Mikasa ~ Ludo
                  </span>
                  </span>
              </div>
            </div>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* THEME TOGGLE: Switch between Dark & Light */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleTheme();
            }}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200  border-amber-300 text-amber-800'
                : 'bg-[#24103A] hover:bg-[#2F1449]  border-emerald-400/40 text-amber-300'
            }`}
          >
            {isLight ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-300" />}
          </button>

          {/* How to play guide button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenHowToPlay();
            }}
            title="How to Play"
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-amber-200/80 text-slate-700'
                : 'bg-[#1A0D2A] hover:bg-[#230B3A] border-emerald-500/30 text-emerald-200'
            }`}
          >
            <Info className="w-4.5 h-4.5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-amber-200/80 text-slate-700'
                : 'bg-[#1A0D2A] hover:bg-[#230B3A] border-emerald-500/30 text-emerald-200'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4.5 h-4.5 text-emerald-500" />
            ) : (
              <Volume2 className="w-4.5 h-4.5 text-emerald-500" />
            )}
          </button>

          {/* User profile pill */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-sm ${
              isLight
                ? 'bg-white  border-amber-200'
                : 'bg-[#1D0F2E] hover:bg-[#2A1540]  border-emerald-500/30'
            }`}
          >
            <div className="relative">
              <img
                src={user.avatarUrl || appPath("/assets/mikasa-mascot-thumb.jpg")}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-lg object-cover border border-emerald-400/50"
              />
              <div className="absolute -bottom-1 -right-1">
                <PlayerOnlineBadge status="online" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span
                className={`text-xs font-semibold leading-none truncate max-w-[80px] ${
                  isLight ? 'text-slate-800' : 'text-slate-100'
                }`}
              >
                {user.name}
              </span>
              <span className="text-[10px] text-amber-500 font-mono leading-tight flex items-center gap-0.5 font-bold">
                <Trophy className="w-2.5 h-2.5" /> {user.wins}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

import { appPath } from '../utils/basePath';
import React, { useState } from 'react';
import {
  ChevronRight,
  Crown,
  Flame,
  History,
  KeyRound,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { PlayerProfile } from '../types/ludo';
import { sound } from '../utils/soundEffects';
import { PlayerOnlineBadge } from './PlayerOnlineBadge';

interface HomeScreenProps {
  user: PlayerProfile;
  theme: 'dark' | 'light';
  onCreateLobby: () => void;
  onJoinLobby: (code: string) => void;
  onQuickPractice: () => void;
  onOpenProfile: () => void;
  onOpenMatchHistory: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  theme,
  onCreateLobby,
  onJoinLobby,
  onQuickPractice,
  onOpenProfile,
  onOpenMatchHistory,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const isLight = theme === 'light';

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinCodeInput.trim().toUpperCase();
    if (cleaned.length >= 4) {
      sound.playClick();
      setIsJoinModalOpen(false);
      onJoinLobby(cleaned);
    }
  };

  const winRate =
    user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0;

  return (
    <div className="screen-enter flex-1 max-w-4xl mx-auto w-full min-w-0 px-3 py-4 sm:p-6 flex flex-col gap-5 relative overflow-x-hidden">
      {/* Radiant Ambient Background Atmosphere & Playful Floating Motifs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10">

        {/* Playful Floating Stickers */}
      </div>

      {/* Hero Profile Podium Card (Tactile Claymorphism with Jewel/Gold Trim) */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 border ${
          isLight
            ? 'clay-card-light'
            : 'clay-card-dark'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* User Avatar with Glowing Online Indicator */}
            <div className="relative group cursor-pointer" onClick={onOpenProfile}>
              <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-xl relative bg-amber-500/10">
                <img
                  src={user.avatarUrl || appPath("/assets/mikasa-mascot-thumb.jpg")}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Requirement 3: Small glowing dot beside player avatar */}
              <div className="absolute -bottom-1 -right-1 bg-slate-900/90 rounded-full p-1 border border-white/20 shadow-md">
                <PlayerOnlineBadge status="online" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start min-w-0 max-w-full">
                <h2
                  className={`text-xl sm:text-2xl font-black tracking-tight min-w-0 max-w-full break-words ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {user.name}
                </h2>
                {user.isTelegram && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-400/40 text-[10px] font-black uppercase tracking-wider shadow-xs">
                    Telegram
                  </span>
                )}
              </div>


              {/* Ranking Badge & Quick Edit Button */}
              <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1 rounded-xl bg-amber-500/25 border border-amber-400/50 text-[11px] font-black text-amber-600 dark:text-amber-300 flex items-center gap-1.5 shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Grandmaster Ludo
                </span>
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenProfile();
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Quick Statistics Strip in Distinct Pastel Candy & Jewel Pods */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full sm:w-auto min-w-0 max-w-full">
            {/* Matches Pod - Cyan */}
            <div
              className={`flex min-w-0 flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border transition-all ${
                isLight
                  ? 'bg-teal-50 border-teal-200 text-teal-900 shadow-sm'
                  : 'bg-[#1C0C2A] border-teal-500/35 text-teal-200 shadow-inner'
              }`}
            >
              <span className="text-[9px] sm:text-[11px] text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 font-bold leading-tight text-center min-w-0">
                <Swords className="w-3.5 h-3.5 text-teal-500" /> Matches
              </span>
              <span
                className={`text-lg font-black mt-0.5 ${
                  isLight ? 'text-teal-950' : 'text-teal-100'
                }`}
              >
                {user.gamesPlayed}
              </span>
            </div>

            {/* Wins Pod - Imperial Honey Gold */}
            <div
              className={`flex min-w-0 flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border transition-all ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                  : 'bg-[#2C1D0B] border-amber-500/40 text-amber-200 shadow-inner'
              }`}
            >
              <span className="text-[9px] sm:text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 font-bold leading-tight text-center min-w-0">
                <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" /> Wins
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{user.wins}</span>
            </div>

            {/* Win Rate Pod - Neon Ruby */}
            <div
              className={`flex min-w-0 flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border transition-all ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
                  : 'bg-[#1D0B2F] border-emerald-500/35 text-emerald-200 shadow-inner'
              }`}
            >
              <span className="text-[9px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 font-bold leading-tight text-center min-w-0">
                <Flame className="w-3.5 h-3.5 text-emerald-500" /> Win Rate
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{winRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Action Tiles Grid (Tactile 3D Claymorphism & Color Pairings) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Create Custom Lobby - Vibrant Ruby Rose Theme */}
        <button
          onClick={() => {
            sound.playClick();
            onCreateLobby();
          }}
          className={`group p-5 rounded-3xl border-2 text-left transition-all duration-200 hover:-translate-y-1 active:translate-y-0.5 cursor-pointer flex flex-col justify-between ${
            isLight
              ? 'bg-white border-emerald-200 hover:border-emerald-400 shadow-sm hover:shadow-sm'
              : 'bg-[#1D0B2F] border-emerald-500/35 hover:border-emerald-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-13 h-13 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg text-white border-t border-white/30">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h3
              className={`text-lg font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              Create Private Lobby
            </h3>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1.5 transition-transform">
            <span>Create Room</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Card 2: Join via Room Code - Vibrant Azure Sky Theme */}
        <button
          onClick={() => {
            sound.playClick();
            setIsJoinModalOpen(true);
          }}
          className={`group p-5 rounded-3xl border-2 text-left transition-all duration-200 hover:-translate-y-1 active:translate-y-0.5 cursor-pointer flex flex-col justify-between ${
            isLight
              ? 'bg-white border-teal-200 hover:border-teal-400 shadow-sm hover:shadow-sm'
              : 'bg-[#1C0C2A] border-teal-500/35 hover:border-teal-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-13 h-13 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg text-white border-t border-white/30">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h3
              className={`text-lg font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              Join via Code
            </h3>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1.5 transition-transform">
            <span>Enter Room</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Featured Instant Match Card (Repositioned at Last Below Host & Join) */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 border transition-all duration-300 ${
          isLight
            ? 'bg-amber-100 border-2 border-amber-300/80 shadow-sm'
            : 'bg-[#2E2710] border-2 border-amber-500/40 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg relative bg-amber-500/20">
                <img
                  src={appPath("/assets/mikasa-mascot.jpg")}
                  alt="Mikasa Companion"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 text-sm">⚔️</span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start min-w-0 max-w-full">
                <span
                  className={`text-base font-black ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Instant Match Arena
                </span>
                </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onQuickPractice();
            }}
            className={`w-full sm:w-auto px-7 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
              isLight ? 'cta-button-light' : 'cta-button-dark'
            }`}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Instant Match</span>
          </button>
        </div>
      </div>

      {/* Secondary Row: Match Records & Features Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <button
          onClick={() => {
            sound.playClick();
            onOpenMatchHistory();
          }}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 ${
            isLight
              ? 'bg-amber-50 hover:bg-amber-100  border-amber-300/80 text-amber-900 shadow-sm'
              : 'bg-[#1A0D2A] hover:bg-[#231135]  border-emerald-500/30 text-emerald-200 shadow-sm'
          }`}
        >
          <History className="w-4 h-4 text-amber-500" />
          <span>View Match History &amp; Records</span>
        </button>
      </div>

      {/* Join Code Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm rounded-[24px] p-6 shadow-2xl flex flex-col gap-4 border ${
              isLight
                ? 'clay-card-light text-slate-900'
                : 'clay-card-dark text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-500" />
                <span>Join with Room Code</span>
              </h3>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter the 6-character room code shared by your friend:
            </p>

            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. MIKASA"
                className={`w-full px-4 py-3.5 rounded-2xl border text-center text-2xl font-mono font-bold tracking-widest uppercase focus:outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                    : 'bg-[#1C0F2A] border-white/15 text-white focus:border-teal-400 shadow-inner'
                }`}
              />

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinCodeInput.trim().length < 4}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500  disabled:opacity-50 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  Enter Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

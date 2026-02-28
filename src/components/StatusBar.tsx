'use client';

import { useAlert } from '@/context/AlertContext';
import { ALERT_TYPE_LABELS, getAlertLabel } from '@/lib/alertTypes';
import { useState, useRef, useEffect } from 'react';
import RegionFilter from './RegionFilter';

export default function StatusBar() {
    const { connectionStatus, lastPollTime, audioUnlocked, unlockAudio, currentAlert, isAlarming, severity, remainingShelterTime, selectedCities, latestNewsFlash } = useAlert();
    const [showFilter, setShowFilter] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    const connectionColor =
        connectionStatus === 'connected' ? 'bg-emerald-500' :
            connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500';

    const connectionLabel =
        connectionStatus === 'connected' ? 'Live' :
            connectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting...';

    const formattedTime = lastPollTime
        ? lastPollTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        : '––:––:––';

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showFilter && filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
                const dropdown = document.getElementById('region-dropdown');
                if (dropdown && !dropdown.contains(event.target as Node)) {
                    setShowFilter(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilter]);

    return (
        <header className={`relative flex items-center justify-between gap-4 px-6 py-3 border-b z-30 transition-all duration-500 ${isAlarming && severity === 'critical'
            ? 'border-red-500/50 bg-red-950/40'
            : 'border-white/10 bg-surface-900/80'
            } backdrop-blur-md`}>

            {/* Left: Logo */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M2 12 C2 12 6 6 12 6 S22 12 22 12 S18 18 12 18 S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-sm font-bold tracking-widest text-white uppercase font-mono">Silent Wave</h1>
                    <p className="text-[10px] text-white/40 font-mono tracking-tighter uppercase leading-none mt-0.5">גל שקט · לוח בקרה</p>
                </div>
            </div>

            {/* Center: Active Alert Badge */}
            <div className="flex-1 flex justify-center">
                {isAlarming && currentAlert ? (
                    <div className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl shadow-lg border transition-all duration-300 ${severity === 'critical' ? 'bg-red-600/90 text-white border-red-400/50' :
                        severity === 'warning' ? 'bg-amber-600/90 text-white border-amber-400/50' :
                            'bg-blue-600/90 text-white border-blue-400/50'
                        }`}>
                        <div className="flex items-center gap-2 text-sm font-bold animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                            {getAlertLabel(currentAlert)}
                        </div>
                        {remainingShelterTime !== null && (
                            <div className="flex items-center gap-1.5 text-[11px] font-mono font-black border-t border-white/20 mt-1 pt-1">
                                <span className="opacity-70">זמן התגוננות:</span>
                                <span className={`${remainingShelterTime <= 15 ? 'text-yellow-300 animate-bounce' : 'text-white'}`}>
                                    {Math.floor(remainingShelterTime / 60)}:{String(remainingShelterTime % 60).padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-950/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            שגרה
                        </div>
                        {latestNewsFlash && (
                            <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] text-blue-300 border border-blue-500/30 bg-blue-950/30 max-w-[20rem]">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                                <span className="truncate" title={latestNewsFlash.instructions}>
                                    <span className="font-bold opacity-80 pl-1">{getAlertLabel(latestNewsFlash)}</span>
                                    {latestNewsFlash.instructions}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Controls & Filter */}
            <div className="flex-1 flex justify-end items-center gap-3">
                {/* Active Filter Badge */}
                {selectedCities.length > 0 && (
                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold whitespace-nowrap">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 3H2l8 9v7l4 2v-9L22 3z" />
                        </svg>
                        <span>{selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} ערים`}</span>
                    </div>
                )}

                {/* Connection status */}
                <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${connectionColor} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] text-white/40 font-mono">{formattedTime}</span>
                </div>

                {/* Audio unlock */}
                {!audioUnlocked ? (
                    <button
                        onClick={unlockAudio}
                        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors whitespace-nowrap"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1l-8 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-10-4z" />
                        </svg>
                        <span className="hidden sm:inline">הפעל שמע</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                        <span className="hidden sm:inline">שמע פעיל</span>
                    </div>
                )}

                {/* Region filter */}
                <div className="relative">
                    <button
                        ref={filterButtonRef}
                        onClick={() => setShowFilter(!showFilter)}
                        className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all duration-400 ${showFilter
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        <span className="hidden sm:inline">בחירת אזור</span>
                    </button>

                    {showFilter && (
                        <RegionFilter onClose={() => setShowFilter(false)} />
                    )}
                </div>
            </div>
        </header>
    );
}

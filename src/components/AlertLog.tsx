'use client';

import { useAlert } from '@/context/AlertContext';
import { ALERT_TYPE_LABELS, getAlertLabel, getAlertSeverity } from '@/lib/alertTypes';

export default function AlertLog() {
    const { alertLog, currentAlert, isAlarming } = useAlert();

    return (
        <aside className="flex flex-col h-full border-l border-white/10 bg-black/30 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                <h2 className="text-xs font-bold tracking-widest uppercase text-white/60">יומן התרעות</h2>
                <span className="text-xs font-mono text-white/30">{alertLog.length} אירועים</span>
            </div>

            {/* Live active alert banner */}
            {isAlarming && currentAlert && (
                <div className={`mx-3 mt-3 rounded-lg p-3 border flex-shrink-0 ${getAlertSeverity(currentAlert.type) === 'critical'
                    ? 'bg-red-900/50 border-red-500/50'
                    : 'bg-amber-900/50 border-amber-500/50'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                            <span className="text-[10px] font-bold text-red-300 uppercase tracking-wide">פעיל עכשיו</span>
                        </div>
                        {useAlert().remainingShelterTime !== null && (
                            <div className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono font-bold text-white">
                                {Math.floor(useAlert().remainingShelterTime! / 60)}:{String(useAlert().remainingShelterTime! % 60).padStart(2, '0')}
                            </div>
                        )}
                    </div>
                    <p className="text-sm font-bold text-white leading-tight">{getAlertLabel(currentAlert)}</p>
                    {currentAlert.cities.length > 0 && (
                        <p className="text-[11px] text-white/70 mt-1.5 font-mono leading-snug" dir="rtl">
                            {currentAlert.cities.slice(0, 8).join(' · ')}
                            {currentAlert.cities.length > 8 && ` +${currentAlert.cities.length - 8}`}
                        </p>
                    )}
                    {currentAlert.instructions && (
                        <p className="text-[11px] text-white/40 mt-2 leading-relaxed border-t border-white/5 pt-2" dir="rtl">{currentAlert.instructions}</p>
                    )}
                </div>
            )}

            {/* Log list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {alertLog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20 px-4 text-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M18 8h1a4 4 0 010 8h-1" />
                            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                            <line x1="6" y1="1" x2="6" y2="4" />
                            <line x1="10" y1="1" x2="10" y2="4" />
                            <line x1="14" y1="1" x2="14" y2="4" />
                        </svg>
                        <p className="text-xs">לא הוקלטו התרעות<br />בסשן זה</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {alertLog.map((entry) => {
                            const sev = getAlertSeverity(entry.type);
                            const time = new Date(entry.receivedAt).toLocaleTimeString('he-IL', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                            });
                            return (
                                <div key={entry.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev === 'critical' ? 'bg-red-600/30 text-red-300' :
                                            sev === 'warning' ? 'bg-amber-600/30 text-amber-300' :
                                                sev === 'drill' ? 'bg-blue-600/30 text-blue-300' :
                                                    'bg-white/10 text-white/50'
                                            }`}>
                                            {getAlertLabel(entry)}
                                        </span>
                                        <span className="text-xs font-mono text-white/30">{time}</span>
                                    </div>
                                    {entry.cities.length > 0 && (
                                        <p className="text-xs text-white/60 leading-relaxed" dir="rtl">
                                            {entry.cities.slice(0, 5).join(', ')}
                                            {entry.cities.length > 5 && ` ו-${entry.cities.length - 5} נוספים`}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}

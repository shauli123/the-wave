'use client';

import dynamic from 'next/dynamic';
import StatusBar from './StatusBar';
import AlertLog from './AlertLog';
import NewsTicker from './NewsTicker';
import { useAlert } from '@/context/AlertContext';

// Dynamic import for Leaflet (SSR incompatible)
const AlertMap = dynamic(() => import('./AlertMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#0a0e1a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white/30">
                <div className="w-8 h-8 border-2 border-blue-500/50 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-xs tracking-widest uppercase">טוען מפה…</p>
            </div>
        </div>
    ),
});

export default function Dashboard() {
    const { isAlarming, severity } = useAlert();

    return (
        <div className={`flex flex-col h-screen w-screen overflow-hidden transition-all duration-500 ${isAlarming && severity === 'critical' ? 'alarm-active' : ''
            }`}>
            {/* Critical alarm flash overlay */}
            {isAlarming && severity === 'critical' && (
                <div className="fixed inset-0 pointer-events-none z-10 animate-alarm-flash" />
            )}

            {/* Status bar */}
            <StatusBar />

            {/* Main content */}
            <main className="flex flex-1 overflow-hidden">
                {/* Map area */}
                <div className="flex-1 relative overflow-hidden">
                    <AlertMap />
                </div>

                {/* Sidebar: Alert log */}
                <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden">
                    <AlertLog />
                </div>
            </main>

            {/* News ticker */}
            <NewsTicker />

            {/* News ticker */}
            <NewsTicker />
        </div>
    );
}

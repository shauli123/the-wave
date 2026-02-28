'use client';

import { useAlert } from '@/context/AlertContext';
import { useEffect, useState, useRef } from 'react';

// Comprehensive list of Israeli cities/regions from the HFC system
const ALL_CITIES = [
    'תל אביב - מרכז', 'תל אביב - מזרח', 'תל אביב - דרום', 'תל אביב - צפון',
    'ירושלים', 'חיפה - כרמל ועיר תחתית', 'חיפה - קריות', 'חיפה - נאות פרס',
    'באר שבע', 'אשדוד', 'אשקלון', 'נתניה', 'פתח תקוה', 'ראשון לציון',
    'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים',
    'כפר סבא', 'הרצליה', 'רעננה', 'נס ציונה', 'רחובות',
    'לוד', 'רמלה', 'מודיעין', 'מודיעין עילית',
    'עפולה', 'נצרת', 'כנרת',
    'שדרות', 'נתיבות', 'אופקים', 'יבנה', 'גדרה',
    'קריית גת', 'קריית מלאכי', 'אשקלון חוף', 'ניצן',
    'טבריה', 'צפת', 'עכו', 'נהריה', 'קריית שמונה',
    'מעלות-תרשיחא', 'שלומי', 'חצור הגלילית',
    'דימונה', 'אילת', 'ערד', 'מצפה רמון',
    'ראש העין', 'פתח תקוה - מזרח', 'אלעד',
    'עין גדי', 'רחביה', 'גבעת שמואל',
    'הר יבנה', 'מסכה', 'חוף הכרמל',
    'קריית אתא', 'פרדס חנה כרכור',
];

export default function RegionFilter({ onClose }: { onClose: () => void }) {
    const { selectedCities, setSelectedCities } = useAlert();
    const [search, setSearch] = useState('');
    const [draft, setDraft] = useState<string[]>(selectedCities);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync draft with context on open
    useEffect(() => {
        setDraft(selectedCities);
        // Auto-focus search input
        if (inputRef.current) {
            const timer = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [selectedCities]);

    const filtered = search.trim()
        ? ALL_CITIES.filter(c => c.includes(search.trim()))
        : ALL_CITIES;

    const toggle = (city: string) => {
        setDraft(prev =>
            prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
        );
    };

    const selectAll = () => setDraft([]);
    const apply = () => { setSelectedCities(draft); onClose(); };

    return (
        <div id="region-dropdown" className="absolute top-full mt-2 left-0 z-50 w-72 bg-[#0f1624]/95 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-bold text-white/90 uppercase tracking-widest">בחירת אזור</h2>
                    <span className="text-[10px] font-mono text-white/40">
                        {draft.length === 0 ? 'כל הארץ' : `${draft.length} אזורים`}
                    </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="חיפוש עיר…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        dir="rtl"
                        className="w-full pr-9 pl-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* City list */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin p-1 grid grid-cols-1 gap-0.5">
                {/* Monitor All Button */}
                <button
                    onClick={selectAll}
                    className={`text-right text-[11px] px-3 py-2 rounded-lg transition-all duration-200 mb-1 ${draft.length === 0
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-bold'
                        : 'text-white/40 border border-transparent hover:bg-white/5'
                        }`}
                >
                    📍 מעקב אחר כל הארץ
                </button>

                {filtered.map(city => (
                    <button
                        key={city}
                        onClick={() => toggle(city)}
                        dir="rtl"
                        className={`group flex items-center justify-between text-right text-[11px] px-3 py-2 rounded-lg transition-all duration-200 ${draft.includes(city)
                            ? 'bg-blue-600/15 text-blue-200 border border-blue-500/20'
                            : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                            }`}
                    >
                        <span>{city}</span>
                        {draft.includes(city) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-blue-400">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </button>
                ))}

                {filtered.length === 0 && (
                    <div className="py-8 text-center">
                        <p className="text-[10px] text-white/20 uppercase tracking-widest">לא נמצאו ערים</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-white/10 bg-black/20 flex gap-2">
                <button
                    onClick={onClose}
                    className="flex-1 py-2 rounded-lg text-[10px] font-bold text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/5 transition-all"
                >
                    ביטול
                </button>
                <button
                    onClick={apply}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] font-extrabold text-white shadow-[0_2px_10px_rgba(37,99,235,0.3)] transition-all"
                >
                    החל סינון
                </button>
            </div>
        </div>
    );
}

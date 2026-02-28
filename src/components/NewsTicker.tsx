'use client';

import { useAlert } from '@/context/AlertContext';
import { useEffect, useRef } from 'react';

export default function NewsTicker() {
    const { newsItems } = useAlert();
    const trackRef = useRef<HTMLDivElement>(null);

    // Duplicate items to create a seamless loop
    const items = newsItems.length > 0 ? newsItems : [
        { title: 'Connecting to Ynet news feed…', link: '', pubDate: '', description: '' }
    ];
    const doubled = [...items, ...items];

    // Pause on hover
    const pause = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'paused'; };
    const resume = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'running'; };

    // Reset animation when items change
    useEffect(() => {
        if (trackRef.current) {
            trackRef.current.style.animation = 'none';
            void trackRef.current.offsetHeight; // reflow
            trackRef.current.style.animation = '';
        }
    }, [newsItems.length]);

    return (
        <footer className="flex items-center gap-0 h-10 border-t border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden flex-shrink-0">
            {/* Scrolling track */}
            <div
                className="flex-1 overflow-hidden h-full flex items-center bg-black/40"
                onMouseEnter={pause}
                onMouseLeave={resume}
            >
                <div
                    ref={trackRef}
                    className="flex items-center gap-0 whitespace-nowrap animate-ticker"
                >
                    {doubled.map((item, i) => (
                        <span key={i} className="flex items-center">
                            {item.link ? (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-white/80 hover:text-white transition-colors px-8 font-bold tracking-tight"
                                    dir="rtl"
                                >
                                    <span className="text-blue-400 ml-2 font-mono text-[9px]">YNET •</span>
                                    {item.title}
                                </a>
                            ) : (
                                <span className="text-[11px] text-white/40 px-8 font-medium" dir="rtl">{item.title}</span>
                            )}
                            <span className="text-white/10 select-none text-[8px]">✦</span>
                        </span>
                    ))}
                </div>
            </div>
        </footer>
    );
}

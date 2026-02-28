'use client';

import { useAlert } from '@/context/AlertContext';
import { useEffect, useRef, useState } from 'react';

export default function NewsTicker() {
    const { newsItems } = useAlert();
    const trackRef = useRef<HTMLDivElement>(null);
    const [scrollingItems, setScrollingItems] = useState(newsItems);

    useEffect(() => {
        if (newsItems.length > 0) {
            setScrollingItems(newsItems);
        }
    }, [newsItems]);

    const items = scrollingItems.length > 0 ? scrollingItems : [
        { title: 'טוען פלאש חדשות YNET...', link: '', pubDate: '', description: '' }
    ];

    // Triple the items to ensure we always have enough to loop
    const tripled = [...items, ...items, ...items];

    // Speed calculation: ~15 seconds per item for a steady pace
    const duration = Math.max(items.length * 15, 40);

    // Pause on hover
    const pause = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'paused'; };
    const resume = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'running'; };

    return (
        <footer className="flex items-center gap-0 h-10 border-t border-white/10 bg-black/80 backdrop-blur-md overflow-hidden flex-shrink-0 z-20">
            <div
                className="flex-1 overflow-hidden h-full flex items-center bg-black/40"
                onMouseEnter={pause}
                onMouseLeave={resume}
                dir="ltr"
            >
                <div
                    ref={trackRef}
                    className="flex items-center gap-0 whitespace-nowrap h-full"
                    style={{
                        animation: `ticker-scroll-ltr ${duration}s linear infinite`,
                    }}
                >
                    {tripled.map((item, i) => (
                        <div key={i} className="flex items-center h-full">
                            {item.link ? (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-white/90 hover:text-white transition-colors px-16 font-bold tracking-tight h-full flex items-center border-r border-white/5"
                                    dir="rtl"
                                >
                                    <span className="text-blue-400 ml-3 font-mono text-[10px] whitespace-nowrap opacity-80">YNET •</span>
                                    {item.title}
                                </a>
                            ) : (
                                <span className="text-[11px] text-white/40 px-16 font-medium h-full flex items-center border-r border-white/5" dir="rtl">
                                    {item.title}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}

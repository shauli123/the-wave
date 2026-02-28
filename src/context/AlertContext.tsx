'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Alert, AlertLogEntry, NewsItem, getAlertSeverity, getShelterTime } from '@/lib/alertTypes';

interface AlertContextValue {
    currentAlert: Alert | null;
    alertLog: AlertLogEntry[];
    isAlarming: boolean;
    severity: 'critical' | 'warning' | 'drill' | 'none';
    newsItems: NewsItem[];
    selectedCities: string[];
    setSelectedCities: (cities: string[]) => void;
    audioUnlocked: boolean;
    unlockAudio: () => void;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    lastPollTime: Date | null;
    remainingShelterTime: number | null; // Seconds remaining to reach shelter
}

const AlertContext = createContext<AlertContextValue | null>(null);

const POLL_ALERTS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_ALERTS ?? 1500);
const POLL_NEWS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_NEWS ?? 30000);
const MAX_LOG_SIZE = 50;

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
    const [alertLog, setAlertLog] = useState<AlertLogEntry[]>([]);
    const [isAlarming, setIsAlarming] = useState(false);
    const [severity, setSeverity] = useState<'critical' | 'warning' | 'drill' | 'none'>('none');
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [selectedCities, setSelectedCitiesState] = useState<string[]>([]);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
    const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
    const [remainingShelterTime, setRemainingShelterTime] = useState<number | null>(null);

    // Refs for dedup logic — track the last alert "fingerprint"
    const lastAlertKey = useRef<string>('none::');
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sirenNodeRef = useRef<AudioBufferSourceNode | null>(null);

    // Load selected cities from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('silentwave_cities');
            if (saved) setSelectedCitiesState(JSON.parse(saved));
        } catch { }
    }, []);

    const setSelectedCities = useCallback((cities: string[]) => {
        setSelectedCitiesState(cities);
        try {
            localStorage.setItem('silentwave_cities', JSON.stringify(cities));
        } catch { }
    }, []);

    // Audio unlock
    const unlockAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        setAudioUnlocked(true);
    }, []);

    // Synthesize siren
    const playSiren = useCallback(() => {
        if (!audioCtxRef.current || !audioUnlocked) return;
        const ctx = audioCtxRef.current;

        if (sirenNodeRef.current) {
            try { sirenNodeRef.current.stop(); } catch { }
        }

        const duration = 3;
        const frameCount = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
            const t = i / ctx.sampleRate;
            const freq = 800 + 200 * Math.sin(2 * Math.PI * 1.5 * t);
            data[i] = 0.5 * Math.sin(2 * Math.PI * freq * t);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(ctx.destination);
        source.start();
        sirenNodeRef.current = source;
    }, [audioUnlocked]);

    const stopSiren = useCallback(() => {
        if (sirenNodeRef.current) {
            try { sirenNodeRef.current.stop(); } catch { }
            sirenNodeRef.current = null;
        }
    }, []);

    // Polling: alerts
    useEffect(() => {
        let mounted = true;

        const pollAlerts = async () => {
            try {
                const res = await fetch('/api/alerts');
                if (!res.ok) throw new Error('Network error');
                const alert: Alert = await res.json();

                if (!mounted) return;
                setConnectionStatus('connected');
                setLastPollTime(new Date());

                const alertKey = `${alert.type}::${[...alert.cities].sort().join(',')}`;
                const alertSev = getAlertSeverity(alert.type);

                if (alert.type !== 'none') {
                    const isRelevant =
                        selectedCities.length === 0 ||
                        alert.cities.some(c => selectedCities.includes(c));

                    if (isRelevant) {
                        if (alertKey !== lastAlertKey.current) {
                            lastAlertKey.current = alertKey;
                            const alertWithTime = {
                                ...alert,
                                receivedAt: new Date().toISOString()
                            };
                            setCurrentAlert(alertWithTime);
                            setSeverity(alertSev);
                            setIsAlarming(true);

                            const shelterTime = getShelterTime(alert.cities);
                            setRemainingShelterTime(shelterTime);

                            const logEntry: AlertLogEntry = {
                                ...alertWithTime,
                                id: `${Date.now()}-${Math.random()}`,
                                receivedAt: alertWithTime.receivedAt,
                            };
                            setAlertLog(prev => [logEntry, ...prev].slice(0, MAX_LOG_SIZE));

                            if (alertSev === 'critical') playSiren();
                        }
                    }
                } else {
                    if (lastAlertKey.current !== 'none::') {
                        lastAlertKey.current = 'none::';
                        setCurrentAlert(null);
                        setIsAlarming(false);
                        setSeverity('none');
                        setRemainingShelterTime(null);
                        stopSiren();
                    }
                }
            } catch {
                if (!mounted) return;
                setConnectionStatus('disconnected');
            }
        };

        pollAlerts();
        const timer = setInterval(pollAlerts, POLL_ALERTS);
        return () => { mounted = false; clearInterval(timer); };
    }, [selectedCities, audioUnlocked, playSiren, stopSiren]);

    // Polling: news
    useEffect(() => {
        let mounted = true;
        const pollNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (!res.ok) return;
                const items: NewsItem[] = await res.json();
                if (mounted) setNewsItems(items);
            } catch { }
        };
        pollNews();
        const timer = setInterval(pollNews, POLL_NEWS);
        return () => { mounted = false; clearInterval(timer); };
    }, []);

    // Shelter Countdown Timer
    useEffect(() => {
        if (isAlarming && remainingShelterTime !== null && remainingShelterTime > 0) {
            const timer = setInterval(() => {
                setRemainingShelterTime(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isAlarming, remainingShelterTime]);

    return (
        <AlertContext.Provider
            value={{
                currentAlert,
                alertLog,
                isAlarming,
                severity,
                newsItems,
                selectedCities,
                setSelectedCities,
                audioUnlocked,
                unlockAudio,
                connectionStatus,
                lastPollTime,
                remainingShelterTime,
            }}
        >
            {children}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error('useAlert must be used within AlertProvider');
    return ctx;
}

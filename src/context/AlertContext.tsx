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
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sirenNodeRef = useRef<AudioBufferSourceNode | null>(null);

    // Load selected cities from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('silentwave_cities');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('[AlertContext] Loaded selected cities:', parsed);
                setSelectedCitiesState(parsed);
            }
        } catch { }
    }, []);

    const setSelectedCities = useCallback((cities: string[]) => {
        console.log('[AlertContext] Setting selected cities:', cities);
        setSelectedCitiesState(cities);
        try {
            localStorage.setItem('silentwave_cities', JSON.stringify(cities));
        } catch { }
    }, []);

    // Load alert sound
    useEffect(() => {
        const loadSound = async () => {
            try {
                const response = await fetch('/alert.mp3');
                if (!response.ok) throw new Error('Failed to fetch alert.mp3');
                const arrayBuffer = await response.arrayBuffer();
                if (!audioCtxRef.current) {
                    audioCtxRef.current = new AudioContext();
                }
                const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
                audioBufferRef.current = audioBuffer;
                console.log('[AlertContext] Audio buffer loaded');
            } catch (err) {
                console.error('[AlertContext] Error loading sound:', err);
            }
        };
        loadSound();
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
        console.log('[AlertContext] Audio unlocked');
    }, []);

    // Play alert sound
    const playSiren = useCallback(() => {
        if (!audioCtxRef.current || !audioUnlocked || !audioBufferRef.current) return;
        const ctx = audioCtxRef.current;

        if (sirenNodeRef.current) {
            try { sirenNodeRef.current.stop(); } catch { }
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBufferRef.current;
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

    // Play notification sound
    const playNotification = useCallback(() => {
        if (!audioCtxRef.current || !audioUnlocked) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    }, [audioUnlocked]);

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
                const now = new Date();
                setLastPollTime(now);

                if (alert.type !== 'none') {
                    console.log('[AlertContext] Received alert:', alert.type, alert.cities);

                    const isRelevant =
                        selectedCities.length === 0 ||
                        alert.cities.some(c => selectedCities.includes(c));

                    console.log('[AlertContext] Selection relevance check:', {
                        selectedCities,
                        isRelevant
                    });

                    if (isRelevant) {
                        const alertKey = `${alert.type}::${[...alert.cities].sort().join(',')}`;
                        const alertSev = getAlertSeverity(alert.type);

                        const alertIssuedTime = new Date(alert.timestamp).getTime();
                        const elapsedSeconds = Math.floor((now.getTime() - alertIssuedTime) / 1000);
                        const totalShelterTime = getShelterTime(alert.cities);
                        const calculatedRemaining = Math.max(0, totalShelterTime - elapsedSeconds);

                        if (alertKey !== lastAlertKey.current) {
                            console.log('[AlertContext] New alert triggered!', alertKey);
                            lastAlertKey.current = alertKey;
                            const alertWithTime = { ...alert, receivedAt: now.toISOString() };
                            setCurrentAlert(alertWithTime);
                            setSeverity(alertSev);
                            setIsAlarming(true);
                            setRemainingShelterTime(calculatedRemaining);

                            const logEntry: AlertLogEntry = {
                                ...alertWithTime,
                                id: `${Date.now()}-${Math.random()}`,
                                receivedAt: alertWithTime.receivedAt,
                            };
                            setAlertLog(prev => [logEntry, ...prev].slice(0, MAX_LOG_SIZE));

                            if (alertSev === 'critical') playSiren();
                            else if (alertSev === 'warning') playNotification();
                        } else {
                            // Already alarming, just sync timer
                            setRemainingShelterTime(prev => {
                                if (prev === null) return calculatedRemaining;
                                if (Math.abs(prev - calculatedRemaining) > 2) return calculatedRemaining;
                                return prev;
                            });
                        }
                    } else {
                        // Alert exists but not for our cities
                        if (lastAlertKey.current !== 'none::' && currentAlert) {
                            console.log('[AlertContext] Alert no longer relevant for selected cities');
                            lastAlertKey.current = 'none::';
                            setCurrentAlert(null);
                            setIsAlarming(false);
                            setSeverity('none');
                            setRemainingShelterTime(null);
                            stopSiren();
                        }
                    }
                } else {
                    if (lastAlertKey.current !== 'none::') {
                        console.log('[AlertContext] Clearing alerts (server returned none)');
                        lastAlertKey.current = 'none::';
                        setCurrentAlert(null);
                        setIsAlarming(false);
                        setSeverity('none');
                        setRemainingShelterTime(null);
                        stopSiren();
                    }
                }
            } catch (err) {
                if (!mounted) return;
                console.error('[AlertContext] Poll error:', err);
                setConnectionStatus('disconnected');
            }
        };

        pollAlerts();
        const timer = setInterval(pollAlerts, POLL_ALERTS);
        return () => { mounted = false; clearInterval(timer); };
    }, [selectedCities, audioUnlocked, playSiren, stopSiren, playNotification, currentAlert]);

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

    // Shelter Countdown Timer (Client-side smooth decrement)
    useEffect(() => {
        if (!isAlarming || remainingShelterTime === null || remainingShelterTime <= 0) return;

        const interval = setInterval(() => {
            setRemainingShelterTime(prev => {
                if (prev === null || prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isAlarming, remainingShelterTime === 0]);

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

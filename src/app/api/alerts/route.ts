import { NextResponse } from 'next/server';
import { alertCache } from '@/lib/cache';
import { Alert } from '@/lib/alertTypes';

// Global mock alert state (also used by /api/mock-alert)
export let mockAlert: Alert | null = null;
export function setMockAlert(alert: Alert | null) {
    mockAlert = alert;
}

export async function GET() {
    // Check cache first
    const cached = alertCache.get<Alert>('current');
    if (cached !== undefined) {
        return NextResponse.json(cached);
    }

    // Use mock if enabled
    if (mockAlert) {
        alertCache.set('current', mockAlert);
        return NextResponse.json(mockAlert);
    }

    try {
        // Dynamic import so pikud-haoref-api only runs server-side
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pikudHaoref = require('pikud-haoref-api');

        const alert = await new Promise<Alert>((resolve, reject) => {
            const options: Record<string, string> = {};
            if (process.env.HFC_PROXY_URL) {
                options.proxy = process.env.HFC_PROXY_URL;
            }
            pikudHaoref.getActiveAlert((err: Error | null, alert: Alert) => {
                if (err) return reject(err);
                resolve({
                    type: alert?.type ?? 'none',
                    cities: alert?.cities ?? [],
                    instructions: alert?.instructions ?? '',
                    timestamp: new Date().toISOString(),
                });
            }, options);
        });

        alertCache.set('current', alert);
        return NextResponse.json(alert);
    } catch (error) {
        console.error('[/api/alerts] Error fetching alert:', error);
        const fallback: Alert = {
            type: 'none',
            cities: [],
            instructions: '',
            timestamp: new Date().toISOString(),
        };
        return NextResponse.json(fallback, { status: 200 });
    }
}

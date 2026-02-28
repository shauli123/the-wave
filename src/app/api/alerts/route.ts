import { NextResponse } from 'next/server';
import { alertCache } from '@/lib/cache';
import { Alert } from '@/lib/alertTypes';

// Exported for mock-alert/route.ts
export function setMockAlert(alert: Alert | null) {
    if (alert) {
        // Set mock with 1 hour TTL so it survives but doesn't stay forever
        alertCache.set('mock_alert', alert, 3600);
        console.log('[/api/alerts] Mock alert set:', alert.cities.join(', '));
    } else {
        alertCache.del('mock_alert');
        console.log('[/api/alerts] Mock alert cleared');
    }
}

export async function GET() {
    // 1. Check for manual mock override (from /api/mock-alert)
    const mock = alertCache.get<Alert>('mock_alert');
    if (mock) {
        if (mock.type === 'none') {
            alertCache.del('mock_alert');
        } else {
            console.log('[/api/alerts] Returning MOCK alert');
            return NextResponse.json(mock);
        }
    }

    // 2. Check general cache (TTL 1s as defined in cache.ts)
    const cached = alertCache.get<Alert>('current');
    if (cached !== undefined) {
        return NextResponse.json(cached);
    }

    try {
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
        return NextResponse.json(fallback);
    }
}

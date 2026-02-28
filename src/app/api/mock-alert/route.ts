import { NextRequest, NextResponse } from 'next/server';
import { Alert, AlertType } from '@/lib/alertTypes';
import { alertCache } from '@/lib/cache';

/**
 * Development-only mock alert endpoint.
 * Usage:
 *   GET /api/mock-alert?type=missiles&cities=נתניה&offset=15
 *   GET /api/mock-alert?type=none   (clears alert)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') ?? 'none') as AlertType;
    const citiesParam = searchParams.get('cities') ?? '';
    const cities = citiesParam ? citiesParam.split(',').map(c => c.trim()) : [];

    const instructionsParam = searchParams.get('instructions');

    // Optional offset in seconds (to simulate alerts from the past)
    const offset = Number(searchParams.get('offset') ?? 0);
    const issuedAt = new Date(Date.now() - (offset * 1000));

    const mockAlert: Alert = {
        type,
        cities,
        instructions: instructionsParam ?? (type === 'none' ? '' : 'היכנסו למבנה, נעלו את הדלתות וסגרו את הדלתות והחלונות'),
        timestamp: issuedAt.toISOString(),
    };

    // Update in-memory mock state and clear cache so next poll picks it up immediately
    if (type === 'none') {
        alertCache.del('mock_alert');
        console.log('[/api/mock-alert] Mock cleared');
    } else {
        // Set mock with a short TTL (60s) so it auto-expires and real alerts resume
        alertCache.set('mock_alert', mockAlert, 60);
        console.log('[/api/mock-alert] Mock set for', cities.join(', '));
    }

    // Deleting "current" ensures the next poll from /api/alerts checks for the mock
    alertCache.del('current');

    return NextResponse.json({
        success: true,
        mockAlert,
    });
}

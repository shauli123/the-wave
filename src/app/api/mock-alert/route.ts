import { NextRequest, NextResponse } from 'next/server';
import { Alert, AlertType } from '@/lib/alertTypes';
import { setMockAlert } from '../alerts/route';
import { alertCache } from '@/lib/cache';

/**
 * Development-only mock alert endpoint.
 * Usage:
 *   GET /api/mock-alert?type=missiles&cities=תל אביב - מזרח,חיפה
 *   GET /api/mock-alert?type=none   (clears alert)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') ?? 'none') as AlertType;
    const citiesParam = searchParams.get('cities') ?? '';
    const cities = citiesParam ? citiesParam.split(',').map(c => c.trim()) : [];

    const mockAlert: Alert = {
        type,
        cities,
        instructions: type === 'none' ? '' : 'היכנסו למבנה, נעלו את הדלתות וסגרו את החלונות',
        timestamp: new Date().toISOString(),
    };

    // Update in-memory mock state and clear cache so next poll picks it up
    setMockAlert(type === 'none' ? null : mockAlert);
    alertCache.del('current');

    return NextResponse.json({
        success: true,
        mockAlert,
    });
}

export type AlertType =
    | 'none'
    | 'missiles'
    | 'radiologicalEvent'
    | 'earthQuake'
    | 'tsunami'
    | 'hostileAircraftIntrusion'
    | 'hazardousMaterials'
    | 'terroristInfiltration'
    | 'newsFlash'
    | 'missilesDrill'
    | 'earthQuakeDrill'
    | 'radiologicalEventDrill'
    | 'tsunamiDrill'
    | 'hostileAircraftIntrusionDrill'
    | 'hazardousMaterialsDrill'
    | 'terroristInfiltrationDrill'
    | 'unknown';

export interface Alert {
    type: AlertType;
    cities: string[];
    instructions: string;
    timestamp: string;
    receivedAt?: string;
    title?: string;
}

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
}

export interface AlertLogEntry extends Alert {
    id: string;
    receivedAt: string;
}

/** Alert types that trigger siren + visual flash */
export const CRITICAL_ALERT_TYPES: AlertType[] = [
    'missiles',
    'hostileAircraftIntrusion',
    'radiologicalEvent',
    'tsunami',
    'terroristInfiltration',
];

/** Alert types that show visual notification only */
export const WARNING_ALERT_TYPES: AlertType[] = [
    'earthQuake',
    'hazardousMaterials',
    'newsFlash',
];

/** Drill types  */
export const DRILL_ALERT_TYPES: AlertType[] = [
    'missilesDrill',
    'earthQuakeDrill',
    'radiologicalEventDrill',
    'tsunamiDrill',
    'hostileAircraftIntrusionDrill',
    'hazardousMaterialsDrill',
    'terroristInfiltrationDrill',
];

export function getAlertSeverity(type: AlertType): 'critical' | 'warning' | 'drill' | 'none' {
    if (CRITICAL_ALERT_TYPES.includes(type)) return 'critical';
    if (WARNING_ALERT_TYPES.includes(type)) return 'warning';
    if (DRILL_ALERT_TYPES.includes(type)) return 'drill';
    return 'none';
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
    none: 'שגרה',
    missiles: '🚀 ירי רקטות וטילים',
    radiologicalEvent: '☢️ אירוע רדיולוגי',
    earthQuake: '🌍 רעידת אדמה',
    tsunami: '🌊 צונאמי',
    hostileAircraftIntrusion: '✈️ חדירת כלי טיס עוין',
    hazardousMaterials: '⚠️ אירוע חומרים מסוכנים',
    terroristInfiltration: '🔴 חדירת מחבלים',
    newsFlash: '📢 מבזק חדשות',
    missilesDrill: '🚀 תרגול ירי רקטות',
    earthQuakeDrill: '🌍 תרגול רעידת אדמה',
    radiologicalEventDrill: '☢️ תרגול אירוע רדיולוגי',
    tsunamiDrill: '🌊 תרגול צונאמי',
    hostileAircraftIntrusionDrill: '✈️ תרגול חדירת כלי טיס',
    hazardousMaterialsDrill: '⚠️ תרגול חומרים מסוכנים',
    terroristInfiltrationDrill: '🔴 תרגול חדירת מחבלים',
    unknown: '❓ התרעה לא ידועה',
};

export function getAlertLabel(alert: Alert): string {
    const baseLabel = ALERT_TYPE_LABELS[alert.type] || ALERT_TYPE_LABELS.unknown;

    // Specific logic for newsFlash (can be "Safe to leave shelter" or "Early Warning")
    if (alert.type === 'newsFlash') {
        if (alert.title) {
            return `📢 ${alert.title}`; // Prioritize the official title from Pikud Haoref
        }

        if (alert.instructions) {
            if (alert.instructions.includes('ניתן לצאת מהמרחב המוגן') ||
                alert.instructions.includes('סיום האירוע') ||
                alert.instructions.includes('חזרה לשגרה')) {
                return '✅ חזרה לשגרה / יציאה מהמרחב המוגן';
            }
            if (alert.instructions.includes('היכנסו למרחב מוגן') ||
                alert.instructions.includes('התרעה מוקדמת')) {
                return '📢 התרעה מוקדמת';
            }
        }
    }

    return baseLabel;
}

/**
 * Time to reach shelter (זמן התגוננות) in seconds for common cities.
 * Default is 90 seconds if not listed.
 */
export const SHELTER_TIMES: Record<string, number> = {
    'תל אביב - מרכז': 90,
    'תל אביב - מזרח': 90,
    'תל אביב - דרום': 90,
    'תל אביב - צפון': 90,
    'ירושלים': 90,
    'חיפה - כרמל ועיר תחתית': 60,
    'חיפה - קריות': 60,
    'חיפה - נאות פרס': 60,
    'באר שבע': 60,
    'אשדוד': 45,
    'אשקלון': 30,
    'נתניה': 90,
    'פתח תקוה': 90,
    'ראשון לציון': 90,
    'רמת גן': 90,
    'גבעתיים': 90,
    'בני ברק': 90,
    'חולון': 90,
    'בת ים': 90,
    'כפר סבא': 90,
    'הרצליה': 90,
    'רעננה': 90,
    'נס ציונה': 90,
    'רחובות': 90,
    'לוד': 90,
    'רמלה': 90,
    'מודיעין': 90,
    'מודיעין עילית': 90,
    'عפולה': 60,
    'נצרת': 60,
    'כנרת': 60,
    'שדרות': 15,
    'נתיבות': 30,
    'אופקים': 45,
    'יבנה': 60,
    'גדרה': 60,
    'קריית גת': 60,
    'קריית מלאכי': 60,
    'טבריה': 60,
    'צפת': 30,
    'עכו': 30,
    'נהריה': 15,
    'קריית שמונה': 0, // Immediate
    'קריית אתא': 60,
    'פרדס חנה כרכור': 90,
};

export function getShelterTime(cities: string[]): number {
    // Return the minimum time among all alerted cities
    const times = cities.map(city => SHELTER_TIMES[city] ?? 90);
    return Math.min(...times);
}

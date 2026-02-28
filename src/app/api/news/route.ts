import { NextResponse } from 'next/server';
import { newsCache } from '@/lib/cache';
import { NewsItem } from '@/lib/alertTypes';
import { XMLParser } from 'fast-xml-parser';

const RSS_URL = 'https://www.ynet.co.il/Integration/StoryRss1854.xml';

export async function GET() {
    // Check cache first
    const cached = newsCache.get<NewsItem[]>('ynet');
    if (cached !== undefined) {
        return NextResponse.json(cached);
    }

    try {
        const response = await fetch(RSS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SilentWave/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
            next: { revalidate: 30 },
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xml = await response.text();
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsed = parser.parse(xml);

        const items: NewsItem[] = (parsed?.rss?.channel?.item ?? [])
            .slice(0, 30)
            .map((item: Record<string, string>) => ({
                title: item.title ?? '',
                link: item.link ?? '',
                pubDate: item.pubDate ?? '',
                description: String(item.description ?? '').replace(/<[^>]+>/g, '').trim(),
            }));

        newsCache.set('ynet', items);
        return NextResponse.json(items);
    } catch (error) {
        console.error('[/api/news] Error fetching RSS:', error);
        return NextResponse.json([], { status: 200 });
    }
}

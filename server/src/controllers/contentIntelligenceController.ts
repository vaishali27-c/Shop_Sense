import type { Request, Response } from 'express';
import { ContentPageModel } from '../models/ContentPage';
import { seedDemoContent } from '../services/contentSeed';

function safeDiv(n: number, d: number) {
  if (!d || d === 0) return 0;
  return n / d;
}

export async function listPages(req: Request, res: Response): Promise<void> {
  const q = (req.query.q as string) || '';
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit ?? 20)));
  const sort = (req.query.sort as string) || '-gsc_impressions';

  const filter: any = {};
  if (q) filter.pageTitle = { $regex: q, $options: 'i' };

  const total = await ContentPageModel.countDocuments(filter);
  const docs = await ContentPageModel.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const items = docs.map((d: any) => {
    const ctr = safeDiv(d.gsc_clicks, d.gsc_impressions);
    const engagementRate = safeDiv(d.ga4_engaged_sessions, d.ga4_sessions);
    const scrollRate = safeDiv(d.scroll_events, d.ga4_pageviews);
    return { ...d, derived: { ctr, engagementRate, scrollRate } };
  });

  res.json({ total, page, limit, items });
}

export async function getPage(req: Request, res: Response): Promise<void> {
  const found = await ContentPageModel.findOne({ pageId: req.params.id }).lean();
  if (!found) {
    res.status(404).json({ message: 'Page not found' });
    return;
  }

  const ctr = safeDiv(found.gsc_clicks, found.gsc_impressions);
  const engagementRate = safeDiv(found.ga4_engaged_sessions, found.ga4_sessions);
  const scrollRate = safeDiv(found.scroll_events, found.ga4_pageviews);

  res.json({ ...found, derived: { ctr, engagementRate, scrollRate } });
}

export async function summary(req: Request, res: Response): Promise<void> {
  const docs = await ContentPageModel.find().lean();
  const pagesAnalyzed = docs.length;
  const totalImpressions = docs.reduce((s, d: any) => s + (d.gsc_impressions || 0), 0);
  const totalClicks = docs.reduce((s, d: any) => s + (d.gsc_clicks || 0), 0);
  const avgCtr = pagesAnalyzed === 0 ? 0 : docs.reduce((s, d: any) => s + safeDiv(d.gsc_clicks, d.gsc_impressions), 0) / pagesAnalyzed;
  const avgEngagement = pagesAnalyzed === 0 ? 0 : docs.reduce((s, d: any) => s + safeDiv(d.ga4_engaged_sessions, d.ga4_sessions), 0) / pagesAnalyzed;
  const avgPosition = pagesAnalyzed === 0 ? 0 : docs.reduce((s, d: any) => s + (d.gsc_avg_position || 0), 0) / pagesAnalyzed;

  res.json({ pagesAnalyzed, totalImpressions, totalClicks, averageCTR: avgCtr, averageEngagementRate: avgEngagement, averagePosition: avgPosition });
}

export async function seed(req: Request, res: Response): Promise<void> {
  try {
    const result = await seedDemoContent();
    res.json({ message: 'Seed completed', result });
  } catch (err) {
    console.error('[ContentIntelligence] Seed failed', err);
    res.status(500).json({ message: 'Seed failed' });
  }
}

export async function recalculate(_req: Request, res: Response): Promise<void> {
  // For now, derived metrics are computed on read. This endpoint returns the same summary.
  return summary(_req as any, res);
}

import { validateGoogleDateRange, type DateRange } from './googleDateRange';
import { runGa4Report } from './ga4Service';
import type { IGoogleConnection } from '../models/GoogleConnection';

type Connection = IGoogleConnection & { _id: import('mongoose').Types.ObjectId };
export type Ga4DashboardRows = Awaited<ReturnType<typeof runGa4Report>>;
export type Ga4DashboardSection = { rows: Ga4DashboardRows; error: string | null };

export type Ga4Dashboard = {
  property: string;
  dateRange: DateRange;
  overview: Ga4DashboardSection;
  traffic: Ga4DashboardSection;
  acquisition: Ga4DashboardSection;
  trafficAcquisition: Ga4DashboardSection;
  userAcquisition: Ga4DashboardSection;
  pages: Ga4DashboardSection;
  events: Ga4DashboardSection;
  keyEvents: Ga4DashboardSection;
  audience: Ga4DashboardSection;
  demographics: Ga4DashboardSection;
  technology: Ga4DashboardSection;
  geography: Ga4DashboardSection;
  landingPages: Ga4DashboardSection;
};

const overviewMetrics = ['activeUsers', 'newUsers', 'totalUsers', 'sessions', 'engagedSessions', 'engagementRate', 'screenPageViews', 'eventCount', 'keyEvents', 'totalRevenue', 'averageSessionDuration', 'bounceRate', 'userEngagementDuration', 'sessionsPerUser'];
const trendMetrics = ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'engagementRate', 'screenPageViews', 'eventCount', 'keyEvents', 'totalRevenue'];
const breakdownMetrics = ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'engagementRate', 'eventCount', 'keyEvents', 'totalRevenue'];

async function section(connection: Connection, property: string, range: DateRange, dimensions: string[], metrics: string[]): Promise<Ga4DashboardSection> {
  if (!metrics.length) return { rows: [], error: null };
  const results = await Promise.allSettled(Array.from({ length: Math.ceil(metrics.length / 10) }, (_, index) => runGa4Report(connection, property, range, dimensions, metrics.slice(index * 10, index * 10 + 10))));
  const rowsByDimension = new Map<string, Ga4DashboardRows[number]>();
  for (const result of results) if (result.status === 'fulfilled') for (const row of result.value) { const key = row.dimensions.join('\u0000'); const existing = rowsByDimension.get(key); rowsByDimension.set(key, existing ? { dimensions: existing.dimensions, metrics: { ...existing.metrics, ...row.metrics } } : row); }
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (!rowsByDimension.size && failures.length) return { rows: [], error: failures[0].reason instanceof Error ? failures[0].reason.message : 'GA4 report unavailable' };
  return { rows: [...rowsByDimension.values()], error: null };
}

export async function getGa4Dashboard(connection: Connection, property: string, range: DateRange): Promise<Ga4Dashboard> {
  validateGoogleDateRange(range);
  const specs: Array<[keyof Omit<Ga4Dashboard, 'property' | 'dateRange'>, string[], string[]]> = [
    ['overview', [], overviewMetrics],
    ['traffic', ['date'], trendMetrics],
    ['acquisition', ['sessionDefaultChannelGroup'], breakdownMetrics],
    ['trafficAcquisition', ['sessionSourceMedium'], breakdownMetrics],
    ['userAcquisition', ['firstUserSourceMedium'], breakdownMetrics],
    ['pages', ['pagePath', 'pageTitle'], breakdownMetrics.concat(['averageSessionDuration', 'screenPageViews'])],
    ['events', ['eventName'], ['eventCount', 'activeUsers', 'keyEvents', 'totalRevenue']],
    ['keyEvents', ['eventName'], ['keyEvents', 'activeUsers', 'totalRevenue']],
    ['audience', ['audienceName'], ['activeUsers', 'sessions', 'engagementRate']],
    ['demographics', ['country', 'region', 'city', 'language'], ['activeUsers', 'sessions', 'engagementRate', 'eventCount']],
    ['technology', ['browser', 'operatingSystem', 'deviceCategory', 'platform'], breakdownMetrics],
    ['geography', ['country', 'region', 'city'], breakdownMetrics],
    ['landingPages', ['landingPagePlusQueryString'], breakdownMetrics],
  ];
  const results = await Promise.all(specs.map(async ([name, dimensions, metrics]) => [name, await section(connection, property, range, dimensions, metrics)] as const));
  const dashboard = Object.fromEntries(results) as Omit<Ga4Dashboard, 'property' | 'dateRange'>;
  return { property: property.replace(/^properties\//, ''), dateRange: range, ...dashboard };
}
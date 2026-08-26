import { runGa4Report } from './ga4Service';
import { querySearchConsole } from './searchConsoleService';
import type { DateRange } from './googleDateRange';
import type { WebsiteScoreInput } from './mlScoreService';
import type { IGoogleConnection } from '../models/GoogleConnection';

type Connection = IGoogleConnection & { _id: import('mongoose').Types.ObjectId };
type Ga4Row = Awaited<ReturnType<typeof runGa4Report>>[number];

const UNKNOWN = 'Unknown';

// These signals are not exposed by the current GA4/GSC integrations. Keep the
// fallback explicit so a future Search Console/PageSpeed crawler can replace it.
const unavailableTechnicalSignals = {
  indexed_pages: 0,
  submitted_pages: 0,
  crawl_errors: 0,
  broken_links: 0,
  page_load_time_sec: 0,
  lcp_sec: 0,
  inp_ms: 0,
  cls: 0,
  core_web_vitals_pass_pct: 0,
  mobile_usability_score: 0,
  https_enabled: 0,
  sitemap_present: 0,
  robots_configured: 0,
  schema_coverage_pct: 0,
  pages_with_title_pct: 0,
  pages_with_meta_description_pct: 0,
  duplicate_content_pct: 0,
};

const fallbackFields = [
  'industry', 'website_type', 'page_type', 'indexed_pages', 'submitted_pages',
  'indexing_rate_pct', 'crawl_errors', 'broken_links', 'page_load_time_sec',
  'lcp_sec', 'inp_ms', 'cls', 'core_web_vitals_pass_pct', 'mobile_usability_score',
  'https_enabled', 'sitemap_present', 'robots_configured', 'schema_coverage_pct',
  'pages_with_title_pct', 'pages_with_meta_description_pct', 'duplicate_content_pct',
  'indexing_gap_pct', 'technical_seo_health', 'content_health', 'page_performance_health',
];

const websiteScoreFeatures = Object.keys({
  industry: '', website_type: '', page_type: '', country: '', device: '', traffic_source: '',
  active_users: 0, new_users: 0, sessions: 0, engaged_sessions: 0, engagement_rate_pct: 0,
  bounce_rate_pct: 0, avg_session_duration_sec: 0, sessions_per_user: 0, views: 0, events: 0,
  conversions: 0, conversion_rate_pct: 0, revenue: 0, search_impressions: 0, search_clicks: 0,
  search_ctr_pct: 0, avg_search_position: 0, indexed_pages: 0, submitted_pages: 0,
  indexing_rate_pct: 0, crawl_errors: 0, broken_links: 0, page_load_time_sec: 0, lcp_sec: 0,
  inp_ms: 0, cls: 0, core_web_vitals_pass_pct: 0, mobile_usability_score: 0, https_enabled: 0,
  sitemap_present: 0, robots_configured: 0, schema_coverage_pct: 0, pages_with_title_pct: 0,
  pages_with_meta_description_pct: 0, duplicate_content_pct: 0, ga4_score: 0, gsc_score: 0,
  overall_score: 0, engagement_quality: 0, conversion_efficiency: 0, seo_click_efficiency: 0,
  indexing_gap_pct: 0, technical_seo_health: 0, content_health: 0, page_performance_health: 0,
  search_visibility: 0, session_quality: 0, ga4_gsc_gap: 0, score_balance: 0,
});
const categoricalFeatures = ['industry', 'website_type', 'page_type', 'country', 'device', 'traffic_source'];

function value(row: Ga4Row | undefined, metric: string): number {
  return row?.metrics[metric] ?? 0;
}

function dominantDimension(rows: Ga4Row[], metric: string): string {
  return rows.reduce<Ga4Row | undefined>((best, row) => value(row, metric) > value(best, metric) ? row : best, undefined)?.dimensions[0] ?? UNKNOWN;
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

async function runGa4MetricBatches(
  connection: Connection,
  property: string,
  dateRange: DateRange,
  metrics: string[],
): Promise<Ga4Row[]> {
  const batches = Array.from(
    { length: Math.ceil(metrics.length / 10) },
    (_, index) => metrics.slice(index * 10, index * 10 + 10),
  );
  console.info(`[ML] GA4 aggregate metric batches=${batches.length} sizes=${batches.map((batch) => batch.length).join(',')}`);
  const responses = await Promise.all(
    batches.map((batch) => runGa4Report(connection, property, dateRange, [], batch)),
  );
  const mergedMetrics = Object.assign({}, ...responses.flatMap((rows) => rows.map((row) => row.metrics)));
  return [{ dimensions: [], metrics: mergedMetrics }];
}

export async function buildWebsiteScoreInput(
  connection: Connection,
  ga4Property: string,
  gscProperty: string,
  dateRange: DateRange,
): Promise<WebsiteScoreInput> {
  const [overviewRows, sourceRows, deviceRows, countryRows, searchRows] = await Promise.all([
    runGa4MetricBatches(connection, ga4Property, dateRange, [
      'activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'engagementRate',
      'bounceRate', 'averageSessionDuration', 'sessionsPerUser', 'screenPageViews',
      'eventCount', 'keyEvents', 'totalRevenue',
    ]),
    runGa4Report(connection, ga4Property, dateRange, ['sessionDefaultChannelGroup'], ['sessions']),
    runGa4Report(connection, ga4Property, dateRange, ['deviceCategory'], ['activeUsers']),
    runGa4Report(connection, ga4Property, dateRange, ['country'], ['activeUsers']),
    querySearchConsole(connection, gscProperty, dateRange, []),
  ]);

  const overview = overviewRows[0];
  const activeUsers = value(overview, 'activeUsers');
  const sessions = value(overview, 'sessions');
  const engagedSessions = value(overview, 'engagedSessions');
  const engagementRatePct = value(overview, 'engagementRate') * 100;
  const bounceRatePct = value(overview, 'bounceRate') * 100;
  const conversions = value(overview, 'keyEvents');
  const searchImpressions = searchRows.reduce((sum, row) => sum + row.impressions, 0);
  const searchClicks = searchRows.reduce((sum, row) => sum + row.clicks, 0);
  const searchCtrPct = percent(searchClicks, searchImpressions);
  const avgSearchPosition = searchRows.length ? searchRows.reduce((sum, row) => sum + row.position, 0) / searchRows.length : 0;

  // This mirrors the GA4 dashboard's existing engagement-weighted score.
  const ga4Score = Math.max(0, Math.min(100, Math.round(engagementRatePct * 0.7 + Math.min(30, activeUsers / 10))));
  const gscScore = Math.max(0, Math.min(100, Math.round(Math.min(70, searchCtrPct * 10) + Math.max(0, 30 - avgSearchPosition))));
  const overallScore = (ga4Score + gscScore) / 2;
  const indexingRatePct = 0;
  const input: WebsiteScoreInput = {
    industry: UNKNOWN,
    website_type: UNKNOWN,
    page_type: UNKNOWN,
    country: dominantDimension(countryRows, 'activeUsers'),
    device: dominantDimension(deviceRows, 'activeUsers'),
    traffic_source: dominantDimension(sourceRows, 'sessions'),
    active_users: activeUsers,
    new_users: value(overview, 'newUsers'),
    sessions,
    engaged_sessions: engagedSessions,
    engagement_rate_pct: engagementRatePct,
    bounce_rate_pct: bounceRatePct,
    avg_session_duration_sec: value(overview, 'averageSessionDuration'),
    sessions_per_user: value(overview, 'sessionsPerUser'),
    views: value(overview, 'screenPageViews'),
    events: value(overview, 'eventCount'),
    conversions,
    conversion_rate_pct: percent(conversions, sessions),
    revenue: value(overview, 'totalRevenue'),
    search_impressions: searchImpressions,
    search_clicks: searchClicks,
    search_ctr_pct: searchCtrPct,
    avg_search_position: avgSearchPosition,
    ...unavailableTechnicalSignals,
    indexing_rate_pct: indexingRatePct,
    ga4_score: ga4Score,
    gsc_score: gscScore,
    overall_score: overallScore,
    engagement_quality: percent(engagedSessions, sessions),
    conversion_efficiency: percent(conversions, sessions),
    seo_click_efficiency: searchCtrPct,
    indexing_gap_pct: 100 - indexingRatePct,
    technical_seo_health: 0,
    content_health: 0,
    page_performance_health: 0,
    search_visibility: searchCtrPct,
    session_quality: percent(engagedSessions, sessions),
    ga4_gsc_gap: Math.abs(ga4Score - gscScore),
    score_balance: overallScore,
  };
  const invalidFeatures = websiteScoreFeatures.filter((feature) => {
    const field = input[feature as keyof WebsiteScoreInput];
    if (field === null || field === undefined) return true;
    if (categoricalFeatures.includes(feature)) return typeof field !== 'string';
    return typeof field !== 'number' || !Number.isFinite(field);
  });
  if (invalidFeatures.length) throw new Error(`Incomplete ML input: ${invalidFeatures.join(', ')}`);
  console.info(`[ML] WebsiteScoreInput features=${websiteScoreFeatures.length} fallbackFields=${fallbackFields.length} ga4Score=${ga4Score} gscScore=${gscScore} overallScore=${overallScore} activeUsers=${activeUsers} sessions=${sessions} searchImpressions=${searchImpressions} searchClicks=${searchClicks}`);
  console.warn(`[ML] ML prediction contains fallback technical SEO fields: ${fallbackFields.join(', ')}`);
  return input;
}
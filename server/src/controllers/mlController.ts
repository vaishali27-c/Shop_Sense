import type { Request, Response } from 'express';
import { GoogleConnectionModel } from '../models/GoogleConnection';
import { resolveGoogleDateRange } from '../services/googleDateRange';
import { predictWebsiteScore } from '../services/mlScoreService';
import { buildWebsiteScoreInput } from '../services/websiteScoreInputService';

const websiteScoreFallbackFields = [
  'industry', 'website_type', 'page_type', 'indexed_pages', 'submitted_pages',
  'indexing_rate_pct', 'crawl_errors', 'broken_links', 'page_load_time_sec',
  'lcp_sec', 'inp_ms', 'cls', 'core_web_vitals_pass_pct', 'mobile_usability_score',
  'https_enabled', 'sitemap_present', 'robots_configured', 'schema_coverage_pct',
  'pages_with_title_pct', 'pages_with_meta_description_pct', 'duplicate_content_pct',
  'indexing_gap_pct', 'technical_seo_health', 'content_health', 'page_performance_health',
];

export async function testMlPrediction(
  _req: Request,
  res: Response,
) {
  try {
    const sampleInput = {
      industry: 'Education',
      website_type: 'SaaS',
      page_type: 'Homepage',
      country: 'India',
      device: 'Desktop',
      traffic_source: 'Organic Search',

      active_users: 272,
      new_users: 150,
      sessions: 300,
      engaged_sessions: 200,
      engagement_rate_pct: 66.67,
      bounce_rate_pct: 33.33,
      avg_session_duration_sec: 180,
      sessions_per_user: 1.1,
      views: 800,
      events: 1500,
      conversions: 20,
      conversion_rate_pct: 6.67,
      revenue: 5000,

      search_impressions: 5000,
      search_clicks: 250,
      search_ctr_pct: 5,
      avg_search_position: 12,

      indexed_pages: 80,
      submitted_pages: 100,
      indexing_rate_pct: 80,
      crawl_errors: 2,
      broken_links: 1,

      page_load_time_sec: 3,
      lcp_sec: 2.5,
      inp_ms: 180,
      cls: 0.1,
      core_web_vitals_pass_pct: 80,
      mobile_usability_score: 85,

      https_enabled: 1,
      sitemap_present: 1,
      robots_configured: 1,

      schema_coverage_pct: 70,
      pages_with_title_pct: 90,
      pages_with_meta_description_pct: 85,
      duplicate_content_pct: 5,

      ga4_score: 60,
      gsc_score: 65,
      overall_score: 62,

      engagement_quality: 180,
      conversion_efficiency: 6.67,
      seo_click_efficiency: 5,
      indexing_gap_pct: 20,
      technical_seo_health: 80,
      content_health: 82,
      page_performance_health: 78,
      search_visibility: 5,
      session_quality: 200,
      ga4_gsc_gap: 5,
      score_balance: 62,
    };

    const result = await predictWebsiteScore(sampleInput);

    res.json(result);
  } catch (error) {
    console.error('[ML] Prediction failed:', error);

    res.status(502).json({
      message:
        error instanceof Error
          ? error.message
          : 'ML service unavailable',
    });
  }
}

export async function getWebsiteScore(req: Request, res: Response) {
  try {
    const connection = await GoogleConnectionModel.findOne({ adminId: req.admin!.id });
    if (!connection || connection.status !== 'connected' || !connection.refreshTokenEncrypted) {
      return res.status(400).json({ message: 'Connect Google before requesting a website score.' });
    }
    if (!connection.selectedGa4Property) return res.status(400).json({ message: 'Select a GA4 property first.' });
    if (!connection.selectedGscProperty) return res.status(400).json({ message: 'Select a Search Console property first.' });

    const dateRange = resolveGoogleDateRange(req.query);
    const input = await buildWebsiteScoreInput(connection, connection.selectedGa4Property, connection.selectedGscProperty, dateRange);
    const generatedAt = new Date().toISOString();
    const result = await predictWebsiteScore(input);
    return res.json({
      ...result,
      dateRange,
      ga4_score: input.ga4_score,
      gsc_score: input.gsc_score,
      overall_score: input.overall_score,
      ga4_metrics: {
        active_users: input.active_users,
        sessions: input.sessions,
        engaged_sessions: input.engaged_sessions,
        engagement_rate_pct: input.engagement_rate_pct,
        bounce_rate_pct: input.bounce_rate_pct,
      },
      gsc_metrics: {
        search_ctr_pct: input.search_ctr_pct,
        search_impressions: input.search_impressions,
        search_clicks: input.search_clicks,
        avg_search_position: input.avg_search_position,
      },
      feature_count: 58,
      fallback_count: websiteScoreFallbackFields.length,
      fallback_fields: websiteScoreFallbackFields,
      generated_at: generatedAt,
      ga4Property: connection.selectedGa4Property,
      gscProperty: connection.selectedGscProperty,
    });
  } catch (error) {
    console.error('[ML] Website score failed:', error);
    const message = error instanceof Error ? error.message : 'Website score unavailable';
    if (message.startsWith('Invalid ')) return res.status(400).json({ message });
    return res.status(502).json({ message });
  }
}
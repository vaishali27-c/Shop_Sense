import test from 'node:test';
import assert from 'node:assert/strict';

import { predictWebsiteScore } from './mlScoreService';

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
} as const;

test('predictWebsiteScore falls back gracefully when the ML service is unavailable', async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:8000');
    };

    const result = await predictWebsiteScore(sampleInput as any);

    assert.equal(typeof result.current_score, 'number');
    assert.equal(typeof result.predicted_score, 'number');
    assert.equal(result.current_score, 62);
    assert.ok(result.predicted_score >= 0 && result.predicted_score <= 100);
    assert.ok(result.issue.length > 0);
  } finally {
    global.fetch = originalFetch;
  }
});

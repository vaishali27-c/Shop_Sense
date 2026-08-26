const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://127.0.0.1:8000';

export interface WebsiteScoreInput {
  industry: string;
  website_type: string;
  page_type: string;
  country: string;
  device: string;
  traffic_source: string;

  active_users: number;
  new_users: number;
  sessions: number;
  engaged_sessions: number;
  engagement_rate_pct: number;
  bounce_rate_pct: number;
  avg_session_duration_sec: number;
  sessions_per_user: number;
  views: number;
  events: number;
  conversions: number;
  conversion_rate_pct: number;
  revenue: number;

  search_impressions: number;
  search_clicks: number;
  search_ctr_pct: number;
  avg_search_position: number;

  indexed_pages: number;
  submitted_pages: number;
  indexing_rate_pct: number;
  crawl_errors: number;
  broken_links: number;

  page_load_time_sec: number;
  lcp_sec: number;
  inp_ms: number;
  cls: number;
  core_web_vitals_pass_pct: number;
  mobile_usability_score: number;

  https_enabled: number;
  sitemap_present: number;
  robots_configured: number;

  schema_coverage_pct: number;
  pages_with_title_pct: number;
  pages_with_meta_description_pct: number;
  duplicate_content_pct: number;

  ga4_score: number;
  gsc_score: number;
  overall_score: number;

  engagement_quality: number;
  conversion_efficiency: number;
  seo_click_efficiency: number;
  indexing_gap_pct: number;
  technical_seo_health: number;
  content_health: number;
  page_performance_health: number;
  search_visibility: number;
  session_quality: number;
  ga4_gsc_gap: number;
  score_balance: number;
}

export interface WebsiteScoreResult {
  current_score: number;
  predicted_score: number;
  issue: string;
  recommendation: string;
  priority: string;
}

export async function predictWebsiteScore(
  input: WebsiteScoreInput,
): Promise<WebsiteScoreResult> {
  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMessage = `ML service returned ${response.status}`;

    try {
      const errorBody = await response.json();

      if (typeof errorBody?.detail === 'string') {
        errorMessage = errorBody.detail;
      } else if (errorBody?.detail?.message) {
        errorMessage = errorBody.detail.message;
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as WebsiteScoreResult;
}
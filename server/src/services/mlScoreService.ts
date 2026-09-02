const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://127.0.0.1:8000';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function buildFallbackWebsiteScore(input: WebsiteScoreInput): WebsiteScoreResult {
  const currentScore = Number.isFinite(input.overall_score) ? input.overall_score : 50;
  const pageLoadPenalty = input.page_load_time_sec > 5 ? 12 : input.page_load_time_sec > 3 ? 6 : 0;
  const ctrPenalty = input.search_ctr_pct < 5 ? 8 : 0;
  const seoPenalty = input.technical_seo_health < 50 ? 10 : 0;
  const predictedScore = clampScore(currentScore - pageLoadPenalty - ctrPenalty - seoPenalty);

  let issue = 'No Major Issue';
  let recommendation = 'Continue monitoring website performance and SEO metrics.';
  let priority = 'Low';

  if (input.page_load_time_sec > 5) {
    issue = 'Slow Page Speed';
    recommendation = 'Optimize images, JavaScript, CSS, caching, and server response time.';
    priority = 'High';
  } else if (input.search_ctr_pct < 5) {
    issue = 'Low Search CTR';
    recommendation = 'Improve page titles and meta descriptions to increase search click-through rate.';
    priority = 'High';
  } else if (predictedScore < 50 || input.technical_seo_health < 50) {
    issue = 'Low Overall Performance';
    recommendation = 'Improve SEO, engagement, technical performance, and search visibility.';
    priority = 'High';
  }

  return {
    current_score: Number(currentScore.toFixed(2)),
    predicted_score: Number(predictedScore.toFixed(2)),
    issue,
    recommendation,
    priority,
  };
}

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
  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ML service error';
    const isUnavailable = /ECONNREFUSED|fetch failed|Failed to fetch|ML service returned/i.test(message);

    if (isUnavailable) {
      console.warn('[ML] Service unavailable; using local fallback prediction.', message);
      return buildFallbackWebsiteScore(input);
    }

    throw error;
  }
}
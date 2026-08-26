import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getWebsiteScore, type WebsiteScore } from '@/services/api';

function priorityTone(priority: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (priority === 'High') return 'danger';
  if (priority === 'Medium') return 'warning';
  if (priority === 'Low') return 'success';
  return 'neutral';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function metric(value: number, suffix = ''): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
}

function scoreValue(value: number): string {
  return `${metric(value)} / 100`;
}

function ScoreBar({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'brand' }) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{label}</span>
        <strong className="text-ink-800">{metric(value)}</strong>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full ${tone === 'brand' ? 'bg-brand-600' : 'bg-ink-500'}`} style={{ width }} />
      </div>
    </div>
  );
}

export function WebsiteScoreCard() {
  const [score, setScore] = useState<WebsiteScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setScore(await getWebsiteScore());
    } catch (err) {
      setScore(null);
      setError(err instanceof Error ? err.message : 'Unable to load website score.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadScore(); }, [loadScore]);
  const invalidScore = score !== null && (!Number.isFinite(score.current_score) || !Number.isFinite(score.predicted_score));

  return (
    <section className="card mt-6 p-5" aria-labelledby="website-score-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600" />
            <h2 id="website-score-title" className="text-base font-semibold text-ink-900">Website Performance Prediction</h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">Live prediction from your connected GA4 and Search Console properties.</p>
          <p className="mt-2 text-xs font-medium text-brand-700">Live data · GA4 + Search Console</p>
        </div>
        <button type="button" onClick={loadScore} disabled={loading} className="btn-outline inline-flex items-center gap-2">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Retry
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-ink-500">Loading website score...</p>}
      {!loading && error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && invalidScore && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">Website score data is incomplete. Please retry.</p>}
      {!loading && !error && score && !invalidScore && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-ink-500">Current Score <span className="text-ink-400">· Current</span></p><p className="mt-1 text-2xl font-bold text-ink-900">{scoreValue(score.current_score)}</p></div>
            <div><p className="text-xs text-ink-500">Predicted Next-Month Score</p><p className={`mt-1 text-2xl font-bold ${score.predicted_score >= score.current_score ? 'text-emerald-600' : 'text-red-600'}`}>{scoreValue(score.predicted_score)}</p><p className="text-xs text-ink-500">{score.predicted_score > score.current_score ? `↑ ${metric(score.predicted_score - score.current_score)} pts` : score.predicted_score < score.current_score ? `↓ ${metric(score.current_score - score.predicted_score)} pts` : 'No expected change'}</p></div>
            <div>
              <p className="text-xs text-ink-500">Expected Improvement</p>
              {score.predicted_score === score.current_score ? <p className="mt-1 text-sm font-semibold text-ink-700">No expected change</p> : <><p className={`mt-1 text-2xl font-bold ${score.predicted_score > score.current_score ? 'text-emerald-600' : 'text-red-600'}`}>{score.predicted_score > score.current_score ? '+' : ''}{metric(score.predicted_score - score.current_score)} pts</p><p className={`text-xs ${score.predicted_score > score.current_score ? 'text-emerald-600' : 'text-red-600'}`}>{score.current_score !== 0 ? `${score.predicted_score > score.current_score ? '+' : ''}${metric(((score.predicted_score - score.current_score) / score.current_score) * 100, '%')}` : '0%'}</p></>}
            </div>
            <div><p className="text-xs text-ink-500">Priority</p><div className="mt-2"><Badge tone={priorityTone(score.priority)}>{score.priority}</Badge></div></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ScoreBar label="Current" value={score.current_score} tone="neutral" />
            <ScoreBar label="Predicted" value={score.predicted_score} tone="brand" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-ink-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">AI Insight</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">{score.issue}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-500">Recommendation</p>
              <p className="mt-1 text-sm leading-6 text-ink-700">{score.recommendation}</p>
            </div>
            <div className="rounded-lg border border-ink-100 p-4">
              <p className="text-sm font-semibold text-ink-900">Key Measured Signals</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink-700">
                <span>Search CTR: <strong>{metric(score.gsc_metrics.search_ctr_pct, '%')}</strong></span>
                <span>Impressions: <strong>{metric(score.gsc_metrics.search_impressions)}</strong></span>
                <span>Clicks: <strong>{metric(score.gsc_metrics.search_clicks)}</strong></span>
                <span>Avg. Position: <strong>{metric(score.gsc_metrics.avg_search_position)}</strong></span>
                <span>Engagement: <strong>{metric(score.ga4_metrics.engagement_rate_pct, '%')}</strong></span>
                <span>Bounce Rate: <strong>{metric(score.ga4_metrics.bounce_rate_pct, '%')}</strong></span>
                <span>Sessions: <strong>{metric(score.ga4_metrics.sessions)}</strong></span>
                <span>Engaged Sessions: <strong>{metric(score.ga4_metrics.engaged_sessions)}</strong></span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1"><p className="text-xs text-ink-500">Score Breakdown</p><div className="mt-2 flex gap-3 text-sm"><span className="text-brand-700">GA4 <strong className="block text-lg text-ink-900">{scoreValue(score.ga4_score)}</strong></span><span className="text-sky-700">GSC <strong className="block text-lg text-ink-900">{scoreValue(score.gsc_score)}</strong></span><span className="text-ink-500">Overall <strong className="block text-lg text-ink-900">{scoreValue(score.overall_score)}</strong></span></div></div>
            <div><p className="text-xs text-ink-500">Data Coverage</p><p className="mt-1 text-sm text-ink-700">GA4 ✓ · Search Console ✓ · Technical SEO ⚠ Partial</p><p className="text-xs text-ink-500">{score.feature_count - score.fallback_count}/{score.feature_count} fields sourced</p></div>
            <div><p className="text-xs text-ink-500">Analysis Period</p><p className="mt-1 text-sm text-ink-700">{formatDate(score.dateRange.startDate)} – {formatDate(score.dateRange.endDate)}</p></div>
            <div><p className="text-xs text-ink-500">Last Updated</p><p className="mt-1 text-sm text-ink-700">{formatDateTime(score.generated_at)}</p></div>
          </div>
        </div>
      )}
    </section>
  );
}

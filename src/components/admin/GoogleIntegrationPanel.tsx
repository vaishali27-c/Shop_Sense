import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Unplug } from 'lucide-react';
import {
  disconnectGoogle,
  getGa4Properties,
  getGa4Report,
  getGoogleStatus,
  getGscPages,
  getGscProperties,
  getGscQueries,
  googleOAuthStartUrl,
  saveGoogleSelection,
  type GoogleReportRow,
  type GoogleStatus,
} from '@/services/api';

const dateOptions = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 28 Days', days: 28 },
  { label: 'Last 90 Days', days: 90 },
];

function percent(value: number) { return `${(value * 100).toFixed(2)}%`; }
function score(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

function InternalScore({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-lg border border-ink-100 bg-ink-50 p-4" title={detail}>
    <p className="text-xs font-medium text-ink-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-ink-900">{value}/100</p>
    <p className="mt-1 text-[11px] text-ink-500">Internal ShopSense score, not an official Google metric.</p>
  </div>;
}

function MetricTable({ title, rows, ga4 = false }: { title: string; rows: GoogleReportRow[]; ga4?: boolean }) {
  return <div className="mt-5 overflow-x-auto">
    <h3 className="mb-2 text-sm font-semibold text-ink-900">{title}</h3>
    <table className="w-full text-left text-xs">
      <thead className="border-b border-ink-100 text-ink-500"><tr>
        <th className="pb-2 font-medium">{ga4 ? 'Dimension' : title.includes('Page') ? 'Page' : 'Query'}</th>
        <th className="pb-2 font-medium">{ga4 ? 'Users' : 'Clicks'}</th><th className="pb-2 font-medium">{ga4 ? 'Sessions' : 'Impressions'}</th><th className="pb-2 font-medium">{ga4 ? 'Engagement' : 'CTR'}</th><th className="pb-2 font-medium">{ga4 ? 'Events' : 'Position'}</th>
      </tr></thead>
      <tbody className="divide-y divide-ink-100">{rows.slice(0, 10).map((row, index) => {
        const label = ga4 ? row.dimensions?.join(' / ') : row.keys?.[0];
        return <tr key={`${label}-${index}`}><td className="max-w-[260px] truncate py-2 text-ink-700">{label || '—'}</td>
          <td className="py-2">{ga4 ? row.metrics?.activeUsers ?? 0 : row.clicks ?? 0}</td>
          <td className="py-2">{ga4 ? row.metrics?.sessions ?? 0 : row.impressions ?? 0}</td>
          <td className="py-2">{ga4 ? percent(row.metrics?.engagementRate ?? 0) : percent(row.ctr ?? 0)}</td>
          <td className="py-2">{ga4 ? row.metrics?.eventCount ?? 0 : (row.position ?? 0).toFixed(1)}</td></tr>;
      })}</tbody>
    </table>
    {rows.length === 0 && <p className="py-5 text-center text-sm text-ink-500">Google returned no data for this date range.</p>}
  </div>;
}

function TrendChart({ title, rows, ga4, metric }: { title: string; rows: GoogleReportRow[]; ga4?: boolean; metric: string }) {
  const values = rows.slice(-14).map((row) => ga4 ? row.metrics?.[metric] ?? 0 : metric === 'ctr' ? (row.ctr ?? 0) * 100 : row[metric as 'clicks' | 'impressions' | 'position'] ?? 0);
  const maximum = Math.max(...values, 1);
  return <div className="mt-4 rounded-lg border border-ink-100 p-3"><p className="text-xs font-medium text-ink-600">{title}</p><div className="mt-3 flex h-24 items-end gap-1">{values.map((value, index) => <div key={`${value}-${index}`} className="group flex h-full flex-1 items-end" title={`${value.toFixed(2)}`}><div className="w-full rounded-t bg-brand-500 transition-opacity group-hover:opacity-70" style={{ height: `${Math.max(4, (value / maximum) * 100)}%` }} /></div>)}</div><div className="mt-1 flex justify-between text-[10px] text-ink-400"><span>{rows[0]?.keys?.[0] ?? rows[0]?.dimensions?.[0] ?? '—'}</span><span>{rows[rows.length - 1]?.keys?.[0] ?? rows[rows.length - 1]?.dimensions?.[0] ?? '—'}</span></div></div>;
}

export function GoogleIntegrationPanel() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [gscProperties, setGscProperties] = useState<Array<{ siteUrl: string; permissionLevel: string }>>([]);
  const [ga4Properties, setGa4Properties] = useState<Array<{ id: string; displayName: string; accountName: string }>>([]);
  const [gscPages, setGscPages] = useState<GoogleReportRow[]>([]);
  const [gscQueries, setGscQueries] = useState<GoogleReportRow[]>([]);
  const [ga4Rows, setGa4Rows] = useState<GoogleReportRow[]>([]);
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try { setStatus(await getGoogleStatus()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load Google status.'); }
  }, []);

  const loadProperties = useCallback(async () => {
    if (!status?.connected) return;
    try { const [gsc, ga4] = await Promise.all([getGscProperties(), getGa4Properties()]); setGscProperties(gsc); setGa4Properties(ga4); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load Google properties.'); }
  }, [status?.connected]);

  const refreshData = useCallback(async () => {
    if (!status?.connected) return;
    setLoading(true); setError(null);
    try {
      const [pages, queries, analytics] = await Promise.all([getGscPages({ days }), getGscQueries({ days }), getGa4Report({ days, dimensions: 'date', metrics: 'activeUsers,newUsers,sessions,engagementRate,averageSessionDuration,eventCount,conversions' })]);
      setGscPages(pages.rows); setGscQueries(queries.rows); setGa4Rows(analytics.rows);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to retrieve Google data.'); }
    finally { setLoading(false); }
  }, [days, status?.connected]);

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { loadProperties(); }, [loadProperties]);
  useEffect(() => { if (status?.selectedGscProperty && status.selectedGa4Property) refreshData(); }, [refreshData, status?.selectedGscProperty, status?.selectedGa4Property]);

  async function selectProperty(field: 'gscProperty' | 'ga4Property', value: string) {
    setError(null);
    try { await saveGoogleSelection({ [field]: value }); setStatus((current) => current ? { ...current, [field === 'gscProperty' ? 'selectedGscProperty' : 'selectedGa4Property']: value } : current); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save property.'); }
  }

  async function disconnect() { await disconnectGoogle(); setStatus({ connected: false, googleAccount: null, selectedGscProperty: null, selectedGa4Property: null, status: 'disconnected', lastError: null }); setGscProperties([]); setGa4Properties([]); setGscPages([]); setGscQueries([]); setGa4Rows([]); }

  const gscClicks = gscPages.reduce((sum, row) => sum + (row.clicks ?? 0), 0);
  const gscImpressions = gscPages.reduce((sum, row) => sum + (row.impressions ?? 0), 0);
  const gscCtr = gscImpressions ? gscClicks / gscImpressions : 0;
  const gscScore = score((gscCtr * 4000 * 0.4) + (Math.max(0, 100 - ((gscPages[0]?.position ?? 50) * 2)) * 0.6));
  const gaUsers = ga4Rows.reduce((sum, row) => sum + (row.metrics?.activeUsers ?? 0), 0);
  const gaSessions = ga4Rows.reduce((sum, row) => sum + (row.metrics?.sessions ?? 0), 0);
  const gaEngagement = gaSessions ? ga4Rows.reduce((sum, row) => sum + (row.metrics?.engagementRate ?? 0) * (row.metrics?.sessions ?? 0), 0) / gaSessions : 0;
  const gaScore = score(gaEngagement * 70 + Math.min(30, gaUsers / 10));

  return <section className="card mt-6 p-5" id="google-integration">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Google Integration</p><h2 className="mt-1 text-lg font-bold text-ink-900">Search Console + Analytics 4</h2><p className="mt-1 text-sm text-ink-500">Read-only data from the Google account you explicitly authorize.</p></div>
      {status?.connected ? <button onClick={disconnect} className="btn-outline inline-flex items-center gap-2"><Unplug size={15} /> Disconnect</button> : <a href={googleOAuthStartUrl} className="btn-primary inline-flex items-center gap-2"><ExternalLink size={15} /> Connect Google</a>}
    </div>
    {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {!status?.connected ? <p className="mt-6 rounded-lg border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">Connect Google to discover the Search Console properties and GA4 properties explicitly granted to that account.</p> : <>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><div><p className="text-xs text-ink-500">Connected Google Account</p><p className="font-medium text-ink-800">{status.googleAccount?.email ?? 'Connected'}</p></div><label className="text-xs text-ink-500">Search Console Property<select className="input mt-1 w-full text-sm" value={status.selectedGscProperty ?? ''} onChange={(e) => selectProperty('gscProperty', e.target.value)}><option value="">Select property</option>{gscProperties.map((property) => <option key={property.siteUrl} value={property.siteUrl}>{property.siteUrl}</option>)}</select>{gscProperties.length === 0 && <span className="mt-1 block text-xs text-amber-700">No Search Console properties are accessible to this Google account.</span>}</label><label className="text-xs text-ink-500">GA4 Property<select className="input mt-1 w-full text-sm" value={status.selectedGa4Property ?? ''} onChange={(e) => selectProperty('ga4Property', e.target.value)}><option value="">Select property</option>{ga4Properties.map((property) => <option key={property.id} value={property.id}>{property.displayName} ({property.id})</option>)}</select>{ga4Properties.length === 0 && <span className="mt-1 block text-xs text-amber-700">No GA4 properties are accessible to this Google account.</span>}</label></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><label className="text-sm text-ink-600">Date range<select className="input ml-2 py-1 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>{dateOptions.map((option) => <option key={option.days} value={option.days}>{option.label}</option>)}</select></label><button onClick={refreshData} disabled={loading || !status.selectedGscProperty || !status.selectedGa4Property} className="btn-outline inline-flex items-center gap-2"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Data</button></div>
      {(!status.selectedGscProperty || !status.selectedGa4Property) && <p className="mt-5 text-sm text-amber-700">Select both properties to retrieve reports. Available properties reflect the permissions granted by Google.</p>}
      {status.selectedGscProperty && status.selectedGa4Property && <div className="mt-6 grid gap-6 xl:grid-cols-2"><div><h3 className="text-base font-semibold text-ink-900">GSC Performance</h3><div className="mt-3 grid grid-cols-2 gap-3"><div className="card p-3"><p className="text-xs text-ink-500">Clicks</p><p className="text-xl font-bold">{gscClicks}</p></div><div className="card p-3"><p className="text-xs text-ink-500">Impressions</p><p className="text-xl font-bold">{gscImpressions}</p></div><div className="card p-3"><p className="text-xs text-ink-500">CTR</p><p className="text-xl font-bold">{percent(gscCtr)}</p></div><div className="card p-3"><p className="text-xs text-ink-500">Avg Position</p><p className="text-xl font-bold">{(gscPages[0]?.position ?? 0).toFixed(1)}</p></div></div><div className="mt-3"><InternalScore label="ShopSense GSC Performance Score" value={gscScore} detail="CTR contribution is weighted at 40 points and average position at 60 points, normalized to 0-100." /></div><div className="grid gap-3 sm:grid-cols-2"><TrendChart title="Clicks over time" rows={gscPages} metric="clicks" /><TrendChart title="Impressions over time" rows={gscPages} metric="impressions" /><TrendChart title="CTR over time" rows={gscPages} metric="ctr" /><TrendChart title="Average position over time" rows={gscPages} metric="position" /></div><MetricTable title="Top Pages" rows={gscPages} /><MetricTable title="Top Search Queries" rows={gscQueries} /></div><div><h3 className="text-base font-semibold text-ink-900">GA4 Performance</h3><div className="mt-3 grid grid-cols-2 gap-3"><div className="card p-3"><p className="text-xs text-ink-500">Active Users</p><p className="text-xl font-bold">{gaUsers}</p></div><div className="card p-3"><p className="text-xs text-ink-500">Sessions</p><p className="text-xl font-bold">{gaSessions}</p></div><div className="card p-3"><p className="text-xs text-ink-500">Engagement Rate</p><p className="text-xl font-bold">{percent(gaEngagement)}</p></div><div className="card p-3"><p className="text-xs text-ink-500">Events</p><p className="text-xl font-bold">{ga4Rows.reduce((sum, row) => sum + (row.metrics?.eventCount ?? 0), 0)}</p></div></div><div className="mt-3"><InternalScore label="ShopSense GA4 Performance Score" value={gaScore} detail="Engagement rate contributes 70 points and active users contribute up to 30 points, normalized to 0-100." /></div><div className="grid gap-3 sm:grid-cols-2"><TrendChart title="Users over time" rows={ga4Rows} ga4 metric="activeUsers" /><TrendChart title="Sessions over time" rows={ga4Rows} ga4 metric="sessions" /><TrendChart title="Engagement rate over time" rows={ga4Rows} ga4 metric="engagementRate" /><TrendChart title="Events over time" rows={ga4Rows} ga4 metric="eventCount" /></div><MetricTable title="Traffic by Date" rows={ga4Rows} ga4 /></div></div>}
    </>}
  </section>;
}

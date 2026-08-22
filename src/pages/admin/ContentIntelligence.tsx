import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getContentPages, getContentSummary, seedContent } from '@/services/api';
import { Link } from '@/lib/router';

export default function ContentIntelligence() {
  const [pages, setPages] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const s = await getContentSummary();
      setSummary(s);
      const p = (await getContentPages(q, 1, 50)) as any;
      setPages(p.items ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout title="Content Intelligence">
      <div className="mb-4 grid gap-4 sm:grid-cols-5">
        <div className="card p-4">
          <p className="text-sm text-ink-500">Pages Analyzed</p>
          <p className="mt-2 text-2xl font-bold">{summary?.pagesAnalyzed ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-ink-500">Total Impressions</p>
          <p className="mt-2 text-2xl font-bold">{summary?.totalImpressions ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-ink-500">Total Clicks</p>
          <p className="mt-2 text-2xl font-bold">{summary?.totalClicks ?? '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-ink-500">Average CTR</p>
          <p className="mt-2 text-2xl font-bold">{((summary?.averageCTR ?? 0) * 100).toFixed(2)}%</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-ink-500">Average Engagement Rate</p>
          <p className="mt-2 text-2xl font-bold">{((summary?.averageEngagementRate ?? 0) * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="text-sm text-ink-500">Demo Search Intelligence Dataset</div>
        <input placeholder="Search pages" value={q} onChange={(e) => setQ(e.target.value)} className="input" />
        <button onClick={load} className="btn-primary">Search</button>
        <button onClick={async () => { await seedContent(); load(); }} className="btn-outline">Seed Demo Data</button>
      </div>

      <div className="card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-ink-500">
              <tr className="border-b border-ink-100">
                <th className="pb-2 font-medium">Page</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Impr.</th>
                <th className="pb-2 font-medium">Clicks</th>
                <th className="pb-2 font-medium">CTR</th>
                <th className="pb-2 font-medium">Avg Pos</th>
                <th className="pb-2 font-medium">Pageviews</th>
                <th className="pb-2 font-medium">Sessions</th>
                <th className="pb-2 font-medium">Engagement</th>
                <th className="pb-2 font-medium">Scroll Rate</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {pages.map((p) => (
                <tr key={p.pageId}>
                  <td className="py-2.5 font-medium">{p.pageTitle}</td>
                  <td className="py-2.5">{p.pageType ?? '—'}</td>
                  <td className="py-2.5">{p.gsc_impressions}</td>
                  <td className="py-2.5">{p.gsc_clicks}</td>
                  <td className="py-2.5">{((p.derived?.ctr ?? 0) * 100).toFixed(2)}%</td>
                  <td className="py-2.5">{p.gsc_avg_position?.toFixed?.(2) ?? p.gsc_avg_position}</td>
                  <td className="py-2.5">{p.ga4_pageviews}</td>
                  <td className="py-2.5">{p.ga4_sessions}</td>
                  <td className="py-2.5">{((p.derived?.engagementRate ?? 0) * 100).toFixed(2)}%</td>
                  <td className="py-2.5">{((p.derived?.scrollRate ?? 0) * 100).toFixed(2)}%</td>
                  <td className="py-2.5"><Link to={`/admin/content-intelligence/${encodeURIComponent(p.pageId)}`} className="text-sm text-brand-700">View Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

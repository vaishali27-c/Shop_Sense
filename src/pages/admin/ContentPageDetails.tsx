import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getContentPage, getProduct } from '@/services/api';
import { useRouter } from '@/lib/router';

export default function ContentPageDetails({ id }: { id?: string }) {
  const { path } = useRouter();
  const pageId = id ?? decodeURIComponent(path.split('/').pop() ?? '');
  const [page, setPage] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const p = (await getContentPage(pageId)) as any;
        if (!cancelled) setPage(p);
        if (p?.productId) {
          try {
            const prod = await getProduct(p.productId);
            if (!cancelled) setProduct(prod);
          } catch {}
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pageId]);

  return (
    <AdminLayout title={page?.pageTitle ?? 'Content Page'}>
      {!page ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">{page.pageTitle}</h2>
            <p className="text-sm text-ink-500">Page ID: {page.pageId}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="mb-3 text-base font-semibold">Search Performance</h3>
              <div className="space-y-2 text-sm">
                <div>Impressions: {page.gsc_impressions}</div>
                <div>Clicks: {page.gsc_clicks}</div>
                <div>CTR: {((page.derived?.ctr ?? 0) * 100).toFixed(2)}%</div>
                <div>Avg Position: {page.gsc_avg_position}</div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="mb-3 text-base font-semibold">Engagement</h3>
              <div className="space-y-2 text-sm">
                <div>Pageviews: {page.ga4_pageviews}</div>
                <div>Sessions: {page.ga4_sessions}</div>
                <div>Users: {page.ga4_users}</div>
                <div>Engaged Sessions: {page.ga4_engaged_sessions}</div>
                <div>Engagement Rate: {((page.derived?.engagementRate ?? 0) * 100).toFixed(2)}%</div>
                <div>Scroll Events: {page.scroll_events}</div>
                <div>Scroll Rate: {((page.derived?.scrollRate ?? 0) * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>

            {product && (
              <div className="card p-6">
                <h3 className="mb-3 text-base font-semibold">Product Info</h3>
                <div className="space-y-2 text-sm">
                  <div>Name: {product.name}</div>
                  <div>Category: {product.category}</div>
                  <div>Price: ₹{product.price}</div>
                </div>
              </div>
            )}

          <div className="card p-6">
            <h3 className="mb-3 text-base font-semibold">Content Performance Summary</h3>
            <p className="text-sm text-ink-700">
              {page.derived?.ctr < 0.03
                ? 'Low click-through rate compared to impressions — consider improving meta title and description.'
                : 'CTR appears healthy.'}
            </p>
            <p className="mt-2 text-sm text-ink-700">
              {page.derived?.engagementRate < 0.2
                ? 'Engagement rate is below benchmark — content may need improvement.'
                : 'Engagement rate is within expected range.'}
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

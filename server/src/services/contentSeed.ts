import { ContentPageModel, IContentPage } from '../models/ContentPage';
import { fallbackProducts } from './fallbackData';

type PageDefinition = {
  pageId: string;
  pageTitle: string;
  pageType: NonNullable<IContentPage['pageType']>;
  productId?: string;
};

type MetricProfile = Omit<IContentPage, 'pageId' | 'pageTitle' | 'pageType' | 'productId'>;

const PRODUCT_PAGES: PageDefinition[] = [
  ['product-p1', 'Aurora Wireless Over-Ear Headphones', 'p1'],
  ['product-p2', 'Pulse True Wireless Earbuds', 'p2'],
  ['product-p9', 'Glide Wireless Mouse', 'p9'],
  ['product-p11', 'Stride Runner Sneakers', 'p11'],
  ['product-p24', 'Voyage Leather Backpack', 'p24'],
  ['product-p12', 'Classic Denim Jacket', 'p12'],
  ['product-p16', 'Trek Waterproof Hiking Boots', 'p16'],
  ['product-p18', 'Luna Ceramic Vase', 'p18'],
  ['product-p27', 'Bloom Silk Scarf', 'p27'],
  ['product-p23', 'The Modern Mind (Hardcover)', 'p23'],
  ['product-p21', 'Halo LED Desk Lamp', 'p21'],
  ['product-p4', 'TrailCam 4K Action Camera', 'p4'],
  ['product-p5', 'Nimbus 14 Ultrabook Laptop', 'p5'],
  ['product-p8', 'ChargeUp 20000mAh Power Bank', 'p8'],
  ['product-p7', 'Boom 20 Portable Bluetooth Speaker', 'p7'],
  ['product-p10', 'Tactile 75 Mechanical Keyboard', 'p10'],
].map(([pageId, pageTitle, productId]) => ({ pageId, pageTitle, pageType: 'PRODUCT', productId }));

const CATEGORY_PAGES: PageDefinition[] = [
  ['category-electronics', 'Electronics', 'CATEGORY'],
  ['category-fashion', 'Fashion', 'CATEGORY'],
  ['category-home', 'Home', 'CATEGORY'],
  ['category-books', 'Books', 'CATEGORY'],
  ['category-accessories', 'Accessories', 'CATEGORY'],
  ['category-laptops', 'Laptops', 'CATEGORY'],
  ['category-outdoor-gear', 'Outdoor Gear', 'CATEGORY'],
  ['category-study-essentials', 'Study Essentials', 'CATEGORY'],
].map(([pageId, pageTitle, pageType]) => ({ pageId, pageTitle, pageType: pageType as PageDefinition['pageType'] }));

const BUYING_GUIDES: PageDefinition[] = [
  ['guide-headphones-college', 'Best Headphones for College Students', 'BUYING_GUIDE'],
  ['guide-wireless-earbuds-under-3000', 'Wireless Earbuds Under ₹3000', 'BUYING_GUIDE'],
  ['guide-choose-wireless-mouse', 'How to Choose a Wireless Mouse', 'BUYING_GUIDE'],
  ['guide-running-shoes-daily-use', 'Best Running Shoes for Daily Use', 'BUYING_GUIDE'],
  ['guide-backpacks-college', 'Best Backpacks for College', 'BUYING_GUIDE'],
  ['guide-choose-laptop-bag', 'How to Choose a Laptop Bag', 'BUYING_GUIDE'],
  ['guide-home-decor-small-spaces', 'Best Home Decor for Small Spaces', 'BUYING_GUIDE'],
  ['guide-books-machine-learning-beginners', 'Best Books for Machine Learning Beginners', 'BUYING_GUIDE'],
  ['guide-home-office-accessories', 'Home Office Accessories Guide', 'BUYING_GUIDE'],
  ['guide-gifts-under-2000', 'Best Gifts Under ₹2000', 'BUYING_GUIDE'],
  ['guide-headphones', 'Headphones Buying Guide', 'BUYING_GUIDE'],
  ['guide-wireless-earbuds', 'Wireless Earbuds Buying Guide', 'BUYING_GUIDE'],
  ['guide-running-shoes', 'Running Shoes Buying Guide', 'BUYING_GUIDE'],
  ['guide-backpacks', 'Backpack Buying Guide', 'BUYING_GUIDE'],
  ['guide-home-decor', 'Home Decor Buying Guide', 'BUYING_GUIDE'],
  ['guide-tech-accessories-students', 'Best Tech Accessories for Students', 'BUYING_GUIDE'],
].map(([pageId, pageTitle, pageType]) => ({ pageId, pageTitle, pageType: pageType as PageDefinition['pageType'] }));

const PAGE_DEFINITIONS = [...PRODUCT_PAGES, ...CATEGORY_PAGES, ...BUYING_GUIDES];

type MetricSegment = {
  impressions: number;
  ctr: number;
  position: number;
  pageviewRate: number;
  sessionRate: number;
  userRate: number;
  engagedRate: number;
  scrollRate: number;
};

const METRIC_SEGMENTS: MetricSegment[] = [
  { impressions: 26000, ctr: 0.012, position: 8, pageviewRate: 0.09, sessionRate: 0.84, userRate: 0.86, engagedRate: 0.68, scrollRate: 0.72 },
  { impressions: 14500, ctr: 0.085, position: 4.8, pageviewRate: 0.34, sessionRate: 0.83, userRate: 0.88, engagedRate: 0.74, scrollRate: 0.79 },
  { impressions: 2100, ctr: 0.018, position: 38, pageviewRate: 0.18, sessionRate: 0.71, userRate: 0.9, engagedRate: 0.2, scrollRate: 0.31 },
  { impressions: 31000, ctr: 0.068, position: 5.6, pageviewRate: 0.38, sessionRate: 0.86, userRate: 0.87, engagedRate: 0.77, scrollRate: 0.84 },
  { impressions: 18500, ctr: 0.014, position: 22, pageviewRate: 0.16, sessionRate: 0.68, userRate: 0.89, engagedRate: 0.24, scrollRate: 0.35 },
  { impressions: 12800, ctr: 0.024, position: 15, pageviewRate: 0.22, sessionRate: 0.79, userRate: 0.88, engagedRate: 0.48, scrollRate: 0.61 },
  { impressions: 9800, ctr: 0.082, position: 6.4, pageviewRate: 0.41, sessionRate: 0.88, userRate: 0.86, engagedRate: 0.81, scrollRate: 0.87 },
  { impressions: 5200, ctr: 0.043, position: 19, pageviewRate: 0.27, sessionRate: 0.76, userRate: 0.91, engagedRate: 0.55, scrollRate: 0.64 },
  { impressions: 22500, ctr: 0.031, position: 12, pageviewRate: 0.2, sessionRate: 0.73, userRate: 0.85, engagedRate: 0.36, scrollRate: 0.49 },
  { impressions: 7600, ctr: 0.11, position: 3.8, pageviewRate: 0.46, sessionRate: 0.9, userRate: 0.89, engagedRate: 0.84, scrollRate: 0.91 },
];

function createMetrics(index: number): MetricProfile {
  const segment = METRIC_SEGMENTS[index % METRIC_SEGMENTS.length];
  const scale = 1 + (((index * 17) % 9) - 4) * 0.08;
  const ctr = Math.max(0.006, segment.ctr + (((index * 13) % 7) - 3) * 0.0035);
  const position = Math.max(1, segment.position + (((index * 19) % 9) - 4) * 0.7);
  const pageviewRate = segment.pageviewRate + (((index * 23) % 5) - 2) * 0.018;
  const sessionRate = Math.min(0.94, segment.sessionRate + (((index * 29) % 5) - 2) * 0.018);
  const userRate = Math.min(0.95, segment.userRate + (((index * 31) % 5) - 2) * 0.012);
  const engagedRate = Math.min(0.92, segment.engagedRate + (((index * 37) % 5) - 2) * 0.025);
  const scrollRate = Math.min(0.96, segment.scrollRate + (((index * 41) % 5) - 2) * 0.02);
  const impressions = Math.max(100, Math.round(segment.impressions * scale));
  const clicks = Math.min(impressions, Math.max(1, Math.round(impressions * ctr)));
  const pageviews = Math.max(1, Math.round(impressions * pageviewRate));
  const sessions = Math.max(1, Math.min(pageviews, Math.round(pageviews * sessionRate)));
  const users = Math.max(1, Math.min(sessions, Math.round(sessions * userRate)));
  const engaged = Math.max(1, Math.min(sessions, Math.round(sessions * engagedRate)));
  const scrolls = Math.max(1, Math.min(pageviews, Math.round(pageviews * scrollRate)));

  return {
    gsc_impressions: impressions,
    gsc_clicks: clicks,
    gsc_avg_position: Number(position.toFixed(2)),
    ga4_pageviews: pageviews,
    ga4_sessions: sessions,
    ga4_users: users,
    ga4_engaged_sessions: engaged,
    scroll_events: scrolls,
  };
}

function metricSignature(metrics: MetricProfile): string {
  return [
    metrics.gsc_impressions,
    metrics.gsc_clicks,
    metrics.gsc_avg_position,
    metrics.ga4_pageviews,
    metrics.ga4_sessions,
    metrics.ga4_users,
    metrics.ga4_engaged_sessions,
    metrics.scroll_events,
  ].join('|');
}

export async function seedDemoContent() {
  const productIds = new Set(fallbackProducts.map((product) => product.id));
  const invalidProduct = PRODUCT_PAGES.find((page) => !page.productId || !productIds.has(page.productId));
  if (invalidProduct) throw new Error(`Missing product for ${invalidProduct.pageId}`);

  const pages: IContentPage[] = PAGE_DEFINITIONS.map((definition, index) => ({
    ...definition,
    ...createMetrics(index),
  }));

  const signatures = pages.map(metricSignature);
  const uniqueProfiles = new Set(signatures).size;
  const duplicateProfiles = signatures.length - uniqueProfiles;
  if (uniqueProfiles !== pages.length) {
    throw new Error(`Duplicate metric profiles detected: ${duplicateProfiles}`);
  }

  for (const page of pages) {
    if (page.gsc_clicks > page.gsc_impressions
      || page.ga4_engaged_sessions > page.ga4_sessions
      || page.ga4_users > page.ga4_sessions
      || page.scroll_events > page.ga4_pageviews) {
      throw new Error(`Invalid metric constraints for ${page.pageId}`);
    }
  }

  const removed = await ContentPageModel.deleteMany({});
  await ContentPageModel.insertMany(pages);

  const total = await ContentPageModel.countDocuments();
  if (total !== 40) throw new Error(`Expected 40 ContentPage records, found ${total}`);

  console.log(`[Content Intelligence] Seeded ${pages.length} pages`);
  console.log(`[Content Intelligence] Unique metric profiles: ${uniqueProfiles}`);
  return { removed: removed.deletedCount ?? 0, seeded: pages.length, total, uniqueProfiles, duplicateProfiles };
}

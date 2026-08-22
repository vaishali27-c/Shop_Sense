import mongoose from 'mongoose';

export interface IContentPage {
  pageId: string;
  pageTitle: string;
  pageType?: 'PRODUCT' | 'CATEGORY' | 'BUYING_GUIDE';
  productId?: string;
  gsc_impressions: number;
  gsc_clicks: number;
  gsc_avg_position: number;
  ga4_pageviews: number;
  ga4_sessions: number;
  ga4_users: number;
  ga4_engaged_sessions: number;
  scroll_events: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ContentPageSchema = new mongoose.Schema<IContentPage>(
  {
    pageId: { type: String, required: true, unique: true, index: true },
    pageTitle: { type: String, required: true },
    pageType: { type: String, enum: ['PRODUCT', 'CATEGORY', 'BUYING_GUIDE'], default: 'PRODUCT' },
    productId: { type: String },
    gsc_impressions: { type: Number, default: 0 },
    gsc_clicks: { type: Number, default: 0 },
    gsc_avg_position: { type: Number, default: 0 },
    ga4_pageviews: { type: Number, default: 0 },
    ga4_sessions: { type: Number, default: 0 },
    ga4_users: { type: Number, default: 0 },
    ga4_engaged_sessions: { type: Number, default: 0 },
    scroll_events: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const ContentPageModel = mongoose.model<IContentPage>('ContentPage', ContentPageSchema);

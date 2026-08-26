import { google } from 'googleapis';
import { getAuthorizedClient, logGoogleApiError } from './googleOAuthService';
import { validateGoogleDateRange, type DateRange } from './googleDateRange';
import type { IGoogleConnection } from '../models/GoogleConnection';

function reportError(error: unknown): string {
  const typed = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
  return typed.response?.data?.error?.message ?? typed.message ?? 'GA4 report unavailable';
}

type Metadata = { dimensions: Set<string>; metrics: Set<string> };
const metadataCache = new Map<string, Promise<Metadata>>();

async function getMetadata(connection: IGoogleConnection & { _id: import('mongoose').Types.ObjectId }, propertyId: string): Promise<Metadata> {
  const normalizedPropertyId = propertyId.replace(/^properties\//, '');
  const cached = metadataCache.get(normalizedPropertyId);
  if (cached) return cached;
  const promise = (async () => {
    const client = await getAuthorizedClient(connection);
    const response = await google.analyticsdata({ version: 'v1beta', auth: client }).properties.getMetadata({ name: `properties/${normalizedPropertyId}/metadata` });
    console.log(`[ShopSense Google] GA4 metadata response status=${response.status} property=${normalizedPropertyId}`);
    return {
      dimensions: new Set((response.data.dimensions ?? []).map((item) => item.apiName).filter((name): name is string => Boolean(name))),
      metrics: new Set((response.data.metrics ?? []).map((item) => item.apiName).filter((name): name is string => Boolean(name))),
    };
  })().catch((error) => { metadataCache.delete(normalizedPropertyId); throw error; });
  metadataCache.set(normalizedPropertyId, promise);
  return promise;
}

export async function listGa4Properties(connection: IGoogleConnection & { _id: import('mongoose').Types.ObjectId }) {
  console.log(`[ShopSense Google] Analytics Admin accountSummaries.list started for account ${connection.googleEmail ?? 'unknown'}`);
  try {
    const client = await getAuthorizedClient(connection);
    const admin = google.analyticsadmin({ version: 'v1beta', auth: client });
    const properties: Array<{ id: string; displayName: string; accountName: string }> = [];
    let pageToken: string | undefined;
    do {
      const response = await admin.accountSummaries.list({ pageSize: 200, pageToken });
      for (const summary of response.data.accountSummaries ?? []) {
        for (const property of summary.propertySummaries ?? []) {
          const id = property.property?.replace('properties/', '');
          if (id) properties.push({ id, displayName: property.displayName ?? id, accountName: summary.displayName ?? summary.account ?? '' });
        }
      }
      console.log(`[ShopSense Google] Analytics Admin accountSummaries.list response status=${response.status} pageProperties=${(response.data.accountSummaries ?? []).reduce((count, summary) => count + (summary.propertySummaries?.length ?? 0), 0)}`);
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);
    console.log(`[ShopSense Google] Analytics Admin properties returned=${properties.length}`);
    return properties;
  } catch (error) {
    logGoogleApiError('Analytics Admin accountSummaries.list', error);
    throw error;
  }
}

export async function runGa4Report(connection: IGoogleConnection & { _id: import('mongoose').Types.ObjectId }, propertyId: string, range: DateRange, dimensions: string[], metrics: string[], limit = 250) {
  validateGoogleDateRange(range);
  if (metrics.length > 10) throw new Error('GA4 report supports at most 10 metrics per request');
  const normalizedPropertyId = propertyId.replace(/^properties\//, '');
  if (!/^\d+$/.test(normalizedPropertyId)) throw new Error('Invalid GA4 property');
  const metadata = await getMetadata(connection, normalizedPropertyId);
  const unavailableDimensions = dimensions.filter((name) => !metadata.dimensions.has(name));
  const unavailableMetrics = metrics.filter((name) => !metadata.metrics.has(name));
  const supportedDimensions = dimensions.filter((name) => metadata.dimensions.has(name));
  const supportedMetrics = metrics.filter((name) => metadata.metrics.has(name));
  if (unavailableDimensions.length || unavailableMetrics.length) console.warn(`[ShopSense Google] GA4 metadata excluded property=${normalizedPropertyId} dimensions=${unavailableDimensions.join(',') || 'none'} metrics=${unavailableMetrics.join(',') || 'none'}`);
  if (!supportedMetrics.length) throw new Error(`GA4 report unavailable: no requested metrics are supported by this property`);
  if (dimensions.length && !supportedDimensions.length) throw new Error(`GA4 report unavailable: requested dimensions are not supported by this property`);
  const client = await getAuthorizedClient(connection);
  console.log(`[ShopSense Google] GA4 report request property=${normalizedPropertyId} startDate=${range.startDate} endDate=${range.endDate} api=analyticsdata.properties.runReport`);
  try {
    const response = await google.analyticsdata({ version: 'v1beta', auth: client }).properties.runReport({ property: `properties/${normalizedPropertyId}`, requestBody: {
      dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
      dimensions: supportedDimensions.map((name) => ({ name })),
      metrics: supportedMetrics.map((name) => ({ name })),
      limit: String(Math.min(Math.max(limit, 1), 1000)),
    } });
    console.log(`[ShopSense Google] GA4 report response status=${response.status} rows=${response.data.rows?.length ?? 0}`);
    const metricHeaders = (response.data.metricHeaders ?? []).map((header) => header.name ?? '');
    return (response.data.rows ?? []).map((row) => ({
      dimensions: (row.dimensionValues ?? []).map((value) => value.value ?? ''),
      metrics: Object.fromEntries(metricHeaders.map((name, index) => [name, Number(row.metricValues?.[index]?.value ?? 0)])),
    }));
  } catch (error) {
    logGoogleApiError('Analytics Data properties.runReport', error);
    throw new Error(`GA4 report unavailable: ${reportError(error)}`);
  }
}

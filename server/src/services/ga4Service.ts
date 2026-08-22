import { google } from 'googleapis';
import { getAuthorizedClient, logGoogleApiError } from './googleOAuthService';
import type { DateRange } from './searchConsoleService';
import type { IGoogleConnection } from '../models/GoogleConnection';

function validateDateRange(range: DateRange): DateRange {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(range.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(range.endDate) || range.startDate > range.endDate) throw new Error('Invalid date range');
  return range;
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
  validateDateRange(range);
  if (!/^\d+$/.test(propertyId)) throw new Error('Invalid GA4 property');
  const client = await getAuthorizedClient(connection);
  const response = await google.analyticsdata({ version: 'v1beta', auth: client }).properties.runReport({ property: `properties/${propertyId}`, requestBody: {
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit: String(Math.min(Math.max(limit, 1), 1000)),
  } });
  const metricHeaders = (response.data.metricHeaders ?? []).map((header) => header.name ?? '');
  return (response.data.rows ?? []).map((row) => ({
    dimensions: (row.dimensionValues ?? []).map((value) => value.value ?? ''),
    metrics: Object.fromEntries(metricHeaders.map((name, index) => [name, Number(row.metricValues?.[index]?.value ?? 0)])),
  }));
}

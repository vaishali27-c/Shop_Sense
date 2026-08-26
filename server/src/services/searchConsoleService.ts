import { google } from 'googleapis';
import { getAuthorizedClient, logGoogleApiError } from './googleOAuthService';
import type { IGoogleConnection } from '../models/GoogleConnection';
import { validateGoogleDateRange, type DateRange } from './googleDateRange';

export async function listSearchConsoleProperties(connection: IGoogleConnection & { _id: import('mongoose').Types.ObjectId }) {
  console.log(`[ShopSense Google] Search Console sites.list started for account ${connection.googleEmail ?? 'unknown'}`);
  try {
    const client = await getAuthorizedClient(connection);
    const response = await google.searchconsole({ version: 'v1', auth: client }).sites.list();
    const properties = (response.data.siteEntry ?? []).map((site) => ({ siteUrl: site.siteUrl ?? '', permissionLevel: site.permissionLevel ?? '' }));
    console.log(`[ShopSense Google] Search Console sites.list response status=${response.status} properties=${properties.length}`);
    return properties;
  } catch (error) {
    logGoogleApiError('Search Console sites.list', error);
    throw error;
  }
}

export async function querySearchConsole(connection: IGoogleConnection & { _id: import('mongoose').Types.ObjectId }, property: string, range: DateRange, dimensions: string[], rowLimit = 250) {
  validateGoogleDateRange(range);
  if (!property) throw new Error('A Search Console property is required');
  const client = await getAuthorizedClient(connection);
  console.log(`[ShopSense Google] Search Console report request property=${property} startDate=${range.startDate} endDate=${range.endDate} api=searchanalytics.query`);
  try {
    const response = await google.searchconsole({ version: 'v1', auth: client }).searchanalytics.query({
      siteUrl: property,
      requestBody: { startDate: range.startDate, endDate: range.endDate, dimensions, rowLimit: Math.min(Math.max(rowLimit, 1), 1000), startRow: 0 },
    });
    console.log(`[ShopSense Google] Search Console report response status=${response.status} rows=${response.data.rows?.length ?? 0}`);
    return (response.data.rows ?? []).map((row) => ({ keys: row.keys ?? [], clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 }));
  } catch (error) {
    logGoogleApiError('Search Console searchanalytics.query', error);
    throw error;
  }
}

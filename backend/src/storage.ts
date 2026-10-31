/**
 * =============================================================================
 * File: storage.ts
 * Module: Document Storage & Cloud Asset Adapter
 * =============================================================================
 * Provides storage adapters for wedding agreements, floor plans, quotation PDFs, and vendor invoice receipts.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { ApiError } from './errors.js';

export interface DocumentStore {
  uploadUrl(path: string): Promise<{ signedUrl: string; path: string; token: string }>;
  read(path: string): Promise<{ bytes: Uint8Array; contentType: string }>;
  downloadUrl(path: string): Promise<string>;
}
/**
 * Fallback document store implementation when storage is unconfigured.
 */
export const unavailableStore: DocumentStore = {
  async uploadUrl() { throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Private document storage is not configured'); },
  async read() { throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Private document storage is not configured'); },
  async downloadUrl() { throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Private document storage is not configured'); },
};
/**
 * S3/Supabase cloud document storage provider for contracts, agreements, and invoice PDFs.
 */
export function supabaseDocuments(url: string, serviceKey: string, bucket: string): DocumentStore {
  const storage = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } }).storage.from(bucket);
  return {
    async uploadUrl(path) {
      const { data, error } = await storage.createSignedUploadUrl(path, { upsert: false });
      if (error || !data) throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Unable to authorize document upload');
      return data;
    },
    async read(path) {
      const { data, error } = await storage.download(path);
      if (error || !data) throw new ApiError(409, 'DOCUMENT_NOT_UPLOADED', 'The uploaded object is unavailable');
      if (data.size > 10485760) throw new ApiError(400, 'INVALID_DOCUMENT', 'Document exceeds the allowed size');
      return { bytes: new Uint8Array(await data.arrayBuffer()), contentType: data.type };
    },
    async downloadUrl(path) {
      const { data, error } = await storage.createSignedUrl(path, 60);
      if (error || !data) throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Unable to authorize document download');
      return data.signedUrl;
    },
  };
}

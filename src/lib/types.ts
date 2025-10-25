import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  source_domain: string;
  source_url: string;
  source_product_id: string;
  title: string;
  normalized_title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  image_hashes: string[];
  seller: {
    name?: string;
    rating?: number;
  };
  reviews_count?: number;
  trust_score: number;
  trend_score: number;
  category_name?: string;
  category_slug?: string;
  listing_status: 'draft' | 'enriched' | 'approved' | 'published' | 'rejected' | 'removed' | 'failed_enrichment' | 'failed_publish';
  provenance_raw_key: string;
  shopify_product_id?: string;
  enriched_fields?: {
    seo_title?: string;
    seo_description?: string;
    social_captions?: { [key: string]: string };
  };
  rejection_reason?: string;
  halal_status?: 'compliant' | 'non-compliant' | 'indeterminate';
  halal_reasoning?: string;
  error_message?: string;
  created_at: Timestamp | Date;
  updated_at: Timestamp | Date;
  enriched_at?: Timestamp | Date;
  published_at?: Timestamp | Date;
}

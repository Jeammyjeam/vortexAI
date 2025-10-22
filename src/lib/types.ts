
export type ProductStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  viralVelocity: number;
  status: ProductStatus;
  imageUrl: string;
  imageHint: string;
  isHalalCompliant: boolean | null;
  complianceReasoning: string | null;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  } | null;
}

export type SocialPostStatus = 'queued' | 'posted' | 'failed';

export interface SocialPost {
    id: string;
    productId: string;
    productName: string;
    platform: 'X' | 'Instagram' | 'TikTok';
    post: string;
    scheduledAt: string; // ISO 8601 datetime string
    status: SocialPostStatus;
}

export interface AppConfig {
  id: 'default'; // Singleton config document
  automationIntensity: 'manual' | 'semi-auto' | 'full-auto';
  haramFilterEnabled: boolean;
  dataSources: ('shopify' | 'x' | 'tiktok')[];
}

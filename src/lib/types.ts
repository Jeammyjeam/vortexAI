export interface ProductListing {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  sourceMarketplace: string;
  extractedDate: any; // Using `any` for Firestore Timestamps
  category: string;
  halalStatus: 'compliant' | 'non-compliant' | 'indeterminate';
  halalReasoning: string;
}

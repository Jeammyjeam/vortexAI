
import { doc, updateDoc, Firestore } from 'firebase/firestore';
import { filterHaramProducts } from '@/ai/flows/filter-haram-products';
import { generateProductDescriptions } from '@/ai/flows/generate-product-descriptions';
import type { Product } from './types';

export async function enrichProduct(firestore: Firestore, product: Product) {
  // Step 1: Halal Compliance Check
  const complianceResult = await filterHaramProducts({
    productDescription: `${product.name} - ${product.category} - ${product.imageHint}`,
  });

  const productRef = doc(firestore, 'products', product.id);

  if (!complianceResult.isHalalCompliant) {
    const complianceUpdate: Partial<Product> = {
      status: 'rejected',
      isHalalCompliant: false,
      complianceReasoning: complianceResult.reasoning,
    };
    await updateDoc(productRef, complianceUpdate);
    // Throw an error to indicate failure, which can be caught by the caller
    throw new Error(`Product rejected due to compliance: ${complianceResult.reasoning}`);
  }

  // Step 2: Proceed with content generation if compliant
  const result = await generateProductDescriptions({
    title: product.name,
    category: product.category,
    keywords: product.imageHint, // Using image hint as a starting point
    targetAudience: 'Online shoppers, tech enthusiasts', // Example target audience
  });
  
  const updatedProductData: Partial<Product> = {
    seo: {
      title: result.seoTitle,
      description: result.metaDescription,
      keywords: result.rankedKeywords.split(',').map(k => k.trim()),
    },
    name: result.seoTitle, // Also update the main product name for consistency
    isHalalCompliant: true,
    complianceReasoning: complianceResult.reasoning,
  };

  await updateDoc(productRef, updatedProductData);
  
  return updatedProductData;
}

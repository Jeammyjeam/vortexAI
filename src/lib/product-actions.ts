
import { doc, updateDoc, Firestore } from 'firebase/firestore';
import { filterHaramProducts } from '@/ai/flows/filter-haram-products';
import { generateProductDescriptions } from '@/ai/flows/generate-product-descriptions';
import type { Product } from './types';

interface EnrichOptions {
  haramFilterEnabled: boolean;
}

export async function enrichProduct(firestore: Firestore, product: Product, options: EnrichOptions) {
  const productRef = doc(firestore, 'products', product.id);

  try {
    let isHalalCompliant = true;
    let complianceReasoning = 'Compliance check was disabled.';

    // Step 1: Halal Compliance Check (if enabled)
    if (options.haramFilterEnabled) {
      const complianceResult = await filterHaramProducts({
        productDescription: `${product.name} - ${product.category} - ${product.imageHint}`,
      });

      isHalalCompliant = complianceResult.isHalalCompliant;
      complianceReasoning = complianceResult.reasoning;

      if (!isHalalCompliant) {
        const complianceUpdate: Partial<Product> = {
          status: 'rejected',
          isHalalCompliant: false,
          complianceReasoning: complianceReasoning,
        };
        await updateDoc(productRef, complianceUpdate);
        throw new Error(`Product rejected due to compliance: ${complianceReasoning}`);
      }
    }

    // Step 2: Proceed with content generation
    const result = await generateProductDescriptions({
      title: product.name,
      category: product.category,
      keywords: product.imageHint,
      targetAudience: 'Online shoppers, tech enthusiasts',
    });
    
    const updatedProductData: Partial<Product> = {
      seo: {
        title: result.seoTitle,
        description: result.metaDescription,
        keywords: result.rankedKeywords.split(',').map(k => k.trim()),
      },
      name: result.seoTitle,
      isHalalCompliant: isHalalCompliant,
      complianceReasoning: complianceReasoning,
    };

    await updateDoc(productRef, updatedProductData);
    
    return updatedProductData;

  } catch (error) {
    console.error(`[VORTEX AI] Enrichment process for ${product.id} failed:`, error);
    throw error;
  }
}

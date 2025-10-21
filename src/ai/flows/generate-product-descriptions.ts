'use server';

/**
 * @fileOverview A product description generation AI agent.
 *
 * - generateProductDescriptions - A function that handles the product description generation process.
 * - GenerateProductDescriptionsInput - The input type for the generateProductDescriptions function.
 * - GenerateProductDescriptionsOutput - The return type for the generateProductDescriptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionsInputSchema = z.object({
  title: z.string().describe('The title of the product.'),
  category: z.string().describe('The category of the product.'),
  keywords: z.string().describe('Keywords related to the product.'),
  targetAudience: z.string().describe('The target audience for the product.'),
  existingDescription: z
    .string()
    .optional()
    .describe('An existing product description to improve.'),
});
export type GenerateProductDescriptionsInput = z.infer<
  typeof GenerateProductDescriptionsInputSchema
>;

const GenerateProductDescriptionsOutputSchema = z.object({
  seoTitle: z.string().describe('An SEO-friendly title for the product.'),
  metaDescription: z
    .string()
    .describe('An SEO-friendly meta description for the product.'),
  caption: z.string().describe('A compelling caption for the product.'),
  rankedKeywords: z.string().describe('Keywords ranked for discoverability.'),
});

export type GenerateProductDescriptionsOutput = z.infer<
  typeof GenerateProductDescriptionsOutputSchema
>;

export async function generateProductDescriptions(
  input: GenerateProductDescriptionsInput
): Promise<GenerateProductDescriptionsOutput> {
  return generateProductDescriptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionsPrompt',
  input: {schema: GenerateProductDescriptionsInputSchema},
  output: {schema: GenerateProductDescriptionsOutputSchema},
  prompt: `You are an AI expert in generating compelling and SEO-friendly product descriptions.

  Given the following product information, generate an SEO title, meta description, caption, and ranked keywords.

  Title: {{{title}}}
  Category: {{{category}}}
  Keywords: {{{keywords}}}
  Target Audience: {{{targetAudience}}}
  Existing Description: {{{existingDescription}}}

  SEO Title: (Concise and keyword-rich)
  Meta Description: (Engaging summary for search engines)
  Caption: (Emotionally appealing and attention-grabbing)
  Ranked Keywords: (Prioritized for discoverability)
  `,
});

const generateProductDescriptionsFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionsFlow',
    inputSchema: GenerateProductDescriptionsInputSchema,
    outputSchema: GenerateProductDescriptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

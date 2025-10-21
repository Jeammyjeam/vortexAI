'use server';

/**
 * @fileOverview A flow to filter out products that are not Halal-compliant.
 *
 * - filterHaramProducts - A function that filters products based on Halal compliance.
 * - FilterHaramProductsInput - The input type for the filterHaramProducts function.
 * - FilterHaramProductsOutput - The return type for the filterHaramProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterHaramProductsInputSchema = z.object({
  productDescription: z
    .string()
    .describe('The description of the product to be evaluated.'),
});
export type FilterHaramProductsInput = z.infer<typeof FilterHaramProductsInputSchema>;

const FilterHaramProductsOutputSchema = z.object({
  isHalalCompliant: z
    .boolean()
    .describe(
      'Whether the product is Halal-compliant (true) or not (false).' + 
      'If uncertain, default to false.'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the Halal compliance determination.'),
});
export type FilterHaramProductsOutput = z.infer<typeof FilterHaramProductsOutputSchema>;

export async function filterHaramProducts(
  input: FilterHaramProductsInput
): Promise<FilterHaramProductsOutput> {
  return filterHaramProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterHaramProductsPrompt',
  input: {schema: FilterHaramProductsInputSchema},
  output: {schema: FilterHaramProductsOutputSchema},
  prompt: `You are an expert in Islamic Sharia law. Your task is to determine whether a product is Halal-compliant based on its description.

  Respond FALSE unless you are certain of compliance, erring on the side of caution.

  Analyze the following product description:
  {{{productDescription}}}

  Provide your determination and reasoning in the following JSON format:
  {
    "isHalalCompliant": boolean, // true or false
    "reasoning": string // Explanation for your determination
  }`,
});

const filterHaramProductsFlow = ai.defineFlow(
  {
    name: 'filterHaramProductsFlow',
    inputSchema: FilterHaramProductsInputSchema,
    outputSchema: FilterHaramProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

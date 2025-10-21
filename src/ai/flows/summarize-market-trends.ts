'use server';

/**
 * @fileOverview Summarizes market trends and engagement heatmaps to identify trending products and maximize digital impact.
 *
 * - summarizeMarketTrends - A function that summarizes market trends.
 * - SummarizeMarketTrendsInput - The input type for the summarizeMarketTrends function.
 * - SummarizeMarketTrendsOutput - The return type for the summarizeMarketTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMarketTrendsInputSchema = z.object({
  marketData: z.string().describe('Market data including engagement heatmaps and product trends.'),
});
export type SummarizeMarketTrendsInput = z.infer<typeof SummarizeMarketTrendsInputSchema>;

const SummarizeMarketTrendsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the market trends and engagement heatmaps.'),
  trendingProducts: z.string().describe('List of trending products identified from the market data.'),
  insights: z.string().describe('Insights on how to maximize digital impact based on the trends.'),
});
export type SummarizeMarketTrendsOutput = z.infer<typeof SummarizeMarketTrendsOutputSchema>;

export async function summarizeMarketTrends(input: SummarizeMarketTrendsInput): Promise<SummarizeMarketTrendsOutput> {
  return summarizeMarketTrendsFlow(input);
}

const summarizeMarketTrendsPrompt = ai.definePrompt({
  name: 'summarizeMarketTrendsPrompt',
  input: {schema: SummarizeMarketTrendsInputSchema},
  output: {schema: SummarizeMarketTrendsOutputSchema},
  prompt: `You are an expert in market analysis and digital marketing.

  Analyze the following market data and provide a concise summary of the trends, identify trending products, and provide insights on how to maximize digital impact.

  Market Data: {{{marketData}}}

  Respond in the following format:
  Summary: [concise summary of market trends]
  Trending Products: [list of trending products]
  Insights: [insights on maximizing digital impact]`,
});

const summarizeMarketTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeMarketTrendsFlow',
    inputSchema: SummarizeMarketTrendsInputSchema,
    outputSchema: SummarizeMarketTrendsOutputSchema,
  },
  async input => {
    const {output} = await summarizeMarketTrendsPrompt(input);
    return output!;
  }
);

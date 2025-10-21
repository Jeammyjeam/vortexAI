'use server';

/**
 * @fileOverview Automatically schedules and deploys posts to social media platforms.
 *
 * - autoSchedulePosts - A function to schedule and deploy social media posts.
 * - AutoSchedulePostsInput - The input type for the autoSchedulePosts function.
 * - AutoSchedulePostsOutput - The return type for the autoSchedulePosts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoSchedulePostsInputSchema = z.object({
  productName: z.string().describe('The name of the product to promote.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  targetPlatforms: z.array(z.enum(['X', 'Instagram', 'TikTok'])).describe('The social media platforms to post to.'),
  engagementAnalytics: z.string().optional().describe('Engagement analytics data to determine optimal posting times.'),
  imageTemplate: z.string().optional().describe('URL or data URI for an image template to use in the posts.'),
});

export type AutoSchedulePostsInput = z.infer<typeof AutoSchedulePostsInputSchema>;

const AutoSchedulePostsOutputSchema = z.object({
  scheduledPosts: z.array(
    z.object({
      platform: z.enum(['X', 'Instagram', 'TikTok']),
      postContent: z.string(),
      scheduledTime: z.string().datetime(),
      status: z.string(),
    })
  ).describe('A list of scheduled posts with their content, time, and status.'),
});

export type AutoSchedulePostsOutput = z.infer<typeof AutoSchedulePostsOutputSchema>;

export async function autoSchedulePosts(input: AutoSchedulePostsInput): Promise<AutoSchedulePostsOutput> {
  return autoSchedulePostsFlow(input);
}

const generatePostContentPrompt = ai.definePrompt({
  name: 'generatePostContentPrompt',
  input: { schema: AutoSchedulePostsInputSchema },
  output: { schema: AutoSchedulePostsOutputSchema },
  prompt: `You are a social media marketing expert.  Given the following product and target platforms, generate engaging social media posts including captions and hashtags.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Target Platforms: {{#each targetPlatforms}}{{{this}}} {{/each}}

Return a JSON array of scheduled posts, each containing the platform, post content, and a suggested scheduled time.  The scheduled time should be a valid ISO 8601 datetime string.

Consider engagement analytics and create sentiment-tuned captions and appropriate hashtags for maximum impact.
Engagement Analytics: {{{engagementAnalytics}}}
Image Template: {{media url=imageTemplate}}`,
});

const autoSchedulePostsFlow = ai.defineFlow(
  {
    name: 'autoSchedulePostsFlow',
    inputSchema: AutoSchedulePostsInputSchema,
    outputSchema: AutoSchedulePostsOutputSchema,
  },
  async input => {
    const { output } = await generatePostContentPrompt(input);
    return output!;
  }
);

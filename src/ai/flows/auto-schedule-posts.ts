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
import { SocialPost } from '@/lib/types';

const AutoSchedulePostsInputSchema = z.object({
  productId: z.string().describe('The ID of the product to promote.'),
  productName: z.string().describe('The name of the product to promote.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  targetPlatforms: z.array(z.enum(['X', 'Instagram', 'TikTok'])).describe('The social media platforms to post to.'),
  engagementAnalytics: z.string().optional().describe('JSON string representing engagement analytics data (e.g., a heatmap of user activity by hour) to determine optimal posting times.'),
});

export type AutoSchedulePostsInput = z.infer<typeof AutoSchedulePostsInputSchema>;

const ScheduledPostSchema = z.object({
  productId: z.string().describe('The ID of the product this post is for.'),
  productName: z.string().describe('The name of the product this post is for.'),
  platform: z.enum(['X', 'Instagram', 'TikTok']),
  post: z.string().describe('The generated content of the social media post, tailored to the specific platform.'),
  scheduledAt: z.string().datetime().describe('The optimal time to publish the post, in ISO 8601 format.'),
  status: z.enum(['queued', 'posted', 'failed']).describe('The status of the scheduled post.')
});

const AutoSchedulePostsOutputSchema = z.object({
  scheduledPosts: z.array(ScheduledPostSchema).describe('A list of scheduled posts with their content and time.'),
});


export type AutoSchedulePostsOutput = z.infer<typeof AutoSchedulePostsOutputSchema>;

export async function autoSchedulePosts(input: AutoSchedulePostsInput): Promise<AutoSchedulePostsOutput> {
  return autoSchedulePostsFlow(input);
}

const generatePostContentPrompt = ai.definePrompt({
  name: 'generatePostContentPrompt',
  input: { schema: AutoSchedulePostsInputSchema },
  output: { schema: AutoSchedulePostsOutputSchema },
  prompt: `You are a social media marketing expert. Your task is to generate compelling and platform-appropriate posts for a given product.

You need to create one post for EACH of the following target platforms: {{{json targetPlatforms}}}.
For each post, you must set the 'status' to 'queued' and include the 'productId': '{{{productId}}}'.

Each post must include:
1.  A strong, attention-grabbing hook tailored to the platform's audience.
2.  The product name: {{{productName}}}.
3.  A clear call-to-action (e.g., "Shop now," "Learn more," "Link in bio").
4.  Relevant and trending hashtags for each platform.
5.  An affiliate link placeholder: [AFFILIATE_LINK].

Product Description: {{{productDescription}}}

Analyze the provided engagement analytics to determine the absolute best time to post for maximum impact within the next 24 hours. The scheduledAt time MUST be a valid ISO 8601 datetime string in the future.

Engagement Analytics (user engagement by hour):
{{{engagementAnalytics}}}

Generate one post for each platform listed in targetPlatforms. Ensure the content is unique and optimized for the specific platform (e.g., concise and witty for X, visually-driven and story-focused for Instagram, short and punchy for TikTok).
`,
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

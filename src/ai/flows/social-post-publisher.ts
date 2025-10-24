'use server';

/**
 * @fileoverview A flow to publish scheduled social media posts.
 * - publishSocialPosts - A function that fetches due posts and "publishes" them.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';
import type { SocialPost } from '@/lib/types';

// This function will initialize the admin SDK only when it's first needed.
const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('[VORTEX AI] Initializing Firebase Admin with Service Account...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  // This fallback is for environments like Google Cloud Run/Functions
  // where ADC are automatically available.
  console.log('[VORTEX AI] Initializing Firebase Admin with Application Default Credentials...');
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
};


const PublishSocialPostsOutputSchema = z.object({
  publishedPosts: z.array(z.string()).describe("A list of IDs of the posts that were published."),
  checkedCount: z.number().describe("The total number of queued posts that were checked."),
});
export type PublishSocialPostsOutput = z.infer<typeof PublishSocialPostsOutputSchema>;

export async function publishSocialPosts(): Promise<PublishSocialPostsOutput> {
  return publishSocialPostsFlow();
}

const publishSocialPostsFlow = ai.defineFlow(
  {
    name: 'publishSocialPostsFlow',
    outputSchema: PublishSocialPostsOutputSchema,
  },
  async () => {
    console.log('[VORTEX AI] Running social post publisher flow...');
    
    // Initialize admin app and get firestore instance inside the flow
    initializeAdminApp();
    const db = admin.firestore();

    const now = new Date();
    const queuedPostsQuery = db.collection('social_posts')
      .where('status', '==', 'queued')
      .where('scheduledAt', '<=', now.toISOString());

    const snapshot = await queuedPostsQuery.get();

    if (snapshot.empty) {
      console.log('[VORTEX AI] No posts due for publishing.');
      return { publishedPosts: [], checkedCount: 0 };
    }

    const publishedPosts: string[] = [];
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      const post = { id: doc.id, ...doc.data() } as SocialPost;
      
      // THIS IS A SIMULATION.
      // In a real app, you would use platform-specific SDKs (e.g., Twitter API, Instagram API)
      // and the API keys to publish the post.
      console.log(`[VORTEX AI] >>> Publishing to ${post.platform}: "${post.post}"`);

      // Update the post's status to 'posted' in Firestore.
      const postRef = db.collection('social_posts').doc(post.id);
      batch.update(postRef, { status: 'posted' });
      publishedPosts.push(post.id);
    });

    await batch.commit();
    console.log(`[VORTEX AI] Successfully published ${publishedPosts.length} posts.`);

    return {
      publishedPosts,
      checkedCount: snapshot.size
    };
  }
);

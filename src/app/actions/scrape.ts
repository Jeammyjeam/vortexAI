
'use server';

import { auth } from '@/firebase/server';
import { GoogleAuth } from 'google-auth-library';

export async function startScraper(idToken: string): Promise<{ success: boolean, message?: string, error?: string }> {
  try {
    // 1. Verify the user is an authenticated admin on the server-side
    if (!idToken) {
        throw new Error('Authentication token missing. You must be logged in.');
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.admin !== true) {
        throw new Error('Insufficient permissions. User is not an admin.');
    }

    // 2. Get the URL of the deployed Cloud Run service
    const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL;
    if (!scraperServiceUrl) {
        throw new Error("SCRAPER_SERVICE_URL environment variable is not set.");
    }
    
    // 3. Create an authorized client to invoke the Cloud Run service
    const googleAuth = new GoogleAuth();
    const client = await googleAuth.getIdTokenClient(scraperServiceUrl);

    // 4. Make an authorized POST request to the scraper service
    console.log(`Invoking scraper service at: ${scraperServiceUrl} for user ${decodedToken.uid}`);
    const response = await client.request({
        url: scraperServiceUrl,
        method: 'POST',
    });
    
    console.log("Scraper service responded with status:", response.status);

    if (response.status !== 202) {
        const responseData = response.data as any;
        const errorMessage = responseData?.message || `Scraper service returned an unexpected status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return { success: true, message: "Scraper job started successfully." };

  } catch (error: any) {
    console.error('[SERVER ACTION ERROR] Failed to invoke scraper service:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

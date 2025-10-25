
'use server';

import { GoogleAuth } from 'google-auth-library';

export async function startScraper(): Promise<{ success: boolean, message?: string, error?: string }> {
  try {
    // 1. Get the URL of the deployed Cloud Run service from environment variables
    const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL;
    if (!scraperServiceUrl) {
        throw new Error("Configuration error: SCRAPER_SERVICE_URL environment variable is not set.");
    }
    
    // 2. Create an authorized client to invoke the Cloud Run service.
    // This automatically uses the service account of the environment (the App Hosting backend)
    // to authenticate to the scraper service. The service account MUST have the "Cloud Run Invoker" role.
    const googleAuth = new GoogleAuth();
    const client = await googleAuth.getIdTokenClient(scraperServiceUrl);

    // 3. Make the authorized POST request to trigger the scraper.
    console.log(`Invoking scraper service at: ${scraperServiceUrl}`);
    const response = await client.request({
        url: scraperServiceUrl,
        method: 'POST',
    });
    
    console.log("Scraper service responded with status:", response.status);

    // The scraper is designed to return a 202 "Accepted" status on success.
    if (response.status !== 202) {
        const responseData = response.data as any;
        const errorMessage = responseData?.message || `Scraper service returned an unexpected status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return { success: true, message: "Scraper job started successfully." };

  } catch (error: any) {
    console.error('[SERVER ACTION ERROR] Failed to invoke scraper service:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Provide a more user-friendly error message
    return { success: false, error: `Failed to start the discovery service. Please ensure it's deployed and permissions are correct. Details: ${errorMessage}` };
  }
}

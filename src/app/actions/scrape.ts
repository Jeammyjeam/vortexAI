
'use server';

import { GoogleAuth } from 'google-auth-library';
import { auth } from '@/firebase/server';

export async function startScraper(idToken: string): Promise<{ success: boolean, message?: string, error?: string }> {
  try {
    // 1. VERIFY USER TOKEN: Ensure the request is from a legitimate, authenticated admin user.
    if (!idToken) {
        return { success: false, error: 'Authentication token is missing. Please log in again.' };
    }
    
    // This verification happens on the backend, using the Firebase Admin SDK.
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check for admin custom claim. This is a crucial security check.
    // Ensure you have run the `set-admin` script for your user.
    if (decodedToken.admin !== true) {
      return { success: false, error: 'Permission denied. User is not an administrator.' };
    }

    // 2. INVOKE CLOUD RUN SERVICE: Authenticate as a service, not as the user.
    const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL;
    if (!scraperServiceUrl) {
        throw new Error("Configuration error: SCRAPER_SERVICE_URL environment variable is not set on the server.");
    }
    
    // The GoogleAuth client automatically uses the service account of the environment 
    // (the App Hosting backend) to create an authorized token to call another Google Cloud service.
    const googleAuth = new GoogleAuth();
    const client = await googleAuth.getIdTokenClient(scraperServiceUrl);

    console.log(`Invoking scraper service as a server at: ${scraperServiceUrl}`);
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
    
    let errorMessage = 'An unknown error occurred while starting the discovery service.';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Your session has expired. Please log in again.';
    } else if (error.code === 'auth/argument-error') {
        errorMessage = 'The authentication token is invalid.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    return { success: false, error: `Failed to start the discovery service. Details: ${errorMessage}` };
  }
}

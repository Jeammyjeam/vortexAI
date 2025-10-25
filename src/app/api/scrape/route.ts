
import { auth } from '@/firebase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { GoogleAuth } from 'google-auth-library';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    if (!idToken) {
        return NextResponse.json({ error: 'Bearer token missing' }, { status: 401 });
    }

    // 1. Verify the user's ID token to ensure they are a legitimate user
    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.admin !== true) {
        return NextResponse.json({ error: 'User is not an admin' }, { status: 403 });
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
    console.log(`Invoking scraper service at: ${scraperServiceUrl}`);
    const response = await client.request({
        url: scraperServiceUrl,
        method: 'POST',
    });
    
    console.log("Scraper service responded with status:", response.status);

    return NextResponse.json({ success: true, message: "Scraper job started successfully." }, { status: response.status });

  } catch (error: any) {
    console.error('Failed to invoke scraper service:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to start scraper job', details: errorMessage }, { status: 500 });
  }
}

// This script is used to grant admin privileges to a user by setting a custom claim.
// It should be run from the command line in a secure environment.
//
// Usage:
// 1. Ensure you have your `FIREBASE_SERVICE_ACCOUNT_KEY` set in your .env file
//    or have `GOOGLE_APPLICATION_CREDENTIALS` set in your environment.
// 2. Run the script with the email of the user you want to make an admin:
//    `npm run set-admin -- user.email@example.com`

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env.local' });
config({ path: '.env' });


async function setAdminClaim(email) {
  if (!email) {
    console.error('Error: Please provide an email address as an argument.');
    console.log('Usage: npm run set-admin -- <user_email>');
    process.exit(1);
  }
  
  // Initialize Firebase Admin SDK
  // Service account key can be provided via environment variable as a JSON string
  // or via GOOGLE_APPLICATION_CREDENTIALS file path.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please add it to your .env file.');
  }

  try {
     initializeApp({
        credential: cert(JSON.parse(serviceAccountKey))
     });
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    console.log('Please ensure your FIREBASE_SERVICE_ACCOUNT_KEY in your .env file is a valid JSON string.');
    process.exit(1);
  }

  const auth = getAuth();

  try {
    // 1. Get the user by email
    const user = await auth.getUserByEmail(email);
    
    // 2. Check current claims
    if (user.customClaims && user.customClaims.admin === true) {
      console.log(`User ${email} is already an admin.`);
      return;
    }

    // 3. Set the custom claim
    await auth.setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`Successfully set admin claim for user: ${email}`);
    console.log('The user may need to log out and log back in for the changes to take effect.');
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`Error: User with email ${email} not found.`);
    } else {
      console.error('An error occurred:', error);
    }
    process.exit(1);
  }
}

// Get email from command line arguments
const emailArg = process.argv[2];
setAdminClaim(emailArg);

#!/usr/bin/env node

/**
 * Grants admin role to a user by setting a custom claim.
 * Usage: `npm run set-admin -- user.email@example.com`
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from project root .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const email = process.argv[2];

if (!email) {
  console.error('Error: Please provide an email address as an argument.');
  console.log('Usage: npm run set-admin -- user.email@example.com');
  process.exit(1);
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables.');
  console.log('Please ensure it is set in your .env.local file.');
  process.exit(1);
}

try {
  initializeApp({
    credential: cert(JSON.parse(serviceAccountKey)),
  });

  console.log(`Fetching user: ${email}...`);

  getAuth()
    .getUserByEmail(email)
    .then((user) => {
      console.log(`Found user: ${user.uid}`);
      // Check if user is already an admin
      if (user.customClaims && user.customClaims['admin'] === true) {
        console.log(`User ${email} is already an admin. No changes made.`);
        process.exit(0);
      }
      
      console.log('Setting admin custom claim...');
      return getAuth().setCustomUserClaims(user.uid, { admin: true });
    })
    .then(() => {
      console.log(`✅ Success! Custom claim 'admin: true' set for user ${email}.`);
      console.log('The user must sign out and sign back in for the changes to take effect.');
      process.exit(0);
    })
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        console.error(`Error: User with email ${email} not found.`);
      } else {
        console.error('Error setting custom claim:', error);
      }
      process.exit(1);
    });

} catch (e) {
    console.error('Error initializing Firebase Admin SDK. Is your service account key valid?');
    console.error(e);
    process.exit(1);
}

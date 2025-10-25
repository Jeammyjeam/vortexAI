import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: Path to your service account key file
// Download this from your Firebase project settings
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

const appName = 'firebase-admin-app-for-nextjs';
const app = getApps().find(a => a.name === appName) || initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : undefined,
    }, appName);

export const db = getFirestore(app);
export const auth = getAuth(app);

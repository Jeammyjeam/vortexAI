import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app: App;

if (!getApps().length) {
  if (!serviceAccountString) {
    // In a Google Cloud environment (like Cloud Run), the SDK can often auto-initialize
    // without explicit credentials if the service account has the right permissions.
    app = initializeApp();
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error: any) {
      console.error('Error parsing service account key or initializing Firebase Admin SDK:', error);
      // If initialization fails, subsequent calls to db or auth will fail.
      // This is a critical startup error.
      throw new Error('Firebase Admin SDK initialization failed.');
    }
  }
} else {
  app = getApps()[0];
}


export const db = getFirestore(app);
export const auth = getAuth(app);

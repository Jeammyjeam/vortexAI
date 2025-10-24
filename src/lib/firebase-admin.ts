
import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK, but only if it hasn't been initialized already.
// This is the singleton pattern, which prevents re-initialization errors in a serverless environment.
const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // When deployed, this will use the service account key from the environment variable.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('[VORTEX AI] Initializing Firebase Admin with Service Account...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } 
  
  // This fallback is for local development or environments where Application Default Credentials are available.
  console.log('[VORTEX AI] Initializing Firebase Admin with Application Default Credentials...');
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
};


/**
 * Returns an initialized Firebase Admin SDK instance.
 */
export function getFirebaseAdmin() {
    initializeAdminApp();
    return admin;
}

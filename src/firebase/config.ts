// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
import {FirebaseOptions} from 'firebase/app';

let config: FirebaseOptions;

try {
  config = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (e) {
  console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG. Make sure it's a valid JSON string.");
  config = {};
}

export const firebaseConfig: FirebaseOptions = config;

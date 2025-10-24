
// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
import {FirebaseOptions} from 'firebase/app';

let config: FirebaseOptions;

try {
  // Correctly parse the JSON string from the environment variable.
  // The variable is expected to be a stringified JSON object.
  const configStr = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!configStr) {
    throw new Error("NEXT_PUBLIC_FIREBASE_CONFIG is not set.");
  }
  // The environment variable might be wrapped in single quotes, remove them.
  const cleanConfigStr = configStr.startsWith("'") && configStr.endsWith("'") 
    ? configStr.slice(1, -1) 
    : configStr;

  config = JSON.parse(cleanConfigStr);
} catch (e) {
  console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG. Make sure it's a valid JSON string. Error:", e);
  // Default to an empty object to avoid crashing the app on the server.
  // The client will fail to initialize Firebase, which is expected.
  config = {};
}

export const firebaseConfig: FirebaseOptions = config;

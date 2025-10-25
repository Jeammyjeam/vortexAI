import { FirebaseOptions } from 'firebase/app';

// This is the shape of the Firebase config object.
// We use a type assertion to ensure that the parsed object conforms to this shape.
type FirebaseConfig = FirebaseOptions;

let parsedConfig: FirebaseConfig = {};

try {
  // NEXT_PUBLIC_FIREBASE_CONFIG is a JSON string set in your .env file.
  // It's crucial that this variable is correctly formatted as a JSON string.
  const configString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  
  if (!configString) {
    throw new Error("NEXT_PUBLIC_FIREBASE_CONFIG is not defined in your environment variables. Please check your .env file.");
  }
  
  parsedConfig = JSON.parse(configString) as FirebaseConfig;

} catch (error) {
  console.error("Failed to parse Firebase config. Please ensure NEXT_PUBLIC_FIREBASE_CONFIG in your .env file is a valid JSON string.", error);
  // In case of an error, we fall back to an empty object to avoid a hard crash.
  // The application will likely fail to connect to Firebase, but it will be a runtime error
  // with a clear message in the console, rather than a build-time or server-start error.
  parsedConfig = {};
}

export const firebaseConfig: FirebaseConfig = parsedConfig;

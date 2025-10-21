// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
import {initializeApp, getApp, getApps} from 'firebase/app';
import {getAuth, connectAuthEmulator} from 'firebase/auth';
import {getFirestore, connectFirestoreEmulator} from 'firebase/firestore';

import {firebaseConfig} from './config';
import {FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth} from './provider';
import {FirebaseClientProvider} from './client-provider';
import {useCollection} from './firestore/use-collection';
import {useDoc} from './firestore/use-doc';
import {useUser} from './auth/use-user';


export function initializeFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  return {
    app,
    firestore,
    auth,
  };
}

export {
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useCollection,
  useDoc,
  useUser,
};

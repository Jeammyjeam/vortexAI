// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
'use client';
import {useMemo} from 'react';

import {initializeFirebase, FirebaseProvider} from '@/firebase';

export function FirebaseClientProvider({children}: {children: React.ReactNode}) {
  const a = useMemo(() => initializeFirebase(), []);
  return <FirebaseProvider {...a}>{children}</FirebaseProvider>;
}

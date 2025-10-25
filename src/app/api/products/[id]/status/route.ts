import { auth, db } from '@/firebase/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    if (!idToken) {
        return NextResponse.json({ error: 'Bearer token missing' }, { status: 401 });
    }

    // Verify the ID token and check for admin claim
    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.admin !== true) {
        return NextResponse.json({ error: 'User is not an admin' }, { status: 403 });
    }

    const { id } = params;
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing product ID or status' }, { status: 400 });
    }

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    const docRef = doc(db, 'products', id);
    
    await updateDoc(docRef, {
      listing_status: status,
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id, status });
  } catch (error: any) {
    console.error('Failed to update product status:', error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Authentication token is invalid or expired.' }, { status: 401 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to update product status', details: errorMessage }, { status: 500 });
  }
}

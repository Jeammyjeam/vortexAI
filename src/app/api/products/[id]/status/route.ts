import { db } from '@/firebase/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
  } catch (error) {
    console.error('Failed to update product status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to update product status', details: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { defaultFeedbackRepository } from '@/lib/storage/store';
import { adminAuthService } from '@/lib/admin/adminAuth';

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (adminAuthService.verifySessionToken(token)) return true;
  }
  const passkeyHeader = req.headers.get('x-admin-passkey');
  if (passkeyHeader && adminAuthService.verifyPasskey(passkeyHeader)) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const ratingStr = url.searchParams.get('rating');
    const category = url.searchParams.get('category') || undefined;
    const persona = url.searchParams.get('persona') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const rating = ratingStr ? parseInt(ratingStr, 10) : undefined;

    const items = await defaultFeedbackRepository.findAll({
      rating: isNaN(rating as number) ? undefined : rating,
      category,
      persona,
      status,
      search,
    });

    const summaryKPIs = await defaultFeedbackRepository.getSummaryKPIs();

    return NextResponse.json({
      success: true,
      data: items,
      kpis: summaryKPIs,
    });
  } catch (err) {
    console.error('Admin feedback GET error:', err);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'ID and Status are required.' },
        { status: 400 }
      );
    }

    const updated = await defaultFeedbackRepository.updateStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Feedback not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Admin feedback PATCH error:', err);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    }

    const deleted = await defaultFeedbackRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Feedback not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Feedback deleted successfully.' });
  } catch (err) {
    console.error('Admin feedback DELETE error:', err);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}

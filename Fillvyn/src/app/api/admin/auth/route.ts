import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passkey } = body;

    if (!passkey || typeof passkey !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Passkey is required.' },
        { status: 400 }
      );
    }

    const token = adminAuthService.createSessionToken(passkey);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invalid admin passkey.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      token,
    });
  } catch (err) {
    console.error('Admin auth error:', err);
    return NextResponse.json(
      { success: false, message: 'Authentication request failed.' },
      { status: 500 }
    );
  }
}

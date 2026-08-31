import { NextRequest, NextResponse } from 'next/server';
import { defaultContactService } from '@/lib/contact/contactService';
import { ContactPayload } from '@/lib/contact/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ContactPayload>;

    const result = await defaultContactService.processInquiry(body);

    if (!result.success) {
      if (result.errors) {
        return NextResponse.json(result, { status: 422 });
      }
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid request format or payload.',
      },
      { status: 400 }
    );
  }
}

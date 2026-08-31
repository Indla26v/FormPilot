import { NextRequest, NextResponse } from 'next/server';
import { defaultFeedbackService } from '@/lib/feedback/feedbackService';
import { FeedbackPayload } from '@/lib/feedback/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<FeedbackPayload>;

    const result = await defaultFeedbackService.submitFeedback(body);

    if (!result.success) {
      if (result.errors) {
        return NextResponse.json(result, { status: 422 });
      }
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Feedback API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid feedback request format.',
      },
      { status: 400 }
    );
  }
}

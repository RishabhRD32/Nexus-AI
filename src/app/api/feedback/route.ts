import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Submit feedback for learning
export async function POST(req: NextRequest) {
  try {
    const { messageId, rating, feedback, isPositive, category } = await req.json();
    
    const feedbackRecord = await db.feedback.create({
      data: {
        messageId,
        rating,
        feedback,
        isPositive,
        category
      }
    });
    
    return NextResponse.json({
      success: true,
      feedback: feedbackRecord,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Feedback POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback', success: false },
      { status: 500 }
    );
  }
}

// GET - Retrieve feedback stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    const where = category ? { category } : {};
    
    const feedbacks = await db.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    // Calculate stats
    const totalFeedback = feedbacks.length;
    const positiveCount = feedbacks.filter(f => f.isPositive).length;
    const avgRating = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / (feedbacks.filter(f => f.rating).length || 1);
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalFeedback,
        positive: positiveCount,
        negative: totalFeedback - positiveCount,
        positiveRate: totalFeedback > 0 ? (positiveCount / totalFeedback * 100).toFixed(1) : 0,
        averageRating: avgRating.toFixed(1)
      },
      feedbacks
    });
  } catch (error) {
    console.error('Feedback GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback', success: false },
      { status: 500 }
    );
  }
}

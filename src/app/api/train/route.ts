import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Get training status and data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Get training statistics
    const totalTrainingData = await db.trainingData.count();
    const usedTrainingData = await db.trainingData.count({
      where: { used: true }
    });
    const knowledgeCount = await db.knowledge.count();
    const feedbackCount = await db.feedback.count({
      where: { isPositive: true }
    });
    
    // Get recent training data
    const recentTraining = await db.trainingData.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: userId ? { userId } : undefined
    });
    
    // Get knowledge by category
    const knowledgeByCategory = await db.knowledge.groupBy({
      by: ['category'],
      _count: { id: true },
      where: userId ? { userId } : undefined
    });
    
    // Get training sessions
    const sessions = await db.trainingSession.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalTrainingData,
        usedTrainingData,
        knowledgeCount,
        positiveFeedback: feedbackCount,
        accuracy: usedTrainingData > 0 ? (feedbackCount / usedTrainingData * 100).toFixed(1) : 0
      },
      recentTraining,
      knowledgeByCategory,
      sessions
    });
  } catch (error) {
    console.error('Training stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get training stats', success: false },
      { status: 500 }
    );
  }
}

// Add training data from conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, output, context, source, category, quality, userId } = body;

    if (!input || !output) {
      return NextResponse.json(
        { error: 'Input and output are required', success: false },
        { status: 400 }
      );
    }

    // Store training data
    const trainingData = await db.trainingData.create({
      data: {
        input,
        output,
        context: context || null,
        source: source || 'user',
        category: category || 'conversation',
        quality: quality || 3,
        userId: userId || null
      }
    });

    // Also store in knowledge base for reference
    await db.knowledge.create({
      data: {
        title: input.substring(0, 100),
        content: output,
        source: source || 'user_feedback',
        category: category || 'training',
        confidence: (quality || 3) / 5,
        userId: userId || null
      }
    });

    return NextResponse.json({
      success: true,
      trainingData,
      message: 'Training data saved successfully'
    });
  } catch (error) {
    console.error('Training save error:', error);
    return NextResponse.json(
      { error: 'Failed to save training data', success: false },
      { status: 500 }
    );
  }
}

// Start a training session
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionName, userId } = body;

    // Create training session
    const session = await db.trainingSession.create({
      data: {
        name: sessionName || `Training ${new Date().toISOString()}`,
        status: 'running',
        startedAt: new Date(),
        progress: 0
      }
    });

    // Get unused training data
    const trainingData = await db.trainingData.findMany({
      where: {
        used: false,
        quality: { gte: 3 }
      },
      take: 100
    });

    let processedCount = 0;
    const totalSamples = trainingData.length;

    // Process each training sample
    for (const data of trainingData) {
      try {
        // Use LLM to synthesize and improve training
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: 'You are an AI training assistant. Analyze the input-output pair and validate it for quality. Respond with "VALID" if good, or "INVALID: reason" if not.'
            },
            {
              role: 'user',
              content: `Input: ${data.input}\nOutput: ${data.output}\n\nValidate this training pair.`
            }
          ],
          thinking: { type: 'disabled' }
        });

        const validation = completion.choices[0]?.message?.content || '';
        
        // Mark as used and update quality based on validation
        await db.trainingData.update({
          where: { id: data.id },
          data: {
            used: true,
            quality: validation.includes('VALID') ? 5 : 2
          }
        });

        processedCount++;
        
        // Update session progress
        await db.trainingSession.update({
          where: { id: session.id },
          data: {
            progress: (processedCount / totalSamples) * 100,
            samplesUsed: processedCount
          }
        });
      } catch (e) {
        console.error('Error processing training sample:', e);
      }
    }

    // Complete session
    await db.trainingSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        accuracy: processedCount > 0 ? processedCount / totalSamples : 0
      }
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        processedCount,
        totalSamples
      },
      message: `Training completed: ${processedCount}/${totalSamples} samples processed`
    });
  } catch (error) {
    console.error('Training session error:', error);
    return NextResponse.json(
      { error: 'Failed to run training session', success: false },
      { status: 500 }
    );
  }
}

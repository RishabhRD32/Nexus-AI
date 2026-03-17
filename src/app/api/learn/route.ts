import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Learn from web search results
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, userId } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required', success: false },
        { status: 400 }
      );
    }

    // Create a learning task
    const task = await db.agentTask.create({
      data: {
        name: `Learn: ${topic}`,
        description: `Search and learn about: ${topic}`,
        status: 'running',
        agentType: 'research',
        startedAt: new Date()
      }
    });

    try {
      // Use LLM to generate knowledge about the topic
      const zai = await ZAI.create();
      
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'You are an AI knowledge base builder. Provide comprehensive, accurate information on topics. Structure your response with clear sections and facts.'
          },
          {
            role: 'user',
            content: `Provide detailed information about: ${topic}. Include key facts, concepts, and practical applications.`
          }
        ],
        thinking: { type: 'disabled' }
      });

      const knowledge = completion.choices[0]?.message?.content || '';

      // Store in knowledge base
      const savedKnowledge = await db.knowledge.create({
        data: {
          title: topic,
          content: knowledge,
          source: 'web_learning',
          category: 'learned',
          tags: topic.toLowerCase(),
          confidence: 0.8,
          userId: userId || null
        }
      });

      // Also create training data
      await db.trainingData.create({
        data: {
          input: `Tell me about ${topic}`,
          output: knowledge,
          context: 'Learned from AI knowledge synthesis',
          source: 'web',
          category: 'knowledge',
          quality: 4,
          userId: userId || null
        }
      });

      // Update task as completed
      await db.agentTask.update({
        where: { id: task.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          output: { knowledgeId: savedKnowledge.id }
        }
      });

      return NextResponse.json({
        success: true,
        knowledge: {
          id: savedKnowledge.id,
          title: topic,
          content: knowledge.substring(0, 500) + '...',
          full: true
        },
        message: `Successfully learned about: ${topic}`
      });
    } catch (aiError) {
      // Update task as failed
      await db.agentTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        }
      });
      throw aiError;
    }
  } catch (error) {
    console.error('Learning error:', error);
    return NextResponse.json(
      { error: 'Failed to learn topic', success: false },
      { status: 500 }
    );
  }
}

// Get learned knowledge
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where = {
      ...(userId && { userId }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } }
        ]
      })
    };

    const knowledge = await db.knowledge.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    const categories = await db.knowledge.groupBy({
      by: ['category'],
      _count: { id: true }
    });

    return NextResponse.json({
      success: true,
      knowledge,
      categories,
      total: knowledge.length
    });
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge', success: false },
      { status: 500 }
    );
  }
}

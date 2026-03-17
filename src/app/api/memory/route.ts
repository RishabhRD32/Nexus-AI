import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Retrieve memories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const where = category ? { category } : {};
    
    const memories = await db.memory.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Memory GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve memories', success: false },
      { status: 500 }
    );
  }
}

// POST - Store new memory
export async function POST(req: NextRequest) {
  try {
    const { key, content, category = 'general', importance = 5 } = await req.json();
    
    if (!key || !content) {
      return NextResponse.json(
        { error: 'Key and content are required' },
        { status: 400 }
      );
    }
    
    // Upsert memory (update if exists, create if not)
    const memory = await db.memory.upsert({
      where: { key },
      update: {
        content,
        category,
        importance,
        updatedAt: new Date()
      },
      create: {
        key,
        content,
        category,
        importance
      }
    });
    
    return NextResponse.json({
      success: true,
      memory,
      message: 'Memory stored successfully'
    });
  } catch (error) {
    console.error('Memory POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to store memory', success: false },
      { status: 500 }
    );
  }
}

// DELETE - Clear memories
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const category = searchParams.get('category');
    
    if (key) {
      await db.memory.delete({ where: { key } });
    } else if (category) {
      await db.memory.deleteMany({ where: { category } });
    } else {
      await db.memory.deleteMany();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Memory cleared successfully'
    });
  } catch (error) {
    console.error('Memory DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear memory', success: false },
      { status: 500 }
    );
  }
}

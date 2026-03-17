import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple auth - in production, use NextAuth.js with proper providers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', success: false },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: password || null,
          settings: {
            theme: 'dark',
            notifications: true,
            voiceEnabled: true,
            autoLearn: true
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 500 }
    );
  }
}

// Get user profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', success: false },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            conversations: true,
            memories: true,
            knowledge: true,
            trainingData: true,
            achievements: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      );
    }

    // Get achievements
    const achievements = await db.achievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        settings: user.settings,
        stats: user._count,
        achievements
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', success: false },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, settings } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', success: false },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { settings }
    });

    return NextResponse.json({
      success: true,
      settings: user.settings
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', success: false },
      { status: 500 }
    );
  }
}

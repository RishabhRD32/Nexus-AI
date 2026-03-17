import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Singleton ZAI instance for better performance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let initPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null;

async function getZAI() {
  if (zaiInstance) return zaiInstance;
  if (!initPromise) {
    initPromise = ZAI.create().then(zai => {
      zaiInstance = zai;
      return zai;
    });
  }
  return initPromise;
}

// Pre-initialize on cold start
getZAI().catch(console.error);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode = 'chat', history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required', success: false },
        { status: 400 }
      );
    }

    // Get ZAI instance
    const zai = await getZAI();

    // Build system prompt based on mode
    const systemPrompts: Record<string, string> = {
      chat: 'You are NEXUS AI, an advanced personal intelligence assistant. You are helpful, intelligent, and friendly. Provide detailed, accurate responses. Always be helpful and comprehensive.',
      code: 'You are NEXUS AI, an expert coding assistant. Write clean, efficient, well-commented code. Explain your solutions clearly and follow best practices.',
      image: 'You are NEXUS AI, a creative image generation assistant. Help users visualize their ideas with detailed descriptions.',
      search: 'You are NEXUS AI, a research assistant. Provide accurate, well-sourced information and cite sources when possible.',
      document: 'You are NEXUS AI, a document creation assistant. Help users create professional documents, reports, and presentations.',
      voice: 'You are NEXUS AI, a voice-enabled assistant. Provide concise, clear responses suitable for spoken interaction.'
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.chat;

    // Build messages array
    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...history.slice(-8).map((m: { role: string; content: string }) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: message }
    ];

    // Get response from LLM
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json({
        success: false,
        error: 'No response generated. Please try again.',
        response: 'I apologize, but I could not generate a response. Please try again.'
      });
    }

    return NextResponse.json({
      success: true,
      response: responseContent,
      metadata: {
        mode,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Return a helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      response: `I encountered an error: ${errorMessage}. Please try again or check your connection.`
    }, { status: 500 });
  }
}

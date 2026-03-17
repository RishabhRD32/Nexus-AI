import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are NEXUS AI, an advanced personal AI assistant. Be concise and helpful. Use markdown when appropriate.`,
  code: `You are NEXUS AI, an expert coding assistant. Provide clean, efficient code with explanations.`,
  search: `You are NEXUS AI, a research assistant. Provide accurate, well-sourced information.`,
  document: `You are NEXUS AI, a document creation specialist. Create professional, well-formatted content.`,
  image: `You are NEXUS AI, an AI image prompt specialist. Craft detailed, effective prompts.`,
  video: `You are NEXUS AI, a video creation assistant. Help plan video content.`
};

export async function POST(req: NextRequest) {
  try {
    const { message, mode = 'chat', history = [] } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const zai = await getZAI();
    
    const messages = [
      { role: 'assistant' as const, content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await zai.chat.completions.create({
            messages,
            thinking: { type: 'disabled' }
          });

          const response = completion.choices[0]?.message?.content || '';
          
          // Simulate streaming by sending chunks
          const words = response.split(' ');
          let buffer = '';
          
          for (let i = 0; i < words.length; i++) {
            buffer += (i > 0 ? ' ' : '') + words[i];
            
            // Send every few words as a chunk
            if (i % 3 === 0 || i === words.length - 1) {
              const data = JSON.stringify({ content: buffer, done: i === words.length - 1 });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              buffer = '';
              
              // Small delay for streaming effect
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }
          
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

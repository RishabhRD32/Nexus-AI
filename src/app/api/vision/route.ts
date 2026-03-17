import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let initPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null;

async function getZAI() {
  if (zaiInstance) return zaiInstance;
  if (!initPromise) initPromise = ZAI.create().then(zai => { zaiInstance = zai; return zai; });
  return initPromise;
}

getZAI();

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const zai = await getZAI();

    const analysisPrompt = prompt || `Analyze this image thoroughly. 
Describe what you see, identify objects, text, people, and context.
Provide relevant insights and observations.`;

    const response = await zai.chat.completions.createVision({
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: image } }
        ]
      }],
      thinking: { type: 'disabled' }
    });

    const description = response.choices[0]?.message?.content || 'Could not analyze the image.';

    return NextResponse.json({
      success: true,
      description,
      metadata: { timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image analysis failed', success: false },
      { status: 500 }
    );
  }
}

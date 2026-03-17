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
    const { text, voice = 'tongtong', speed = 1.0 } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const truncatedText = text.length > 1000 ? text.substring(0, 1000) + '...' : text;

    const zai = await getZAI();

    const response = await zai.audio.tts.create({
      input: truncatedText,
      voice,
      speed,
      response_format: 'wav',
      stream: false
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Speech synthesis failed', success: false },
      { status: 500 }
    );
  }
}

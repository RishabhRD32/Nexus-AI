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
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const zai = await getZAI();

    const response = await zai.audio.asr.create({
      file_base64: base64Audio
    });

    return NextResponse.json({
      success: true,
      text: response.text,
      metadata: {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Transcription API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed', success: false },
      { status: 500 }
    );
  }
}

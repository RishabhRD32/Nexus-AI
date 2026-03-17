import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let initPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null;

async function getZAI() {
  if (zaiInstance) return zaiInstance;
  if (!initPromise) initPromise = ZAI.create().then(zai => { zaiInstance = zai; return zai; });
  return initPromise;
}

getZAI();

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'generated');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

ensureUploadDir();

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const zai = await getZAI();

    const response = await zai.images.generations.create({
      prompt,
      size
    });

    const imageBase64 = response.data[0].base64;
    const buffer = Buffer.from(imageBase64, 'base64');

    const filename = `img_${Date.now()}.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json({
      success: true,
      imageUrl: `/generated/${filename}`,
      prompt,
      size,
      metadata: { timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('Image Generation API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed', success: false },
      { status: 500 }
    );
  }
}

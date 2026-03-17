import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'generated');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'cogvideox' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const zai = await getZAI();
    ensureUploadDir();

    // Generate video using the SDK
    const response = await zai.videos.generations.create({
      model: model,
      prompt: prompt
    });

    // Get the video URL or data
    const videoUrl = response.data?.[0]?.url;
    
    if (videoUrl) {
      // If it's a URL, we can return it directly
      return NextResponse.json({
        success: true,
        videoUrl: videoUrl,
        prompt,
        model,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    }

    // If base64 data is returned
    const videoBase64 = response.data?.[0]?.base64;
    if (videoBase64) {
      const buffer = Buffer.from(videoBase64, 'base64');
      const filename = `video_${Date.now()}.mp4`;
      const filepath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filepath, buffer);

      return NextResponse.json({
        success: true,
        videoUrl: `/generated/${filename}`,
        prompt,
        model,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No video data returned from generation'
    }, { status: 500 });

  } catch (error) {
    console.error('Video Generation API Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Video generation failed',
        success: false 
      },
      { status: 500 }
    );
  }
}

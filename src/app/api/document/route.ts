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

// Generate document content based on type
async function generateDocumentContent(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  type: string,
  prompt: string
): Promise<string> {
  const systemPrompts: Record<string, string> = {
    word: `You are a professional document writer. Generate well-structured content for a Word document.
Use proper formatting with headings, paragraphs, and bullet points where appropriate.
Format the content in Markdown.`,
    
    excel: `You are a spreadsheet expert. Generate data that would be suitable for an Excel spreadsheet.
Format as a markdown table with columns and rows.`,
    
    ppt: `You are a presentation designer. Generate slide content for a PowerPoint presentation.
Format each slide with a title and bullet points. Use "---" to separate slides.`
  };

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: systemPrompts[type] || systemPrompts.word
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    thinking: { type: 'disabled' }
  });

  return completion.choices[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  try {
    const { type = 'word', prompt, format = 'markdown' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const validTypes = ['word', 'excel', 'ppt'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const zai = await getZAI();
    ensureUploadDir();

    // Generate document content
    const content = await generateDocumentContent(zai, type, prompt);

    // Save content as markdown file (for now, real implementation would use proper libraries)
    const filename = `doc_${Date.now()}.md`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, content);

    return NextResponse.json({
      success: true,
      content,
      downloadUrl: `/generated/${filename}`,
      type,
      format,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Document Generation API Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Document generation failed',
        success: false 
      },
      { status: 500 }
    );
  }
}

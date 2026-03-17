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
    const { query, searchType = 'general' } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const zai = await getZAI();

    const response = await zai.web.search({ query });

    const results = (response.results || []).slice(0, 5).map((result: { title?: string; url?: string; snippet?: string }) => ({
      title: result.title || 'Untitled',
      url: result.url || '',
      snippet: result.snippet || ''
    }));

    const summaryCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a research assistant. Summarize search results concisely.' },
        { role: 'user', content: `Summarize these results for "${query}":\n${JSON.stringify(results, null, 2)}` }
      ],
      thinking: { type: 'disabled' }
    });

    const summary = summaryCompletion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      query,
      results,
      summary,
      metadata: {
        searchType,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed', success: false },
      { status: 500 }
    );
  }
}

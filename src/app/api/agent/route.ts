import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Agent types and their capabilities
const AGENT_PROMPTS: Record<string, string> = {
  research: `You are a Research Agent. Your job is to:
- Search for information on the internet
- Synthesize findings from multiple sources
- Provide accurate, well-cited research summaries
- Identify knowledge gaps and suggest further investigation`,

  coding: `You are a Coding Agent. Your job is to:
- Write clean, efficient code in various languages
- Debug and fix issues in existing code
- Explain code concepts clearly
- Optimize performance and suggest best practices`,

  vision: `You are a Vision Agent. Your job is to:
- Analyze images and extract meaningful information
- Identify objects, people, text, and context
- Provide detailed visual descriptions
- Generate insights from visual data`,

  creativity: `You are a Creativity Agent. Your job is to:
- Generate creative content (stories, poems, scripts)
- Brainstorm ideas and concepts
- Create engaging marketing copy
- Develop unique perspectives and approaches`,

  automation: `You are an Automation Agent. Your job is to:
- Design workflows and processes
- Automate repetitive tasks
- Create efficient systems
- Optimize existing processes`
};

// GET - List agent tasks
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const agentType = searchParams.get('agentType');
    
    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (agentType) where.agentType = agentType;
    
    const tasks = await db.agentTask.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });
    
    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Agent GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tasks', success: false },
      { status: 500 }
    );
  }
}

// POST - Create and execute agent task
export async function POST(req: NextRequest) {
  try {
    const { name, description, agentType, input, priority = 5 } = await req.json();
    
    if (!name || !agentType) {
      return NextResponse.json(
        { error: 'Name and agentType are required' },
        { status: 400 }
      );
    }
    
    // Create task
    const task = await db.agentTask.create({
      data: {
        name,
        description,
        agentType,
        input,
        priority,
        status: 'running',
        startedAt: new Date()
      }
    });
    
    // Execute task based on agent type
    const zai = await getZAI();
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.research;
    
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: `${name}: ${description || ''}\n\nInput: ${JSON.stringify(input || {})}` }
        ],
        thinking: { type: 'disabled' }
      });
      
      const result = completion.choices[0]?.message?.content;
      
      // Update task with result
      const updatedTask = await db.agentTask.update({
        where: { id: task.id },
        data: {
          status: 'completed',
          output: { result },
          completedAt: new Date()
        }
      });
      
      return NextResponse.json({
        success: true,
        task: updatedTask,
        result
      });
    } catch (execError) {
      // Update task with error
      await db.agentTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          error: execError instanceof Error ? execError.message : 'Execution failed',
          completedAt: new Date()
        }
      });
      
      throw execError;
    }
  } catch (error) {
    console.error('Agent POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent task failed', success: false },
      { status: 500 }
    );
  }
}

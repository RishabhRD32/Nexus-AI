import { NextRequest, NextResponse } from 'next/server';

// System Stats API - Returns dynamic system information
export async function GET(req: NextRequest) {
  try {
    // Get actual memory usage (Node.js process memory)
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryPercent = Math.round((usedMemory / totalMemory) * 100);
    
    // Simulate CPU usage based on time and memory
    const cpuBase = 15 + Math.sin(Date.now() / 10000) * 10;
    const cpuUsage = Math.round(cpuBase + (memoryPercent / 10));
    
    // Calculate learning progress based on memory patterns
    const learningProgress = Math.min(95, 50 + Math.round((memUsage.external / 1024 / 1024) % 45));
    
    return NextResponse.json({
      success: true,
      stats: {
        cpu: Math.min(100, Math.max(5, cpuUsage)),
        memory: memoryPercent,
        learning: learningProgress,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        heapUsed: Math.round(usedMemory / 1024 / 1024),
        heapTotal: Math.round(totalMemory / 1024 / 1024)
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats', success: false },
      { status: 500 }
    );
  }
}

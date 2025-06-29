import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Basic health check
    const healthCheck: {
      status: string;
      timestamp: string;
      version: string;
      environment: string;
      database?: string;
      redis?: string;
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Check database connectivity
    try {
      await db.execute(sql`SELECT 1`);
      healthCheck.database = 'connected';
    } catch (error) {
      healthCheck.database = 'disconnected';
      healthCheck.status = 'unhealthy';
    }

    // Check Redis connectivity (if available)
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        // This would need a Redis client - for now just mark as unknown
        healthCheck.redis = 'unknown';
      }
    } catch (error) {
      healthCheck.redis = 'disconnected';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
      },
      { status: 503 }
    );
  }
}

import dotenv from 'dotenv';
import { emailWorkerManager } from './workers';
import { emailQueueManager } from './queue-manager';
import './api'; // Start the HTTP API

// Load environment variables
dotenv.config();

/**
 * PlaneMail Queue Service
 * 
 * A standalone BullMQ service for processing email jobs.
 * This service can be deployed separately from the main Next.js application.
 */
class QueueService {
  private isShuttingDown = false;

  async start() {
    console.log('🚀 Starting PlaneMail Queue Service...');
    
    try {
      // Check Redis connection
      await this.checkRedisConnection();
      
      // Start workers
      await emailWorkerManager.startWorkers();
      
      // Display initial stats
      const stats = await emailQueueManager.getQueueStats();
      console.log('📊 Initial Queue Stats:');
      console.log(`   📧 Newsletter: ${stats.newsletter.waiting} waiting, ${stats.newsletter.active} active`);
      console.log(`   ⚡ Transactional: ${stats.transactional.waiting} waiting, ${stats.transactional.active} active`);
      console.log(`   📦 Bulk: ${stats.bulk.waiting} waiting, ${stats.bulk.active} active`);
      
      console.log('✅ Queue Service started successfully!');
      console.log('🔍 Monitor queues at: http://localhost:3000/admin/queues');
      console.log('⏹️  Press Ctrl+C to stop service');

      // Set up graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start Queue Service:', error);
      process.exit(1);
    }
  }

  private async checkRedisConnection() {
    try {
      const { redis } = await import('./redis');
      await redis.ping();
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`\n🛑 Received ${signal}, shutting down Queue Service gracefully...`);
      
      try {
        // Stop accepting new jobs and wait for current jobs to complete
        await emailWorkerManager.stopWorkers();
        
        // Close queue connections
        await emailQueueManager.close();
        
        console.log('✅ Queue Service stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      console.error('💥 Unhandled Rejection:', reason);
      shutdown('unhandledRejection');
    });
  }

  async getHealthStatus() {
    try {
      const [stats, workerStatus] = await Promise.all([
        emailQueueManager.getQueueStats(),
        emailWorkerManager.getWorkerStatus(),
      ]);

      const totalActive = stats.total.active;
      const totalFailed = stats.total.failed;
      const totalWaiting = stats.total.waiting;

      let status = 'healthy';
      const issues = [];

      // Check for high failure rate
      if (totalFailed > 10) {
        status = 'warning';
        issues.push(`High number of failed jobs: ${totalFailed}`);
      }

      // Check for stalled queues
      if (totalWaiting > 100 && totalActive === 0) {
        status = 'warning';
        issues.push(`Queue appears stalled: ${totalWaiting} waiting, ${totalActive} active`);
      }

      // Check if workers are running
      if (!workerStatus.isStarted) {
        status = 'critical';
        issues.push('Workers are not running');
      }

      return {
        status,
        issues,
        metrics: {
          totalActive,
          totalFailed,
          totalWaiting,
          totalCompleted: stats.total.completed,
        },
        workers: workerStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'critical',
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metrics: null,
        workers: null,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create and export service instance
export const queueService = new QueueService();

// Auto-start if this file is run directly
if (require.main === module) {
  queueService.start();
}

// Export queue manager and worker manager for API usage
export { emailQueueManager, emailWorkerManager };

import express from 'express';
import cors from 'cors';
import { emailQueueManager } from './queue-manager';
import { EmailJobData, EmailJobResponse } from '@planemail/shared';

const app = express();
const PORT = process.env.QUEUE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const stats = await emailQueueManager.getQueueStats();

    res.json({
      status: 'healthy',
      queues: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add newsletter job
app.post('/api/queue/newsletter', async (req, res) => {
  try {
    const jobData: EmailJobData = req.body;
    
    const job = await emailQueueManager.addNewsletterEmail(jobData, { priority: 3 });
    
    const response: EmailJobResponse = {
      success: true,
      jobId: job.id!, // Use the actual BullMQ job ID
      message: 'Newsletter job added to queue'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error adding newsletter job:', error);
    res.status(500).json({
      success: false,
      jobId: null,
      message: error instanceof Error ? error.message : 'Failed to add job'
    });
  }
});

// Add transactional job
app.post('/api/queue/transactional', async (req, res) => {
  try {
    const jobData: EmailJobData = req.body;
    
    const job = await emailQueueManager.addTransactionalEmail(jobData, { priority: 1 });
    
    const response: EmailJobResponse = {
      success: true,
      jobId: job.id!, // Use the actual BullMQ job ID
      message: 'Transactional job added to queue'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error adding transactional job:', error);
    res.status(500).json({
      success: false,
      jobId: null,
      message: error instanceof Error ? error.message : 'Failed to add job'
    });
  }
});

// Add bulk job
app.post('/api/queue/bulk', async (req, res) => {
  try {
    const jobData: EmailJobData = req.body;
    
    const job = await emailQueueManager.addBulkEmail(jobData, { priority: 5 });
    
    const response: EmailJobResponse = {
      success: true,
      jobId: job.id!, // Use the actual BullMQ job ID
      message: 'Bulk job added to queue'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error adding bulk job:', error);
    res.status(500).json({
      success: false,
      jobId: null,
      message: error instanceof Error ? error.message : 'Failed to add job'
    });
  }
});

// Get job status
app.get('/api/queue/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const result = await emailQueueManager.getJob(jobId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    const { job, queueName } = result;
    
    res.json({
      success: true,
      jobId,
      queueName,
      status: await job.getState(),
      progress: job.progress,
      data: job.data,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnValue: job.returnvalue
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get job status'
    });
  }
});

// Get queue statistics
app.get('/api/queue/stats', async (req, res) => {
  try {
    const stats = await emailQueueManager.getQueueStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get queue stats'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Queue service HTTP API listening on port ${PORT}`);
});

export { app };

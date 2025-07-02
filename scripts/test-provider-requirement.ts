/**
 * Test script to verify that email sending now requires real provider configuration
 * and fails properly when no provider is configured
 */

import axios from 'axios';

const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'http://localhost:3002';

interface TestEmailJobData {
  sendingProviderId: 'brevo' | 'mailgun' | 'amazon_ses';
  recipients: Array<{ email: string; name?: string; }>;
  subject: string;
  fromName: string;
  fromEmail: string;
  htmlContent: string;
  providerConfig: Record<string, any>;
}

async function testWithoutProviderConfig() {
  console.log('🧪 Testing email sending WITHOUT provider configuration...');
  
  const jobData: TestEmailJobData = {
    sendingProviderId: 'brevo',
    recipients: [
      { email: 'test@example.com', name: 'Test User' }
    ],
    subject: 'Test Email - Should Fail',
    fromName: 'PlaneMail Test',
    fromEmail: 'test@planemail.com',
    htmlContent: '<p>This email should fail to send due to missing provider config.</p>',
    providerConfig: {} // Empty config - should cause failure
  };

  try {
    const response = await axios.post(`${QUEUE_SERVICE_URL}/api/queue/newsletter`, jobData);
    console.log('❌ UNEXPECTED: Job was accepted with empty provider config');
    console.log('Response:', response.data);
    
    // Wait a moment and check job status
    if (response.data.jobId) {
      console.log('🔍 Checking job status...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await axios.get(`${QUEUE_SERVICE_URL}/api/queue/status/${response.data.jobId}`);
        console.log('Job status:', statusResponse.data);
      } catch (statusError) {
        console.log('Failed to get job status:', statusError);
      }
    }
  } catch (error: any) {
    if (error.response) {
      console.log('✅ EXPECTED: Job failed with missing provider config');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

async function testWithMissingSpecificProvider() {
  console.log('\n🧪 Testing email sending with provider config but WRONG provider...');
  
  const jobData: TestEmailJobData = {
    sendingProviderId: 'brevo', // Requesting Brevo
    recipients: [
      { email: 'test@example.com', name: 'Test User' }
    ],
    subject: 'Test Email - Should Fail',
    fromName: 'PlaneMail Test',
    fromEmail: 'test@planemail.com',
    htmlContent: '<p>This email should fail due to missing Brevo config.</p>',
    providerConfig: {
      // Only has mailgun config, but requesting brevo
      mailgun: {
        apiKey: 'test-key',
        domain: 'test.com'
      }
    }
  };

  try {
    const response = await axios.post(`${QUEUE_SERVICE_URL}/api/queue/newsletter`, jobData);
    console.log('❌ UNEXPECTED: Job was accepted with wrong provider config');
    console.log('Response:', response.data);
    
    // Wait a moment and check job status
    if (response.data.jobId) {
      console.log('🔍 Checking job status...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await axios.get(`${QUEUE_SERVICE_URL}/api/queue/status/${response.data.jobId}`);
        console.log('Job status:', statusResponse.data);
      } catch (statusError) {
        console.log('Failed to get job status:', statusError);
      }
    }
  } catch (error: any) {
    if (error.response) {
      console.log('✅ EXPECTED: Job failed with missing specific provider config');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Testing Provider Configuration Requirements');
  console.log('============================================');
  
  // Check if queue service is running
  try {
    await axios.get(`${QUEUE_SERVICE_URL}/health`);
    console.log('✅ Queue service is running');
  } catch (error) {
    console.log('❌ Queue service is not running at', QUEUE_SERVICE_URL);
    console.log('Please start the queue service first:');
    console.log('cd packages/queue-service && npm run dev');
    return;
  }
  
  await testWithoutProviderConfig();
  await testWithMissingSpecificProvider();
  
  console.log('\n🎯 Summary:');
  console.log('- Email jobs should FAIL when no provider config is provided');
  console.log('- Email jobs should FAIL when the requested provider is not configured');
  console.log('- No simulation or fallback should occur');
  console.log('- Clear error messages should be returned');
}

runTests().catch(console.error);

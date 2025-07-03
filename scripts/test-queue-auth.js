#!/usr/bin/env node

/**
 * Test script to verify queue service authentication
 */

const axios = require('axios');

const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'http://localhost:3002';
const QUEUE_API_KEY = process.env.QUEUE_API_KEY || 'queue_api_key_12345';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal_api_key_67890';

async function testAuthentication() {
  console.log('Testing Queue Service Authentication...\n');

  // Test 1: Health check (no auth required)
  console.log('1. Testing health check (no auth)...');
  try {
    const response = await axios.get(`${QUEUE_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', response.data.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Newsletter endpoint without auth (should fail)
  console.log('\n2. Testing newsletter endpoint without auth (should fail)...');
  try {
    const response = await axios.post(`${QUEUE_SERVICE_URL}/api/queue/newsletter`, {
      userId: 'test',
      subject: 'Test',
      htmlContent: '<p>Test</p>'
    });
    console.log('❌ Should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Wrong error type:', error.message);
    }
  }

  // Test 3: Newsletter endpoint with wrong auth (should fail)
  console.log('\n3. Testing newsletter endpoint with wrong auth (should fail)...');
  try {
    const response = await axios.post(`${QUEUE_SERVICE_URL}/api/queue/newsletter`, {
      userId: 'test',
      subject: 'Test',
      htmlContent: '<p>Test</p>'
    }, {
      headers: {
        'Authorization': 'Bearer wrong_key'
      }
    });
    console.log('❌ Should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Correctly rejected wrong auth key');
    } else {
      console.log('❌ Wrong error type:', error.message);
    }
  }

  // Test 4: Newsletter endpoint with correct auth (should work if all fields provided)
  console.log('\n4. Testing newsletter endpoint with correct auth...');
  try {
    const response = await axios.post(`${QUEUE_SERVICE_URL}/api/queue/newsletter`, {
      userId: 'test',
      subject: 'Test',
      htmlContent: '<p>Test</p>'
    }, {
      headers: {
        'Authorization': `Bearer ${QUEUE_API_KEY}`
      }
    });
    console.log('✅ Newsletter endpoint accessible with correct auth');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly validated request fields (missing required fields)');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 5: Stats endpoint with public key (should fail)
  console.log('\n5. Testing stats endpoint with public key (should fail)...');
  try {
    const response = await axios.get(`${QUEUE_SERVICE_URL}/api/queue/stats`, {
      headers: {
        'Authorization': `Bearer ${QUEUE_API_KEY}`
      }
    });
    console.log('❌ Should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Correctly rejected public key for internal endpoint');
    } else {
      console.log('❌ Wrong error type:', error.message);
    }
  }

  // Test 6: Stats endpoint with internal key (should work)
  console.log('\n6. Testing stats endpoint with internal key...');
  try {
    const response = await axios.get(`${QUEUE_SERVICE_URL}/api/queue/stats`, {
      headers: {
        'Authorization': `Bearer ${INTERNAL_API_KEY}`
      }
    });
    console.log('✅ Stats endpoint accessible with internal key');
  } catch (error) {
    console.log('❌ Stats endpoint failed:', error.message);
  }

  console.log('\n🔐 Authentication test completed!');
}

if (require.main === module) {
  testAuthentication().catch(console.error);
}

module.exports = { testAuthentication };

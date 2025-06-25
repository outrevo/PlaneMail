import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_API_ENV = process.env.PADDLE_API_ENV || 'sandbox';
const PADDLE_API_BASE_URL = PADDLE_API_ENV === 'sandbox' 
  ? 'https://sandbox-api.paddle.com' 
  : 'https://api.paddle.com';

async function paddleApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: object) {
  const url = `${PADDLE_API_BASE_URL}/${endpoint}`;
  const options: any = {
    method,
    headers: {
      'Authorization': `Bearer ${PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json() as any;

    if (!response.ok) {
      console.error(`Paddle API Error (${response.status}):`, responseData.error || responseData);
      throw new Error(`Paddle API request failed: ${response.statusText}`);
    }
    return responseData;
  } catch (error) {
    console.error('Error making Paddle API request:', error);
    throw error;
  }
}

async function debugPaddleConfiguration() {
  console.log(`🔍 Debugging Paddle Configuration (${PADDLE_API_ENV})\n`);

  try {
    // Get all products
    const productsResponse = await paddleApiRequest('products?limit=100');
    console.log(`📦 Found ${productsResponse.data.length} products:`);
    
    for (const product of productsResponse.data) {
      console.log(`  - ${product.name} (${product.id})`);
      console.log(`    Status: ${product.status}`);
      console.log(`    Type: ${product.type}`);
      console.log(`    Tax Category: ${product.tax_category}`);
    }

    console.log('\n💰 Price Details:');
    
    // Get all prices
    const pricesResponse = await paddleApiRequest('prices?limit=100');
    
    for (const price of pricesResponse.data) {
      const product = productsResponse.data.find((p: any) => p.id === price.product_id);
      const productName = product?.name || 'Unknown Product';
      
      console.log(`\n  📊 ${productName} - ${price.id}`);
      console.log(`    Amount: ${price.unit_price?.currency_code} ${(parseInt(price.unit_price?.amount || '0') / 100).toFixed(2)}`);
      console.log(`    Billing: ${price.billing_cycle?.frequency} ${price.billing_cycle?.interval}(s)`);
      
      if (price.trial_period) {
        console.log(`    ✅ Trial: ${price.trial_period.frequency} ${price.trial_period.interval}(s)`);
      } else {
        console.log(`    ❌ No trial period configured`);
      }
      
      // Check collection mode
      if (price.collection_mode) {
        console.log(`    Collection Mode: ${price.collection_mode}`);
        if (price.collection_mode === 'manual') {
          console.log(`    ✅ Manual collection (supports free trials)`);
        } else {
          console.log(`    ⚠️  Automatic collection (may require payment method)`);
        }
      } else {
        console.log(`    ⚠️  Collection mode not specified`);
      }
      
      console.log(`    Status: ${price.status}`);
    }

    // Check environment variables
    console.log('\n🔧 Environment Configuration:');
    console.log(`  API Environment: ${PADDLE_API_ENV}`);
    console.log(`  API Key: ${PADDLE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Client Token: ${process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Webhook Secret: ${process.env.PADDLE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`);
    
    console.log('\n📱 Price IDs in Environment:');
    console.log(`  Hosted: ${process.env.NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID || '❌ Missing'}`);
    console.log(`  Pro: ${process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || '❌ Missing'}`);
    console.log(`  Enterprise: ${process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID || '❌ Missing'}`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    const hasTrialIssues = pricesResponse.data.some((price: any) => 
      !price.trial_period || price.collection_mode !== 'manual'
    );
    
    if (hasTrialIssues) {
      console.log('  ⚠️  Some prices may not support true free trials');
      console.log('     Consider running: tsx scripts/setup-paddle.ts setup');
    } else {
      console.log('  ✅ Configuration looks good for free trials');
    }

    if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      console.log('  ❌ Add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN to .env.local');
    }

    if (!process.env.PADDLE_WEBHOOK_SECRET) {
      console.log('  ❌ Add PADDLE_WEBHOOK_SECRET to .env.local');
    }

  } catch (error) {
    console.error('Debug failed:', error);
    process.exit(1);
  }
}

async function testCheckoutFlow() {
  console.log('🧪 Testing Checkout Flow\n');
  
  try {
    const pricesResponse = await paddleApiRequest('prices?limit=100');
    const trialPrices = pricesResponse.data.filter((price: any) => price.trial_period);
    
    if (trialPrices.length === 0) {
      console.log('❌ No prices with trial periods found');
      return;
    }

    console.log(`✅ Found ${trialPrices.length} prices with trials:`);
    
    for (const price of trialPrices) {
      console.log(`  - ${price.id}: ${price.trial_period.frequency} ${price.trial_period.interval} trial`);
    }

    console.log('\n💳 Checkout URLs for testing:');
    for (const price of trialPrices.slice(0, 3)) { // Show first 3
      const checkoutUrl = `${PADDLE_API_BASE_URL.replace('api', 'checkout')}/custom?price=${price.id}`;
      console.log(`  ${price.id}: ${checkoutUrl}`);
    }

  } catch (error) {
    console.error('Test checkout flow failed:', error);
  }
}

// Script execution
const command = process.argv[2];

async function main() {
  if (!PADDLE_API_KEY) {
    console.error("❌ PADDLE_API_KEY is not set in your .env.local file");
    console.log("\nAdd to .env.local:");
    console.log("PADDLE_API_ENV=sandbox # or production");
    console.log("PADDLE_API_KEY=your_paddle_api_key_here");
    return;
  }

  switch (command) {
    case 'config':
      await debugPaddleConfiguration();
      break;
    case 'test':
      await testCheckoutFlow();
      break;
    case 'all':
      await debugPaddleConfiguration();
      console.log('\n' + '='.repeat(60) + '\n');
      await testCheckoutFlow();
      break;
    default:
      console.log('Usage: tsx scripts/debug-paddle.ts <command>');
      console.log('\nAvailable commands:');
      console.log('  config  - Debug Paddle configuration and environment');
      console.log('  test    - Test checkout flow setup');
      console.log('  all     - Run all debug checks');
  }
}

main().catch(err => {
  console.error("Script execution failed:", err);
});

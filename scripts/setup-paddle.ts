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

async function createProduct(name: string, description: string) {
  console.log(`Creating product: ${name}`);
  
  const productData = {
    name,
    description,
    type: 'standard',
    tax_category: 'saas',
    image_url: null,
  };

  try {
    const response = await paddleApiRequest('products', 'POST', productData);
    console.log(`✓ Product created: ${response.data.id} - ${name}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to create product: ${name}`);
    throw error;
  }
}

async function createPrice(productId: string, amount: string, currency: string = 'USD', interval: string = 'month', trialDays: number = 14) {
  console.log(`Creating price for product ${productId}: $${amount}/${interval} with ${trialDays}-day trial`);
  
  const priceData = {
    product_id: productId,
    name: `Monthly subscription`,
    description: `Monthly subscription with ${trialDays}-day free trial`,
    billing_cycle: {
      interval,
      frequency: 1,
    },
    trial_period: {
      interval: 'day',
      frequency: trialDays,
    },
    unit_price: {
      amount: (parseFloat(amount) * 100).toString(), // Convert to cents
      currency_code: currency,
    },
    quantity: {
      minimum: 1,
      maximum: 1,
    },
  };

  try {
    const response = await paddleApiRequest('prices', 'POST', priceData);
    console.log(`✓ Price created: ${response.data.id} - $${amount}/${interval}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to create price for product ${productId}`);
    throw error;
  }
}

async function setupPlaneMail() {
  console.log('Setting up PlaneMail products and prices in Paddle...\n');

  try {
    // Create products
    const hostedProduct = await createProduct(
      'PlaneMail Hosted',
      'Managed hosting for PlaneMail newsletter platform'
    );

    const proProduct = await createProduct(
      'PlaneMail Pro',
      'Unlimited scale newsletter platform with advanced features'
    );

    const enterpriseProduct = await createProduct(
      'PlaneMail Enterprise',
      'White-label newsletter platform with custom integrations'
    );

    console.log('\n');

    // Create prices with 14-day trials
    const hostedPrice = await createPrice(hostedProduct.id, '19.00', 'USD', 'month', 14);
    const proPrice = await createPrice(proProduct.id, '99.00', 'USD', 'month', 14);
    
    // Enterprise typically doesn't have a fixed price, but we'll create one for demo
    const enterprisePrice = await createPrice(enterpriseProduct.id, '299.00', 'USD', 'month', 14);

    console.log('\n✅ Setup complete! Add these to your .env.local file:');
    console.log('');
    console.log(`NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID=${hostedPrice.id}`);
    console.log(`NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=${proPrice.id}`);
    console.log(`NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID=${enterprisePrice.id}`);
    console.log('');
    console.log(`PADDLE_HOSTED_PRICE_ID=${hostedPrice.id}`);
    console.log(`PADDLE_PRO_PRICE_ID=${proPrice.id}`);
    console.log(`PADDLE_ENTERPRISE_PRICE_ID=${enterprisePrice.id}`);
    console.log('');
    console.log('Products created:');
    console.log(`- Hosted: ${hostedProduct.id}`);
    console.log(`- Pro: ${proProduct.id}`);
    console.log(`- Enterprise: ${enterpriseProduct.id}`);

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

async function listProducts() {
  console.log('Fetching products from Paddle...');
  try {
    const productsResponse = await paddleApiRequest('products?limit=100');
    
    console.log(`Found ${productsResponse.data.length} products:`);
    productsResponse.data.forEach((product: any) => {
      console.log(`- ID: ${product.id}, Name: "${product.name}", Type: ${product.type}, Status: ${product.status}`);
    });

    // Also list prices
    console.log('\nFetching prices...');
    const pricesResponse = await paddleApiRequest('prices?limit=100');
    
    console.log(`Found ${pricesResponse.data.length} prices:`);
    pricesResponse.data.forEach((price: any) => {
      const amount = price.unit_price ? (parseInt(price.unit_price.amount) / 100).toFixed(2) : 'N/A';
      const currency = price.unit_price?.currency_code || 'N/A';
      const trial = price.trial_period ? `${price.trial_period.frequency} ${price.trial_period.interval} trial` : 'No trial';
      console.log(`- ID: ${price.id}, Amount: ${currency} ${amount}, Product: ${price.product_id}, Trial: ${trial}`);
    });

  } catch (error) {
    console.error('Failed to list products and prices.');
  }
}

// Script execution
const command = process.argv[2];

async function main() {
  if (!PADDLE_API_KEY) {
    console.error("PADDLE_API_KEY is not set in your .env.local file. Please add it.");
    console.log("Example .env.local content:");
    console.log("PADDLE_API_ENV=sandbox # or production");
    console.log("PADDLE_API_KEY=your_paddle_api_key_here");
    return;
  }

  console.log(`Using Paddle ${PADDLE_API_ENV} environment\n`);

  switch (command) {
    case 'setup':
      await setupPlaneMail();
      break;
    case 'listProducts':
      await listProducts();
      break;
    default:
      console.log('Usage: tsx scripts/setup-paddle.ts <command>');
      console.log('Available commands:');
      console.log('  setup         - Create PlaneMail products and prices with trials');
      console.log('  listProducts  - List all products and prices');
  }
}

main().catch(err => {
  console.error("Script execution failed:", err);
});

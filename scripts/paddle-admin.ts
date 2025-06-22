
// scripts/paddle-admin.ts
import * as dotenv from 'dotenv';
import fetch from 'node-fetch'; // Using node-fetch for Node.js environment

// Load environment variables from .env file in the project root
dotenv.config({ path: '.env.local' });

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_API_ENV = process.env.PADDLE_API_ENV || 'sandbox'; // 'production' or 'sandbox'

const PADDLE_API_BASE_URL_PRODUCTION = 'https://api.paddle.com';
const PADDLE_API_BASE_URL_SANDBOX = 'https://api.sandbox.paddle.com';

const PADDLE_API_BASE_URL = PADDLE_API_ENV === 'sandbox' ? PADDLE_API_BASE_URL_SANDBOX : PADDLE_API_BASE_URL_PRODUCTION;

if (!PADDLE_API_KEY || (PADDLE_API_ENV !== 'production' && PADDLE_API_ENV !== 'sandbox')) {
  console.error('Error: PADDLE_API_KEY or PADDLE_API_ENV is not set correctly in your .env.local file.');
  console.error('Error: PADDLE_API_KEY is not set in your .env.local file.');
  process.exit(1);
}

interface PaddleProduct {
  id: string;
  name: string;
  description: string | null;
  type: string; // 'standard' | 'subscription'
  custom_data: Record<string, any> | null;
  image_url: string | null;
  tax_category: string;
  status: string; // 'active' | 'archived'
  created_at: string;
  // ... other fields as per Paddle API documentation
}

interface PaddleListProductsResponse {
  data: PaddleProduct[];
  meta: {
    request_id: string;
    pagination: {
      per_page: number;
      next: string | null;
      estimated_total: number;
    };
  };
}

async function paddleApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: object) {
  const url = `${PADDLE_API_BASE_URL}/${endpoint}`;
  const options: RequestInit = {
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
    const response = await fetch(url, options as any); // Cast to any for node-fetch compatibility
    const responseData = await response.json() as any; // Use 'any' for flexibility with Paddle's varying responses

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

// Function to list all products
async function listProducts() {
  console.log('Fetching products from Paddle...');
  try {
    // For Paddle Billing, the endpoint is /products
    // For Paddle Classic, it might be different, check their docs if you're using Classic.
    // This script assumes Paddle Billing API.
    const productsResponse: PaddleListProductsResponse = await paddleApiRequest('products?limit=100'); // Adjust limit as needed
    
    console.log(`Found ${productsResponse.data.length} products (up to ${productsResponse.meta.pagination.per_page} per page, estimated total ${productsResponse.meta.pagination.estimated_total}):`);
    productsResponse.data.forEach(product => {
      console.log(`- ID: ${product.id}, Name: "${product.name}", Type: ${product.type}, Status: ${product.status}`);
      // You can print more details if needed:
      // console.log(JSON.stringify(product, null, 2));
    });

    if (productsResponse.meta.pagination.next) {
        console.log(`\nThere are more products. To fetch next page, use URL: ${productsResponse.meta.pagination.next}`);
    }

  } catch (error) {
    console.error('Failed to list products.');
  }
}

// --- Script Execution ---
const command = process.argv[2];

async function main() {
  if (!PADDLE_API_KEY || (PADDLE_API_ENV !== 'production' && PADDLE_API_ENV !== 'sandbox')) {
    console.error("PADDLE_API_KEY and PADDLE_API_ENV are not set correctly in your .env.local file. Please add them.");
    console.log("Example .env.local content for this script:");
    console.log("PADDLE_API_ENV=production # or sandbox");
    console.log("PADDLE_API_KEY=your_paddle_api_key_here");
    return;
  }

  if (command === 'listProducts') {
    await listProducts();
  } else {
    console.log('Usage: tsx scripts/paddle-admin.ts <command>');
    console.log('Available commands:');
    console.log('  listProducts   - Lists products from your Paddle account');
  }
}

main().catch(err => {
  console.error("Script execution failed:", err);
});

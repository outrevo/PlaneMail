import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { pricingPlans } from '../apps/web/src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const plans = [
  {
    name: 'Personal',
    slug: 'personal',
    description: 'Perfect for personal projects and individual creators.',
    price: 0, // Free
    billingInterval: 'monthly',
    
    // Limits
    maxSubscribers: 1000,
    maxPostsPerMonth: 10,
    maxCustomDomains: 0,
    maxTeamMembers: 1, // Personal only
    maxIntegrations: 1,
    maxApiKeys: 2,
    maxWebhooks: 2,
    maxImageUploads: 50,
    maxEmailsPerMonth: 10000,
    
    // Features (restricted for free plan)
    allowOrganizations: false,
    allowAdvancedAnalytics: false,
    allowCustomDomains: false,
    allowApiAccess: false,
    
    features: [
      'basic_templates',
      'email_support',
      'web_publishing',
      'basic_analytics',
      'community_support'
    ],
    
    paddleProductId: 'free', // Special case for free plan
    paddlePriceId: 'free', // Special case for free plan
    
    isActive: true,
    isDefault: true, // Default plan for new users
    sortOrder: 1,
  },
  {
    name: 'Hosted',
    slug: 'hosted',
    description: 'For professionals and growing businesses with team collaboration.',
    price: 1900, // $19.00
    billingInterval: 'monthly',
    
    // Limits
    maxSubscribers: 10000,
    maxPostsPerMonth: 100,
    maxCustomDomains: 3,
    maxTeamMembers: 5,
    maxIntegrations: 5,
    maxApiKeys: 10,
    maxWebhooks: 10,
    maxImageUploads: 500,
    maxEmailsPerMonth: 100000,
    
    // Features (organizations enabled)
    allowOrganizations: true,
    allowAdvancedAnalytics: true,
    allowCustomDomains: true,
    allowApiAccess: true,
    
    features: [
      'organizations',
      'team_collaboration',
      'advanced_analytics',
      'custom_domains',
      'priority_support',
      'premium_templates',
      'ab_testing',
      'api_access'
    ],
    
    paddleProductId: process.env.PADDLE_HOSTED_PRODUCT_ID || '',
    paddlePriceId: process.env.PADDLE_HOSTED_PRICE_ID || '',
    
    isActive: true,
    isDefault: false,
    sortOrder: 2,
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Scale without limits with advanced team features.',
    price: 9900, // $99.00
    billingInterval: 'monthly',
    
    // Limits (unlimited)
    maxSubscribers: -1, // -1 means unlimited
    maxPostsPerMonth: -1,
    maxCustomDomains: -1,
    maxTeamMembers: -1,
    maxIntegrations: -1,
    maxApiKeys: -1,
    maxWebhooks: -1,
    maxImageUploads: -1,
    maxEmailsPerMonth: -1,
    
    // Features (all enabled)
    allowOrganizations: true,
    allowAdvancedAnalytics: true,
    allowCustomDomains: true,
    allowApiAccess: true,
    
    features: [
      'unlimited_everything',
      'advanced_team_permissions',
      'sso_integration',
      'advanced_integrations',
      'custom_webhooks',
      'dedicated_support',
      'sla_guarantees',
      'white_label_options'
    ],
    
    paddleProductId: process.env.PADDLE_PRO_PRODUCT_ID || '',
    paddlePriceId: process.env.PADDLE_PRO_PRICE_ID || '',
    
    isActive: true,
    isDefault: false,
    sortOrder: 3,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Custom solutions for large organizations.',
    price: 0, // Custom pricing
    billingInterval: 'monthly',
    
    // Limits (unlimited)
    maxSubscribers: -1,
    maxPostsPerMonth: -1,
    maxCustomDomains: -1,
    maxTeamMembers: -1,
    maxIntegrations: -1,
    maxApiKeys: -1,
    maxWebhooks: -1,
    maxImageUploads: -1,
    maxEmailsPerMonth: -1,
    
    // Features (all enabled)
    allowOrganizations: true,
    allowAdvancedAnalytics: true,
    allowCustomDomains: true,
    allowApiAccess: true,
    
    features: [
      'white_label_solution',
      'custom_integrations',
      'dedicated_support',
      'sla_guarantees',
      'custom_development',
      'training_onboarding',
      'priority_feature_requests',
      'multi_tenant_support'
    ],
    
    paddleProductId: process.env.PADDLE_ENTERPRISE_PRODUCT_ID || '',
    paddlePriceId: process.env.PADDLE_ENTERPRISE_PRICE_ID || '',
    
    isActive: true,
    isDefault: false,
    sortOrder: 4,
  },
];

async function seedPricingPlans() {
  try {
    console.log('Seeding pricing plans...');
    
    // Clear existing plans
    await db.delete(pricingPlans);
    
    // Insert new plans
    await db.insert(pricingPlans).values(plans);
    
    console.log('✅ Pricing plans seeded successfully!');
    console.log(`Created ${plans.length} pricing plans:`);
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price / 100}/month`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding pricing plans:', error);
  } finally {
    await pool.end();
  }
}

seedPricingPlans();

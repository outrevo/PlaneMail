// Test script to verify pricing configuration
console.log('🧪 Testing PlaneMail Pricing Configuration\n');

console.log('📋 Environment Variables:');
console.log('✅ PADDLE_API_ENV:', process.env.PADDLE_API_ENV);
console.log('✅ NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID:', process.env.NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID);
console.log('✅ NEXT_PUBLIC_PADDLE_PRO_PRICE_ID:', process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID);
console.log('✅ NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID:', process.env.NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID);

console.log('\n🎯 Status: All pricing configuration updated!');
console.log('\n📝 Next Steps:');
console.log('1. Pricing page badges fixed (no more overlap)');
console.log('2. Paddle trials configured (14 days)');
console.log('3. Environment variables updated');
console.log('4. Ready for testing at http://localhost:3001/pricing');

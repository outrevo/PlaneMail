# PlaneMail - Render.com Deployment Guide

PlaneMail is a white-labeled newsletter platform that can be easily deployed on Render.com with custom domain support.

## 🚀 One-Click Deploy to Render

### Option 1: Blueprint Deployment (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. **Run the deployment script** (optional pre-checks):
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Deploy via Render Blueprint**:
   - Click the "Deploy to Render" button above
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`
   - Configure environment variables in the Render dashboard (see below)
   - Click "Apply"

The `render.yaml` file automatically configures:
- **Web Service**: Next.js app with automatic URL configuration
- **PostgreSQL Database**: Automatically connected via `DATABASE_URL`
- **Redis**: For background queues, connected via `REDIS_URL`
- **Queue Service**: Background job processing (optional)

### Option 2: Manual Setup

1. **Create a new Web Service** on [Render.com](https://render.com)
   - Connect your GitHub repository
   - Choose "Node.js" environment
   - Build Command: `cd apps/web && npm install && npm run build`
   - Start Command: `cd apps/web && npm start`

2. **Create a PostgreSQL Database**:
   - Name: `planemail-db`
   - This will auto-generate `DATABASE_URL`

3. **Create a Redis Instance**:
   - Name: `planemail-redis`
   - This will auto-generate `REDIS_URL`

4. **Add Environment Variables** in Render dashboard:
   ```bash
   # Authentication (Clerk)
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   
   # Payments (Paddle)
   PADDLE_API_KEY=your_paddle_api_key
   PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
   PADDLE_API_ENV=sandbox
   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token
   NEXT_PUBLIC_PADDLE_HOSTED_PRICE_ID=your_hosted_price_id
   NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=your_pro_price_id
   NEXT_PUBLIC_PADDLE_ENTERPRISE_PRICE_ID=your_enterprise_price_id
   PADDLE_HOSTED_PRICE_ID=your_hosted_price_id
   PADDLE_PRO_PRICE_ID=your_pro_price_id
   PADDLE_ENTERPRISE_PRICE_ID=your_enterprise_price_id
   
   # Optional Email Services
   BREVO_API_KEY=your_brevo_key
   MAILGUN_API_KEY=your_mailgun_key
   
   # Optional AWS (for file uploads)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   
   # Optional Google AI
   GOOGLE_API_KEY=your_google_api_key
   ```

3. **Database & Services Setup** (Auto-configured with Blueprint):
   - PostgreSQL database (automatically provisioned)
   - Redis for background jobs (automatically provisioned)

## Custom Domain Setup

1. **In your PlaneMail dashboard**: 
   - Go to Settings > Site > Domains
   - Add your custom domain
   - Get the CNAME record instructions

2. **In your DNS provider**:
   - Add a CNAME record pointing your domain to your Render app URL

3. **In Render dashboard**:
   - Go to Settings > Custom Domains
   - Add your custom domain
   - Render will automatically provision SSL certificates

## Features

- ✅ **Public post pages** (`/p/[slug]`) with customizable branding
- ✅ **Archive page** (`/archive`) showing all published posts
- ✅ **Custom domain support** with DNS verification
- ✅ **White-labeling** with custom colors, logos, and styling
- ✅ **Newsletter signup** forms on public pages
- ✅ **Share buttons** for social media
- ✅ **SEO optimization** with dynamic meta tags
- ✅ **Mobile responsive** design

## Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd planemail
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## Architecture

- **Frontend**: Next.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Payments**: Paddle
- **Background Jobs**: Redis + Bull Queue
- **Styling**: Tailwind CSS + shadcn/ui

## License

MIT License - feel free to use this for your own projects!

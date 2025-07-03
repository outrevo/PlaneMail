# PlaneMail

The open-source newsletter platform with white-labeling support. Precision Engineered Communication.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/outrevo/planemail)

---

## ✨ Features

- **📧 Drag & Drop Email Editor**: Create beautiful emails with a modern, block-based editor
- **🌐 White-Labeling**: Custom domains, branding, and public newsletter pages
- **📄 Public Post Pages**: SEO-optimized pages at `/p/[slug]` for each newsletter
- **🎨 Custom Branding**: Customize colors, logos, and styling for your brand
- **📬 BYOP (Bring Your Own Provider)**: Connect AWS SES, Mailgun, Brevo, or any SMTP provider
- **🔒 Full Data Ownership**: Self-host or deploy on Render.com. Your data, your rules
- **🚀 API-First**: Modern REST API for integration and automation
- **📊 Subscriber Management**: Segmentation, import/export, and analytics
- **📝 Templates**: Save, reuse, and share email templates
- **📈 Analytics**: Track sends, opens, clicks, and more (with privacy in mind)
- **⚡ Microservices Architecture**: Scalable queue service and web app separation

## 🏗️ Architecture

PlaneMail uses a modern microservices architecture built with Turborepo:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │  Queue Service  │    │     Redis       │
│  (Next.js)      │◄──►│   (BullMQ)      │◄──►│   (Storage)     │
│  Port 3000      │    │  Port 3001      │    │   Port 6379     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Web App** (`apps/web`): Next.js frontend and API routes
- **Queue Service** (`packages/queue-service`): Standalone email processing service 
- **Shared Package** (`packages/shared`): Common types and utilities
- **Redis**: Queue storage and job management

## 🚀 Quick Deploy to Render

**One-click deploy** to Render.com with PostgreSQL and Redis included:

1. Click the "Deploy to Render" button above
2. Configure your environment variables
3. Add your custom domain in Settings

[📖 **Full Deployment Guide →**](RENDER_DEPLOYMENT.md)

## 🛠️ Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- **Queue**: [BullMQ](https://docs.bullmq.io/) + Redis
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth**: [Clerk](https://clerk.com/)
- **UI**: [Radix UI](https://www.radix-ui.com/)

## 🏃‍♂️ Local Development

### Prerequisites

- Node.js 18+
- Redis server
- PostgreSQL database

### Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/outrevo/PlaneMail.git
   cd PlaneMail
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Redis:**
   ```bash
   # macOS with Homebrew
   brew services start redis
   
   # Or with Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and other secrets
   ```

5. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

6. **Start all services:**
   ```bash
   npm run dev
   ```

### Individual Service Commands

```bash
# Start only the web app
npm run dev -w nextn

# Start only the queue service  
npm run dev -w @planemail/queue-service

# Build all packages
npm run build

# Build specific packages
npm run build -w @planemail/shared -w @planemail/queue-service
```

## 📁 Project Structure

```
PlaneMail/
├── apps/
│   └── web/                 # Next.js web application
│       ├── src/             # Application source code
│       ├── package.json     # Web app dependencies
│       └── ...config files
├── packages/
│   ├── shared/              # Common types and utilities
│   │   ├── src/types.ts     # Shared TypeScript types
│   │   └── package.json     # Shared package config
│   └── queue-service/       # Standalone email processing service
│       ├── src/             # Queue service source code
│       ├── Dockerfile       # Container configuration
│       └── package.json     # Queue service dependencies
├── scripts/                 # Utility scripts
├── drizzle/                 # Database migrations
├── docker-compose.yml       # Multi-service deployment
├── ENVIRONMENT_SETUP.md     # Environment configuration guide
├── DEPLOYMENT_GUIDE.md      # Production deployment guide
└── package.json            # Monorepo root configuration
```

This starts:
- **Web app**: http://localhost:3000
- **Queue service**: http://localhost:3001  
- **Queue health**: http://localhost:3001/health

## 🔧 Configuration

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed environment configuration instructions.

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment options including Docker, cloud deployment, and scaling considerations.

## 🧹 Maintenance

```bash
# Clean workspace of temporary files and backups
npm run cleanup

# Verify system health
npm run health-check

# Deep clean (removes node_modules and build cache)
npm run clean
```

## 📁 Project Structure

See [PROJECT_STRUCTURE_FINAL.md](./PROJECT_STRUCTURE_FINAL.md) for a complete overview of the clean, organized project structure.

## ⚙️ Environment Variables

Create a `.env.local` file in the root with at least:

```
DATABASE_URL=postgres://user:password@host:port/dbname
CLERK_SECRET_KEY=your_clerk_secret
```

Other provider keys (Mailgun, AWS SES, Brevo) can be set up in the app UI.

## 📚 Documentation

- In-app docs: `/docs`
- API reference: `/docs/api`
- [Blueprint & design notes](docs/blueprint.md)

## 🧑‍💻 Contributing

Contributions are welcome! Please open issues or pull requests.

- Fork the repo and create your branch from `main`.
- Run `npm run lint` and `npm run typecheck` before submitting.

## 📜 License

MIT. See [LICENSE](LICENSE).

## 🙌 Community & Support

- [GitHub Discussions](https://github.com/outrevo/PlaneMail/discussions)
- [Issues](https://github.com/outrevo/PlaneMail/issues)

---

PlaneMail is built for developers, by developers. Star us on GitHub and help shape the future of open email marketing!

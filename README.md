# PlaneMail

The open-source newsletter platform. Precision Engineered Communication.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Star on GitHub](https://img.shields.io/github/stars/outrevo/PlaneMail?style=social)](https://github.com/outrevo/PlaneMail)

---

## ✨ Features

- **Drag & Drop Email Editor**: Create beautiful emails with a modern, block-based editor.
- **BYOP (Bring Your Own Provider)**: Connect AWS SES, Mailgun, Brevo, or any SMTP provider. No per-subscriber fees.
- **Full Data Ownership**: Self-host or use our cloud. Your data, your rules.
- **API-First**: Modern REST API for integration and automation.
- **Subscriber Management**: Segmentation, import/export, and analytics.
- **Templates**: Save, reuse, and share email templates.
- **Analytics**: Track sends, opens, clicks, and more (with privacy in mind).
- **Open Source**: MIT licensed, transparent, and extensible.

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/)
- [Clerk](https://clerk.com/) (auth)
- [Radix UI](https://www.radix-ui.com/)

## 🚀 Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/outrevo/PlaneMail.git
   cd PlaneMail
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env.local` and fill in required secrets (see below).
4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```
5. **Start the dev server:**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to get started.

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

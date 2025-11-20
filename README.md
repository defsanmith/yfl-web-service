# YFL Web Service

A Next.js 15 + TypeScript web application with NextAuth.js email authentication, Prisma ORM (PostgreSQL), and shadcn/ui components.

## Features

- **Authentication**: Email magic link authentication (passwordless) via NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **Role-Based Access Control**: Super Admin, Org Admin, and User roles
- **Forecasting System**: Binary, continuous, and categorical forecasts with predictions
- **Leaderboard**: Track prediction accuracy and performance metrics

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Authentication**: NextAuth.js v4
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Email**: Nodemailer (SMTP)
- **Testing**: Vitest + jsdom
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20.x or later
- PostgreSQL database (local or hosted)
- SMTP email credentials (e.g., Gmail App Password)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd yfl-web-service
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (e.g., `http://localhost:3000`)
- Email SMTP credentials
- Admin email address

### Database Setup

```bash
# Start PostgreSQL via Docker (optional)
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npm run prisma:seed
# or for demo data
npm run seed:demo

# Open Prisma Studio (optional)
npm run prisma:studio
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Testing

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

### Linting

```bash
npm run lint
```

## Production Deployment

This project is configured for deployment on Vercel with PostgreSQL.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/yfl-web-service)

### Manual Deployment

1. **Provision a PostgreSQL database**:

   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (recommended)
   - [Neon](https://neon.tech) (serverless)
   - [Supabase](https://supabase.com)
   - [Railway](https://railway.app)

2. **Deploy to Vercel**:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

3. **Set environment variables** in Vercel Dashboard:

   - See `.env.example` for required variables
   - Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
   - Add `?sslmode=require` to `DATABASE_URL` for production

4. **Run migrations** (automatic during build):
   - Migrations run via `npm run vercel-build`
   - Or manually: `npx prisma migrate deploy`

📖 **Detailed deployment guide**: [docs/PRODUCTION-DEPLOYMENT.md](docs/PRODUCTION-DEPLOYMENT.md)

✅ **Pre-deployment checklist**: [docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md)

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── auth/             # NextAuth.js configuration
│   ├── components/       # Reusable UI components
│   ├── constants/        # Configuration and constants
│   ├── generated/        # Generated Prisma client
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities and helpers
│   ├── providers/        # React context providers
│   ├── schemas/          # Zod validation schemas
│   ├── services/         # Business logic and data access
│   └── views/            # Presentation components
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seeds/            # Database seed scripts
├── docs/                 # Documentation
├── tests/                # Test files
└── public/               # Static assets
```

## Key Documentation

- [Server Actions Guide](docs/SERVER-ACTIONS-GUIDE.md) - Patterns for server actions
- [RBAC Summary](docs/RBAC-SUMMARY.md) - Role-based access control
- [Pagination Integration](docs/PAGINATION-INTEGRATION.md) - Pagination patterns
- [Forecast Implementation](docs/FORECASTS-IMPLEMENTATION.md) - Forecasting system
- [Production Deployment](docs/PRODUCTION-DEPLOYMENT.md) - Deployment guide
- [Production Checklist](docs/PRODUCTION-CHECKLIST.md) - Pre-deployment checklist

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio
- `npm run import:forecasts` - Import forecasts from CSV
- `npm run import:actuals` - Import actuals from CSV

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for JWT signing (32+ characters)
- `NEXTAUTH_URL` - Your app URL
- `EMAIL_SERVER_*` - SMTP configuration
- `ADMIN_EMAIL` - Admin user email address
- `NEXT_PUBLIC_APP_URL` - Public app URL (for emails, etc.)

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## Database Setup

### Initial Setup (First Time Only)

Run database migrations to create tables:

```bash
npx prisma migrate dev
```

### View and Edit Database

Launch Prisma Studio to browse and edit data:

```bash
npx prisma studio
```

Open [http://localhost:5555](http://localhost:5555) to access Prisma Studio.

### Additional Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Create a new migration
npx prisma migrate dev --name description_of_changes
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

[Add your license here]

## Support

For questions or issues:

- Check the [documentation](docs/)
- Open an issue on GitHub
- Contact the development team

---

**Maintained by**: YFL Development Team  
**Last Updated**: November 2025

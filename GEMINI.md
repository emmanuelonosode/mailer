# Hasker Mail Sender - Project Overview

A specialized platform for the Hasker & Co. Realty Group to manage real estate marketing campaigns, automated drip sequences, CRM contacts, and engagement tracking.

## Core Technologies

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Emailing**: [Nodemailer](https://nodemailer.com/) (SMTP)
- **Rich Text Editor**: [Tiptap](https://tiptap.dev/)
- **Data Processing**: [Cheerio](https://cheerio.js.org/) (HTML parsing), [PapaParse](https://www.papaparse.com/) (CSV parsing)

## Architecture

- **Frontend**: Single-page dashboard experience built within `app/page.tsx` using modular components from the `components/` directory.
- **Backend**: API routes located in `app/api/` handling operations for campaigns, contacts, sending emails, and tracking.
- **Database Models**: Defined in `lib/models/` using Mongoose schemas.
- **Core Logic**:
  - `lib/mailer.ts`: SMTP transport configuration and specialized email headers for deliverability and compliance.
  - `lib/tracking.ts`: Logic for injecting tracking pixels and link wrappers.
  - `lib/emailTemplate.ts`: Brand-specific HTML wrapping for emails.
- **Types**: Centralized TypeScript interfaces in `types/email.ts`.

## Key Features

- **Campaign Management**: Create, schedule, and monitor bulk email campaigns with A/B testing and automated follow-ups.
- **Drip Sequences**: Design and enroll contacts into multi-step automated email series.
- **CRM & Segmentation**: Manage real estate contacts with tags (Buyer, Renter, Investor, etc.) and handle opt-outs.
- **Live Preview & Editor**: Rich text editing with Tiptap and live mobile/desktop previews of brand-wrapped content.
- **Listing Integration**: Tools for building property cards and multi-listing showcases directly into emails.
- **Engagement Analytics**: Track opens, clicks, and unsubscribes with detailed logging.

## Building and Running

### Prerequisites

- Node.js (v18+)
- MongoDB instance (local or Atlas)

### Commands

- `npm run dev`: Starts the development server at `http://localhost:3000`.
- `npm run build`: Generates an optimized production build.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code quality checks.

### Environment Variables

The following environment variables are supported (can also be configured via UI in development):

- `MONGODB_URI`: Connection string for MongoDB.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`: SMTP configuration for sending.
- `SENDER_EMAIL`, `SENDER_NAME`: Default sender identity.
- `APP_URL`: Base URL for tracking links and unsubscribe pages.

## Development Conventions

- **API Design**: Follow RESTful patterns in `app/api/`. Use `NextResponse` for consistent error handling.
- **Component Design**: Prefer functional components with Tailwind CSS for styling. Components should be stored in `components/`.
- **Data Persistence**: Always use the models in `lib/models/` for database interactions. Ensure `connectDB()` is called in API routes.
- **Type Safety**: Strictly adhere to the interfaces in `types/email.ts`. Avoid using `any`.
- **Email Compliance**: Maintain RFC-compliant headers (List-Unsubscribe, Precedence: bulk) in `lib/mailer.ts` to ensure high deliverability.
- **Tracking**: Use `injectTracking` from `lib/tracking.ts` when preparing email HTML for campaigns.

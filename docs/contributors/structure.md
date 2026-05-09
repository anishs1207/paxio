# Project Structure

Paxio is a monorepo-style Next.js application that integrates a powerful AI agent backend with a modern React frontend.

## Directory Overview

- **`app/`**: Next.js App Router. Contains all the pages and API endpoints.
  - `(dashboard)/`: Grouped dashboard routes.
  - `api/`: Backend API routes for integrations, payments, and agent interaction.
- **`backend/`**: The core AI logic.
  - `agents/`: Implementation of various AI agents (Main Agent, Checkpointers, etc).
  - `autonomous/`: Logic for background workers and scheduled tasks.
  - `utils/`: Utility functions specifically for backend services (Gemini clients, context stores).
- **`components/`**: React components.
  - `ui/`: Reusable UI primitives (Shadcn UI).
  - `dashboard/`: Components specific to the user dashboard.
  - `admin/`: Admin-only interface components.
- **`lib/`**: Shared utility functions and singletons.
  - `db.ts`: Prisma database client.
  - `auth.ts`: NextAuth configuration.
- **`prisma/`**: Database schema and configuration.
- **`public/`**: Static assets available to the browser.
- **`types/`**: Global TypeScript definitions.
- **`docs/`**: Project documentation and guides.
- **`scripts/`**: Maintenance and helper scripts.

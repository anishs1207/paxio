# Getting Started

Follow these steps to get your local development environment up and running.

## Prerequisites

- **Node.js**: Version 20.16.0 (specified in `.tool-versions`).
- **NPM**: Package manager.
- **PostgreSQL**: Local or remote database instance.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/anishs1207/paxio.git
   cd paxio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy `.env.sample` to `.env`.
   - Fill in the required API keys (Gemini, Clerk/NextAuth, Prisma DB URL, etc).

4. **Initialize Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Workflow

- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Database Studio**: `npx prisma studio`

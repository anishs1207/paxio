# Navigating the Repository

This guide helps you find your way around the codebase based on the feature you are working on.

## Frontend Development

- **Adding a Page**: Look in `app/`. Most user-facing pages are in `app/(dashboard)/`.
- **Modifying UI**: Check `components/`. Reusable elements are in `components/ui/`.
- **Handling State**: Context providers are located in `contexts/`.

## Backend & AI Logic

- **Modifying the Agent**: The main agent logic lives in `backend/agents/mainAgent.ts`.
- **Adding an Integration**: Most API callbacks and token handling are in `app/api/connect/`.
- **Background Tasks**: Check `backend/autonomous/` for worker logic and task registration.

## Database

- **Changing the Schema**: Update `prisma/schema.prisma` and run `npx prisma db push` (or create a migration).
- **Using the Client**: Always import the singleton from `@/lib/db`.

## Key Files

- `.env`: Where all your secrets live.
- `package.json`: Scripts and dependencies.
- `middleware.ts`: Authentication and routing protection.
- `tailwind.config.ts`: Styling configuration.

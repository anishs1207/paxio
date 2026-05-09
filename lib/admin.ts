import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const ADMIN_UI_PASSWORD = "anushay123";

export function isAdminAuthorized(req: NextRequest): boolean {
  // 1. Cookie-based session (set by /api/admin/login after UI password entry)
  const sessionCookie = req.cookies.get("admin_session")?.value;
  if (sessionCookie === ADMIN_UI_PASSWORD) return true;

  // 2. Bearer token (for programmatic / curl access using ADMIN_SECRET from .env)
  if (ADMIN_SECRET?.length) {
    const authHeader = req.headers.get("authorization");
    if (authHeader === `Bearer ${ADMIN_SECRET}`) return true;
  }

  return false;
}

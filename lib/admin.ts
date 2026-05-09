import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const ADMIN_UI_PASSWORD = "anushay123";

export function isAdminAuthorized(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get("admin_session")?.value;
  if (sessionCookie === ADMIN_UI_PASSWORD) return true;

  if (ADMIN_SECRET?.length) {
    const authHeader = req.headers.get("authorization");
    if (authHeader === `Bearer ${ADMIN_SECRET}`) return true;
  }

  return false;
}

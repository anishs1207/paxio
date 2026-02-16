import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function isAdminAuthorized(req: NextRequest): boolean {
  if (!ADMIN_SECRET?.length) return false;
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${ADMIN_SECRET}`) return true;
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") === ADMIN_SECRET) return true;
  return false;
}

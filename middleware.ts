import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  console.log("🔍 Running middleware for:", pathname);

  const protectedRoutes = ["/payment", "/voice"];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtectedRoute) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      console.log("🚫 Unauthorized access to:", pathname, "- Redirecting to /");
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    console.log("✅ Authorized access to:", pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/payment", "/payment/:path*", "/voice", "/voice/:path*"],
};


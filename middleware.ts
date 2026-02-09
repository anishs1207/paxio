import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  console.log("🔍 Running middleware for:", pathname);

  // Protected routes that require authentication
  const protectedRoutes = ["/payment", "/voice"];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtectedRoute) {
    // Check if user is authenticated
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // User is not logged in, redirect to home
      console.log("🚫 Unauthorized access to:", pathname, "- Redirecting to /");
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    console.log("✅ Authorized access to:", pathname);
  }

  return NextResponse.next();
}

// Match protected routes
export const config = {
  matcher: ["/payment", "/payment/:path*", "/voice", "/voice/:path*"],
};


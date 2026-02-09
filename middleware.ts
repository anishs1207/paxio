import { NextResponse, type NextRequest } from "next/server";

// @@fix iti
// Toggle manually if needed
const isProd = false;
//test3

export default function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  console.log("🔍 Running middleware for:", pathname);

  if (isProd) {
    // Allow homepage to load normally
    if (pathname === "/") return NextResponse.next();

    // Redirect all other routes
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// ✅ Correct matcher configuration
export const config = {
  matcher: [
    "/admin-dashboard",
    "/admin-login",
    "/signin",
    "/signup",
    "/c/:path*", // ✅ use :path* to match /c, /c/abc, /c/xyz/123, etc.
    "/chat",
    "/use-cases",
    "/workflows",
    "/features",
    "/login",
    "/onboarding",
    "/pricing",
  ],
};

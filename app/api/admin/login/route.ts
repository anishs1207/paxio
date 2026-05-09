import { NextRequest, NextResponse } from "next/server";

// The UI-facing password that admins type in the browser
const ADMIN_UI_PASSWORD = "anushay123";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== ADMIN_UI_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Set a secure httpOnly session cookie that API routes can verify
    response.cookies.set("admin_session", ADMIN_UI_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  return response;
}

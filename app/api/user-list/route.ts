import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/* ----------------------------------
   CREATE: Add new user-list entry
----------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, userId } = body;

    if (!name || !email || !userId) {
      return NextResponse.json(
        { error: "name, email and userId are required" },
        { status: 400 },
      );
    }

    const userList = await prisma.userEmailList.create({
      data: {
        name,
        email,
        userId,
      },
    });

    return NextResponse.json(userList, { status: 201 });
  } catch (error) {
    console.error("Create user-list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ----------------------------------
   READ: Fetch all user-list by userId
----------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const name = searchParams.get("name"); // optional filter

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const userLists = await prisma.userEmailList.findMany({
      where: {
        userId,
        ...(name && name.trim() !== ""
          ? {
              name: {
                contains: name,
                mode: "insensitive", // case-insensitive search
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(userLists);
  } catch (error) {
    console.error("Fetch user-list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ----------------------------------
   UPDATE: Update user-list entry
----------------------------------- */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updatedUserList = await prisma.userEmailList.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    return NextResponse.json(updatedUserList);
  } catch (error) {
    console.error("Update user-list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ----------------------------------
   DELETE: Delete user-list entry
----------------------------------- */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.userEmailList.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user-list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

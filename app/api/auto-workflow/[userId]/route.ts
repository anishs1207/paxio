// apps/web/app/api/auto-workflow/[userId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 🧠 Fetch all autonomous tasks for the user excluding Gmail Auto-Reply and Daily Calendar Summary
    const tasks = await prisma.autonomousTask.findMany({
      where: {
        userId,
        NOT: {
          prompt: {
            in: ["Gmail Auto-Reply", "Daily Calendar Summary"],
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        runs: {
          orderBy: { runAt: "desc" },
          select: {
            id: true,
            runAt: true,
            success: true,
            summary: true,
            rawResults: true,
          },
        },
      },
    });

    // 🧩 Shape the data for the frontend
    const formatted = tasks.map((task) => ({
      id: task.id,
      userId: task.userId,
      prompt: task.prompt || "No Prompt",
      triggerType: task.triggerType || "Manual",
      schedule: task.schedule || "N/A",
      description: task.description || "",
      workflow: Array.isArray(task.workflow) ? task.workflow : [],
      lastRunAt: task.lastRunAt ?? null,
      lastResultSummary: task.lastResultSummary ?? "",
      status: task.status ?? "unknown",
      createdAt: task.createdAt,

      // 🧠 Include all task runs (sorted newest → oldest)
      runs: (task.runs || []).map((r) => ({
        id: r.id,
        runAt: r.runAt,
        success: r.success,
        summary: r.summary,
        rawResults: r.rawResults,
      })),
    }));

    // 🪵 Debug output
    console.log(
      `[auto-workflow] sending ${formatted.length} workflows for user ${userId}`
    );

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("[auto-workflow] Error fetching user workflows:", err);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import prisma from "@/lib/db";

// export async function GET(
//   _: Request,
//   { params }: { params: Promise<{ userId: string }> }
// ) {
//   try {
//     const { userId } = await params;
//     if (!userId) {
//       return NextResponse.json({ error: "Missing userId" }, { status: 400 });
//     }

//     // 🧠 Fetch all autonomous tasks for the user including all historical runs
//     const tasks = await prisma.autonomousTask.findMany({
//       where: { userId },
//       orderBy: { createdAt: "desc" },
//       include: {
//         runs: {
//           orderBy: { runAt: "desc" },
//           select: {
//             id: true,
//             runAt: true,
//             success: true,
//             summary: true,
//             rawResults: true,
//           },
//         },
//       },
//     });

//     // 🧩 Shape the data for the frontend
//     const formatted = tasks.map((task) => ({
//       id: task.id,
//       userId: task.userId,
//       prompt: task.prompt || "No Prompt",
//       triggerType: task.triggerType || "Manual",
//       schedule: task.schedule || "N/A",
//       description: task.description || "",
//       workflow: Array.isArray(task.workflow) ? task.workflow : [],
//       lastRunAt: task.lastRunAt ?? null,
//       lastResultSummary: task.lastResultSummary ?? "",
//       status: task.status ?? "unknown",
//       createdAt: task.createdAt,

//       // 🧠 Add all task runs (sorted newest → oldest)
//       runs: (task.runs || []).map((r) => ({
//         id: r.id,
//         runAt: r.runAt,
//         success: r.success,
//         summary: r.summary,
//         rawResults: r.rawResults,
//       })),
//     }));

//     // 🪵 Debug output
//     console.log(
//       `[auto-workflow] sending ${formatted.length} workflows for user ${userId}`
//     );

//     return NextResponse.json(formatted);
//   } catch (err) {
//     console.error("[auto-workflow] Error fetching user workflows:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch workflows" },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import prisma from "@/lib/db";

// export async function GET(
//   _: Request,
//   { params }: { params: Promise<{ userId: string }> }
// ) {
//   try {
//     const { userId } = await params;
//     if (!userId) {
//       return NextResponse.json({ error: "Missing userId" }, { status: 400 });
//     }

//     const tasks = await prisma.autonomousTask.findMany({
//       where: { userId },
//       orderBy: { createdAt: "desc" },
//       include: {
//         runs: true, // include previous runs
//       },
//     });

//     const formatted = tasks.map((task) => ({
//       id: task.id,
//       userId: task.userId,
//       prompt: task.prompt || "No Prompt",
//       triggerType: task.triggerType || "Manual",
//       schedule: task.schedule || "N/A",
//       description: task.description || "",
//       workflow: Array.isArray(task.workflow) ? task.workflow : [],
//       runs: Array.isArray(task.runs) ? task.runs : [],
//       lastRunAt: task.lastRunAt ?? null,
//       lastResultSummary: task.lastResultSummary ?? "",
//       status: task.status ?? "unknown",
//       createdAt: task.createdAt,
//     }));

//     // Debug print
//     console.log("Formatted workflows sent to frontend:", JSON.stringify(formatted, null, 2));

//     return NextResponse.json(formatted);
//   } catch (err) {
//     console.error("Error fetching autonomous workflows:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch workflows" },
//       { status: 500 }
//     );
//   }
// }

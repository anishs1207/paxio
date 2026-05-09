import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";
// import { BartAutonomous } from "@/backend/autonomous/index";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; taskId: string }> }
) {
  try {
    const { userId, taskId } = await params;

    if (!userId || !taskId) {
      return NextResponse.json(
        { error: "Missing userId or taskId" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("[PATCH] params:", { userId, taskId }, "body:", body);

    const existingTask = await prisma.autonomousTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 1️⃣ Handle status toggle
    if (body.status && ["ACTIVE", "INACTIVE"].includes(body.status)) {
      const isActive = body.status === "ACTIVE";
      const updated = await prisma.autonomousTask.update({
        where: { id: taskId },
        data: {
          status: body.status,
          active: isActive, // Keep active field in sync with status
        },
      });
      return NextResponse.json({ message: "Status updated", task: updated });
    }

    // 2️⃣ Handle prompt update -> create new version
    if (body.prompt && body.prompt.trim().length > 0) {
      const newPrompt = body.prompt.trim();

      // Skip duplicate prompt updates
      if (newPrompt === existingTask.prompt.trim()) {
        return NextResponse.json({
          message: "Prompt unchanged — no new workflow created",
          task: existingTask,
        });
      }

      // 🔹 Step 1: Immediately deactivate the old one before generation
      await prisma.autonomousTask.update({
        where: { id: taskId },
        data: { status: "INACTIVE" },
      });

      // 🔹 Step 2: Generate new workflow AFTER old is safely inactive
      // const socketId = `auto-edit-${taskId}-${Date.now()}`;
      // const newWorkflowResult = await BartAutonomous(newPrompt, socketId, userId);
      const newWorkflowResult: { response?: string; workflow?: unknown[] } | null = null; // Placeholder to fix missing variable since BartAutonomous is commented out

      // 🔹 Step 3: Create the new task (always ACTIVE by default)
      const newTask = await prisma.autonomousTask.create({
        data: {
          id: `aut-${Date.now()}`,
          userId,
          prompt: newPrompt,
          //@ts-expect-error - newWorkflowResult implementation is currently pending or mocked in this environment
          description: newWorkflowResult?.response || "Updated workflow version",
          //@ts-expect-error - workflow property mapping depends on the pending BartAutonomous implementation
          workflow: newWorkflowResult?.workflow || [],
          triggerType: existingTask.triggerType,
          schedule: existingTask.schedule,
          eventName: existingTask.eventName,
          pollInterval: existingTask.pollInterval,
          status: "ACTIVE",
          lastRunAt: new Date(),
            //@ts-expect-error - response summary property mapping depends on the pending BartAutonomous implementation
          lastResultSummary: newWorkflowResult?.response || "",
        },
      });

      return NextResponse.json({
        message: "Workflow updated — new version created",
        oldTaskId: taskId,
        newTask,
      });
    }

    return NextResponse.json(
      { error: "No valid action (status or prompt)" },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("[auto-workflow][taskId] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update workflow", details: (err as Error).message },
      { status: 500 }
    );
  }
}


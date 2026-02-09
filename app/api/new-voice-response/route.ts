import { NextResponse, NextRequest } from "next/server";
import { runMainAgent } from "../../../../backend/src/agents/mainAgent";
import { Assistant } from "../../../../backend/src/types";
import prisma from "@/lib/db";
import fs from "fs";
import path from "path";

type FinalReturnType = {
  response: string;
  suggestedWorkflows: string[];
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const userPrompt = formData.get("userPrompt") as string;
    const socketId = formData.get("socketId") as string;
    const userId = formData.get("userId") as string;
    const assistant = formData.get("assistant") as string;
    const conversationId = formData.get("conversationId") as string;
    const files = formData.getAll("files") as File[];
    const imageNamesJson = formData.get("imageNames") as string | null;

    if (!userPrompt || !socketId || !userId || !assistant || !conversationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Object.values(Assistant).includes(assistant as Assistant)) {
      return NextResponse.json(
        { error: "Invalid assistant provided" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { savedPrompts: true },
    });

    if (!user) throw new Error("User not found");

    if (
      !user.savedPrompts.some(
        (p) => p.toLowerCase() === userPrompt.toLowerCase()
      )
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: { savedPrompts: { push: userPrompt } },
      });
    }

    /* -------- LOAD IMAGES -------- */

    const imageFiles: File[] = [];

    if (imageNamesJson) {
      const imageNames: string[] = JSON.parse(imageNamesJson);

      for (const imageName of imageNames) {
        const imagePath = path.join(
          process.cwd(),
          "public",
          "images",
          imageName
        );

        if (fs.existsSync(imagePath)) {
          const buffer = fs.readFileSync(imagePath);
          const ext = imageName.split(".").pop() || "png";
          const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;

          imageFiles.push(new File([buffer], imageName, { type: mimeType }));
        }
      }
    }

    const allFiles = [...imageFiles, ...files];

    /* -------- MAIN AGENT CALL -------- */

    const agentResult = await runMainAgent({
      prompt: userPrompt,
      socketId,
      userId,
      conversationId,
      assistant,
      files: allFiles,
    });

    const result: FinalReturnType = {
      response: agentResult.response,
      suggestedWorkflows: [],
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Error processing request", details: err.message },
      { status: 500 }
    );
  }
}

// import { NextResponse, NextRequest } from "next/server";
// import {
//   BartAutonomous,
//   BartChatEngine,
// } from "../../../../backend/src/app/index";
// import { Assistant } from "../../../../backend/src/types";
// import prisma from "@/lib/db";
// import fs from "fs";
// import path from "path";

// type FinalReturnType = {
//   response: string;
//   suggestedWorkflows: string[];
// };

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();

//     const userPrompt = formData.get("userPrompt") as string;
//     const socketId = formData.get("socketId") as string;
//     const userId = formData.get("userId") as string;
//     const assistant = formData.get("assistant") as string;
//     const conversationId = formData.get("conversationId") as string;
//     const files = formData.getAll("files") as File[];
//     const imageNamesJson = formData.get("imageNames") as string | null;

//     console.log("assiatnt", assistant);

//     if (!userPrompt || !socketId || !userId || !assistant || !conversationId) {
//       return NextResponse.json(
//         { error: "Missing userPrompt, socketId, userId or assistant" },
//         { status: 400 }
//       );
//     }

//     if (!Object.values(Assistant).includes(assistant as Assistant)) {
//       return NextResponse.json(
//         { error: "Invalid assistant provided" },
//         { status: 400 }
//       );
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { savedPrompts: true },
//     });

//     if (!user) {
//       throw new Error("User not found");
//     }

//     const alreadyExists = user.savedPrompts.some(
//       (prompt) => prompt.toLowerCase() === userPrompt.toLowerCase()
//     );

//     if (!alreadyExists) {
//       await prisma.user.update({
//         where: { id: userId },
//         data: {
//           savedPrompts: { push: userPrompt },
//         },
//       });
//     }

//     // Load uploaded images from disk
//     const imageFiles: File[] = [];
//     if (imageNamesJson) {
//       try {
//         const imageNames: string[] = JSON.parse(imageNamesJson);
//         for (const imageName of imageNames) {
//           const imagePath = path.join(process.cwd(), "public", "images", imageName);
//           if (fs.existsSync(imagePath)) {
//             const buffer = fs.readFileSync(imagePath);
//             const ext = imageName.split(".").pop() || "png";
//             const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
//             const file = new File([buffer], imageName, { type: mimeType });
//             imageFiles.push(file);
//           } else {
//             console.warn(`Image not found: ${imagePath}`);
//           }
//         }
//       } catch (err) {
//         console.error("Error loading images:", err);
//       }
//     }

//     // Combine uploaded images with other files
//     const allFiles = [...imageFiles, ...files];

//     const result: FinalReturnType = await BartChatEngine(
//       userPrompt,
//       socketId,
//       conversationId,
//       userId,
//       assistant as Assistant,
//       allFiles
//     );

//     return NextResponse.json(result, { status: 200 });
//   } catch (err: any) {
//     console.error("Error processing request:", err);
//     return NextResponse.json(
//       { error: "Error processing request", details: err.message },
//       { status: 500 }
//     );
//   }
// }

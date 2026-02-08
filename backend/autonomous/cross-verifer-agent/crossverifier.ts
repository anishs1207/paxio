// apps/backend/src/agents/cross-verifier-agent/crossverifier.ts
//@ts-ignore
import sendWhatsAppMessage from "../../../../../../../web/utils/sendWappMessage";
import { CrossVerifierReturn } from "../../../../../types";
import {
  streamMessage,
  streamNodesToBePermitted,
  streamQuestions,
} from "../../../../../utils/ws";
import validateAnswersAndAddContext from "./cv.validate";

type Answered = {
  question: string;
  answer: string;
  for: Service[];
};

export type Service =
  | "gmail"
  | "google-docs"
  | "sheets"
  | "calendar"
  | "drive"
  | "outlook"
  | "slack"
  | "notion"
  | "google-forms"
  | "twitter"
  | "calendly"
  | "reddit";

export interface Question {
  q: string;
  for: Service[];
}

export default async function CrossVerifier(
  workflow: any,
  socketId: string,
  userId: string
): Promise<CrossVerifierReturn> {
  try {
    if (!workflow || workflow.length === 0) {
      console.log("Workflow is empty", "error", socketId);
      return { success: false, data: [], message: "Workflow is empty" };
    }

    const lastStepOfWorkflow = workflow[workflow.length - 1];

    const nodesToPermit: Service[] = lastStepOfWorkflow.permissionsNeeded || [];

    // @@ask: what happens if node is not connected => start new or option to conitnye todo add
    //@@ it would tell it to => go to the app and connect these tools and try again
    if (nodesToPermit.length > 0) {
      if (!socketId.includes("wapp")) {
        await streamMessage("Nodes", "streaming", socketId, "");
      }

      let permitted;
      if (!socketId.includes("wapp")) {
        const permitted = await streamNodesToBePermitted(
          nodesToPermit,
          socketId
        );
      }
      if (!permitted) {
        if (!socketId.includes("wapp")) {
          await streamMessage("Nodes", "error", socketId, "");
        } else {
          console.log("wapp sratus");
          const match = socketId.match(/socket-wapp-(\d+)/);
          if (match) {
            console.log("hello world");
            const phoneNumber = match[1];
            console.log("sending updated here");

            const nodeList = nodesToPermit.join(", ");

            const message = `Please connect ${nodeList} at bart.ai and try again 🙂`;
            sendWhatsAppMessage(phoneNumber, message);
            console.log(phoneNumber);
          }
        }
        return {
          success: false,
          data: [],
          message: "Permissions denied",
        };
      }
      if (!socketId.includes("wapp")) {
        await streamMessage("Nodes", "done", socketId, "");
      }
    } else {
      console.log("No nodes to permit, skipping nodes step");
      // await streamMessage("Nodes", "done", socketId);
    }

    const questionsToAsk: Question[] = lastStepOfWorkflow.qnsToAsk ?? [];
    console.log("questions socket :", questionsToAsk);

    let validatedWorkflow = workflow;

    if (questionsToAsk.length > 0) {
      if (!socketId.includes("wapp")) {
        await streamMessage("Question", "streaming", socketId, "");
      }

      interface AnsweredQuestions {
        data: Answered[];
      }

      function formatQuestionsForWhatsApp(questions: string[]): string {
        if (!questions?.length) return "No verification questions available.";

        let formatted = "❓ *Verification Required*\n\n";
        formatted += "Please answer the following questions:\n\n";

        questions.forEach((q, i) => {
          formatted += `Q${i + 1}. ${q}\n`;
        });

        formatted += `\nReply with answers in format:\n1. <answer>\n2. <answer>`;

        return formatted;
      }

      // handle the to ask counter questions
      if (!socketId.includes("wapp")) {
        const answeredQuestions: AnsweredQuestions = {
          data: (await streamQuestions(questionsToAsk, socketId)) as Answered[],
        };

        await streamMessage("Question", "done", socketId, "");

        console.log(
          "[CrossVerifier] Received answeredQuestions:",
          answeredQuestions
        );

        await streamMessage("Verification", "streaming", socketId, "");

        // await streamMessage("Verification", "streaming", socketId);

        console.log(
          "before validating",
          //@ts-ignore
          answeredQuestions.data.answers,
          "workflow :",
          workflow
        );

        validatedWorkflow = await validateAnswersAndAddContext(
          //@ts-ignore
          answeredQuestions.data.answers,
          workflow
        );

        console.log("validated", validatedWorkflow);

        if (!validatedWorkflow) {
          await streamMessage("Verification", "error", socketId, "");
          return {
            success: false,
            data: [],
            message: "Workflow verification failed",
          };
        }
        await streamMessage("Verification", "done", socketId, "");
      } else {
        console.log("wapp sratus");
        const match = socketId.match(/socket-wapp-(\d+)/);
        if (match) {
          console.log("hello world");
          const phoneNumber = match[1];
          console.log("sending updated here");

          const formattedQuestions = formatQuestionsForWhatsApp(questionsToAsk);

          console.log("sending questions to WhatsApp");
          sendWhatsAppMessage(phoneNumber, formattedQuestions);

          console.log("✅ Questions sent to WhatsApp:", phoneNumber);
        }
      }
    } else {
      console.log("No questions to ask, skipping question step");
      // await streamMessage("Verification", "streaming", socketId);
    }

    console.log("Verification completed successfully");

    return {
      success: true,
      data: validatedWorkflow,
      message: "All permissions granted and workflow verified successfully",
    };
  } catch (err: any) {
    console.error("Error in CrossVerifier:", err);
    if (!socketId.includes("wapp")) {
      await streamMessage("Question", "error", socketId, "");
      await streamMessage("Verification", "error", socketId, "");
    }
    return {
      success: false,
      data: [],
      message: "Workflow verification failed due to an error",
    };
  }
}

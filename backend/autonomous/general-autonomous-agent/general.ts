import { callGemini } from "../../../../../utils/geminiClient";
import { streamMessage } from "../../../../../utils/ws";
import { getGeneralPrompt } from "./general.prompt";
import parseJson from "./general.jsonParse";
import { GeneralReturn } from "@/types";

export default async function General(
  prompt: string,
  socketId: string,
  userId: string
): Promise<GeneralReturn> {
  console.log("STREAM TEXT: General Agent...");

  try {
    const response = await callGemini(getGeneralPrompt(prompt));
    console.log("Raw General Agent Response:", response);

    let parsedText = parseJson(response.trim(), socketId);

    if (parsedText.isChatResponse) {
      console.log("STREAM TEXT: Chat response detected by General Agent");
      streamMessage("General", "done", socketId, "");
      return {
        success: true,
        message: "chatResponse",
        isChatResponse: true,
        data: {
          response: parsedText.data,
          suggestions: parsedText.suggestedWorkflows,
        },
      };
    }
    console.log("STREAM TEXT: Workflow detected by General Agent");
    streamMessage("General", "done", socketId, "");

    return {
      message: "Workflow",
      success: true,
      isChatResponse: false,
      data: {},
    };
  } catch (err) {
    console.log(err);
    streamMessage("General", "error", socketId, "");
    return {
      message: "Failed to get Response",
      success: false,
      data: {},
      isChatResponse: false,
    };
  }
}

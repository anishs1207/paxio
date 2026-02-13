// apps/backend/src/utils/ws.ts
import axios from "axios";

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

const WS_URL = "https://api.paxio.tech";
// const WS_URL = "http://localhost:3000";
console.log("WS_URL configured as:", WS_URL);

export interface Question {
  q: string;
  for: Service[];
}

interface StreamMsgStatus {
  message: string;
  status: "streaming" | "done" | "error";
}


export async function streamVoiceMessage(message: string, socketId: string) {
  console.log("[WS] streamMessage:", { message, socketId });
  console.log("WS_URL =", WS_URL);


  try {
    const response = await axios.post(`${WS_URL}/stream-voice-message`, {
      message,
      status: "done",
      socketId,
    });
    console.log("response.data", response.data);
    return response.data;
  } catch (err: any) {
    console.error(
      "[WS] Error streaming message:",
      err.response?.data || err.message,
    );
    throw err;
  }
}


// -------------------- Stream a simple message --------------------
export async function streamMessage(
  message: string,
  status: StreamMsgStatus["status"],
  socketId: string,
  data: string,
) {
  console.log("[WS] streamMessage:", { message, status, socketId, data });

  try {
    const response = await axios.post(`${WS_URL}/stream-message`, {
      message,
      status,
      socketId,
      extraData: data,
    });
    return response.data;
  } catch (err: any) {
    console.error(
      "[WS] Error streaming message:",
      err.response?.data || err.message,
    );
    throw err;
  }
}
// -------------------- Stream questions --------------------
export async function streamQuestions(questions: Question[], socketId: string) {
  if (!Array.isArray(questions)) questions = [];
  console.log("[WS] streamQuestions called:", { questions, socketId });

  try {
    const response = await axios.post(`${WS_URL}/stream-questions`, {
      questions,
      socketId,
    });
    console.log("[WS] streamQuestions response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error(
      "[WS] Error streaming the questions:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

// -------------------- Stream nodes to be permitted --------------------
export async function streamNodesToBePermitted(
  nodesToBePermitted: Service[],
  socketId: string,
) {
  console.log("nodesToBePermited", nodesToBePermitted);
  if (!Array.isArray(nodesToBePermitted)) nodesToBePermitted = [];
  if (!socketId) throw new Error("socketId is required");

  console.log("[WS] streamNodesToBePermitted:", {
    nodes: nodesToBePermitted,
    socketId,
  });

  try {
    const response = await axios.post(`${WS_URL}/stream-nodes`, {
      nodes: nodesToBePermitted,
      socketId,
    });
    console.log("[WS] streamNodesToBePermitted response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error(
      "[WS] Error streaming nodes:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

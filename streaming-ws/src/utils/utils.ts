import { Socket } from "socket.io";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

const connectedSockets: Map<string, Socket> = new Map();

// const pendingOtpRequests: Map<
//   string,
//   {
//     resolve: (otp: string) => void;
//     reject: (err: any) => void;
//     timeout: NodeJS.Timeout;
//   }
// > = new Map();

// const pendingConfirmationRequests: Map<
//   string,
//   {
//     resolve: (confirmation: string) => void;
//     reject: (err: any) => void;
//     timeout: NodeJS.Timeout;
//   }
// > = new Map();

const lastStreamingMessage: Map<string, string> = new Map();

export {
  connectedSockets,
  // pendingOtpRequests,
  // pendingConfirmationRequests,
  lastStreamingMessage,
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

// function streamMessage(
//   message: string,
//   socketId: string,
//   status: boolean,
//   stepData: string,
// ) {
//   const sock = connectedSockets.get(socketId);
//   console.log("stepData", stepData);
//   if (sock) {
//     sock.emit("streamMessage", { message, status, stepData });
//     if (status) {
//       lastStreamingMessage.set(socketId, message);
//     }
//     console.log(
//       "streamMessage sent:",
//       message,
//       "to",
//       socketId,
//       "status",
//       status,
//       "stepData",
//       stepData,
//     );
//   } else {
//     console.log("❌ Invalid socketId:", socketId);
//   }
// }

export async function streamVoiceMessage(
  message: string,
  socketId: string,
  status: boolean,
) {
  const sock = connectedSockets.get(socketId);
  if (!sock) {
    console.log("❌ Invalid socketId:", socketId);
    return;
  }

  console.log("inside here");

  const response = await deepgram.speak.request(
    { text: message },
    {
      model: "aura-2-thalia-en",
      // encoding: "linear16",
      // container: "wav",
      encoding: "linear16",
      container: "wav",
      sample_rate: 48000, 
    },
  );

  const stream = await response.getStream();
  if (!stream) throw new Error("Audio generation failed");

  const reader = stream.getReader();

  // // Send text metadata once
  // console.log("sent here");
  // sock.emit("streamVoiceMessage", { message, status });

  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // console.log("sent audoStream")
    // console.log("sending chunk");
    // sock.emit("audioStream", Buffer.from(value));
        chunks.push(value);
  }

  const audioBuffer = Buffer.concat(chunks);

  sock.emit("streamVoiceMessage", { message, status, audioBuffer });

  console.log("done sending audio streams");

  // Signal end of audio
  // sock.emit("audioStreamEnd");

  if (status) {
    lastStreamingMessage.set(socketId, message);
  }
}

// function streamQuestionsAndWait(
//   questions: Question[],
//   socketId: string,
//   timeoutMs = 5 * 60 * 1000,
// ): Promise<any[]> {
//   return new Promise((resolve, reject) => {
//     const sock = connectedSockets.get(socketId);
//     if (!sock) {
//       console.log("❌ Invalid socket id:", socketId);
//       return reject(new Error("Invalid socketId"));
//     }

//     console.log("✅ Socket found, setting up question handler for", socketId);

//     const requestId = `${Date.now()}-${Math.random()}`;

//     const handler = (data: { requestId: string; questionsAnswered: any[] }) => {
//       console.log("📨 Received answeredQuestions:", data);
//       if (data.requestId !== requestId) {
//         console.log("⚠️ Request ID mismatch, ignoring");
//         return;
//       }
//       console.log("✅ Correct request ID, resolving with answers");
//       clearTimeout(timeout);
//       sock.off("answeredQuestions", handler);
//       resolve(data.questionsAnswered);
//     };

//     const timeout = setTimeout(() => {
//       console.log("⏰ Questions timed out for socket:", socketId);
//       sock.off("answeredQuestions", handler);
//       reject(new Error("Frontend did not answer questions in time"));
//     }, timeoutMs);

//     sock.on("answeredQuestions", handler);

//     // Test if socket can receive events
//     sock.emit("ping", { test: "connection" });

//     sock.emit("streamQuestions", { questions, requestId });
//     console.log("📤 Questions sent to", socketId, "with requestId:", requestId);
//   });
// }

// function streamNodesAndWait(
//   nodes: any[],
//   socketId: string,
//   timeoutMs = 5 * 60 * 1000,
// ): Promise<boolean> {
//   return new Promise((resolve, reject) => {
//     const sock = connectedSockets.get(socketId);
//     if (!sock) return reject(new Error("Invalid socketId"));

//     const requestId = `${Date.now()}-${Math.random()}`;

//     const handler = (data: { requestId: string }) => {
//       if (data.requestId !== requestId) return;
//       clearTimeout(timeout);
//       sock.off("allNodesPermitted", handler);
//       resolve(true);
//     };

//     const timeout = setTimeout(() => {
//       sock.off("allNodesPermitted", handler);
//       reject(new Error("Frontend did not confirm nodes in time"));
//     }, timeoutMs);

//     sock.on("allNodesPermitted", handler);

//     sock.emit("streamNodesToBePermitted", { nodes, requestId });
//     console.log("Nodes sent to", socketId);
//     console.log(nodes);
//   });
// }

// export {
//   streamMessage,
//   streamVoiceMessage,
//   streamQuestionsAndWait,
//   streamNodesAndWait,
// };

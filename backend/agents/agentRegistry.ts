// // import { GmailNode } from "../gmail/gmail";
// // import { GoogleDocsNode } from "../google-docs/google-docs";
// import { SharedMemory } from "./sharedMemory";

// export type SubAgent = {
//   name: string;
//   run: (args: {
//     task: string;
//     context?: unknown;
//     userId: string;
//     conversationId: string;
//     memory: SharedMemory;
//   }) => Promise<string>;
// };

// export const agentRegistry: Map<string, SubAgent> = new Map([
//   [
//     "gmail",
//     {
//       name: "gmail",
//       run: async ({ task, context, userId, conversationId, memory }) => {
//         const result = await GmailNode({
//           input: {
//             task,
//             context,
//             userId,
//             conversationId,
//           },
//         });

//         memory.steps.push({
//           agent: "gmail",
//           task,
//           output: result.output,
//           timestamp: Date.now(),
//         });

//         memory.context = result.output;

//         return result.output;
//       },
//     },
//   ],

//   [
//     "google_docs",
//     {
//       name: "google_docs",
//       run: async ({ task, context, userId, conversationId, memory }) => {
//         const result = await GoogleDocsNode({
//           input: {
//             task,
//             context,
//             userId,
//             conversationId,
//           },
//         });

//         memory.steps.push({
//           agent: "google_docs",
//           task,
//           output: result.output,
//           timestamp: Date.now(),
//         });

//         memory.context = result.output;

//         return result.output;
//       },
//     },
//   ],
// ]);

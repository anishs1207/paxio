import axios from "axios";
import { 
// streamMessage,
// streamQuestionsAndWait,
// streamNodesAndWait,
connectedSockets, lastStreamingMessage, streamVoiceMessage, } from "../utils/utils.js";
const WS_URL = process.env.WS_URL || "http://localhost:3002";
export const pendingAbortRequests = new Map();
export const streamVoiceMessageController = (req, res) => {
    const { message, socketId, status } = req.body;
    console.log("inside streamVoiceMessage here", { socketId, message });
    if (!message || !socketId || !status) {
        return res
            .status(400)
            .json({ error: "message, socketId, and status required" });
    }
    streamVoiceMessage(message, socketId, status);
    return res.json({ ok: true });
};
// for the streaming relared stuff
// const streamMessageController = (req: any, res: any) => {
//   const { message, socketId, status, extraData } = req.body;
//   if (!message || !socketId || !status) {
//     return res
//       .status(400)
//       .json({ error: "message, socketId, and status required" });
//   }
//   streamMessage(message, socketId, status, extraData || "");
//   return res.json({ ok: true });
// };
// const streamQuestionsController = async (req: any, res: any) => {
//   const { questions, socketId } = req.body;
//   if (!Array.isArray(questions) || !socketId) {
//     return res
//       .status(400)
//       .json({ error: "questions must be array and socketId required" });
//   }
//   try {
//     const answers = await streamQuestionsAndWait(questions, socketId);
//     return res.json({ ok: true, answers });
//   } catch (err: any) {
//     console.error("Error in /stream-questions:", err);
//     return res.status(500).json({ error: err.message });
//   }
// };
// const streamNodesController = async (req: any, res: any) => {
//   const { nodes, socketId } = req.body;
//   if (!Array.isArray(nodes) || !socketId) {
//     return res
//       .status(400)
//       .json({ error: "nodes must be array and socketId required" });
//   }
//   try {
//     const success = await streamNodesAndWait(nodes, socketId);
//     return res.json({ ok: true, success });
//   } catch (err: any) {
//     console.error("Error in /stream-nodes:", err);
//     return res.status(500).json({ error: err.message });
//   }
// };
// for the aborting flow
// const abortFlow = async (req: any, res: any) => {
//   try {
//     const { socketId } = req.body;
//     if (!socketId) return res.status(400).json({ error: "socketId required" });
//     const sock = connectedSockets.get(socketId);
//     // Determine the last streaming message
//     const lastMessage = lastStreamingMessage.get(socketId) || "Task";
//     // Send "error" status via REST POST to /stream-message
//     await axios.post(`${WS_URL}/stream-message`, {
//       message: lastMessage,
//       status: "error",
//       socketId,
//       extraData: "abort",
//     });
//     // Clean up last streaming message
//     lastStreamingMessage.delete(socketId);
//     // Resolve any pending abort promises
//     const pending = pendingAbortRequests.get(socketId);
//     if (pending) {
//       pending.resolve();
//       pendingAbortRequests.delete(socketId);
//     }
//     // Emit an 'abort' event to socket if connected
//     if (sock) sock.emit("abort");
//     return res.json({ ok: true });
//   } catch (err: any) {
//     console.error("Error in /abort:", err);
//     return res.status(500).json({ error: err.message || "unknown error" });
//   }
// };
// export {
//   streamMessageController,
//   streamQuestionsController,
//   streamNodesController,
//   abortFlow,
//   streamVoiceMessageController,
// };

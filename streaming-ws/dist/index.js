import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express from "express";
import cors from "cors";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";
const app = express();
dotenv.config();
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const connectedSockets = new Map();
const lastStreamingMessage = new Map();
async function streamVoiceMessage(message, socketId, status) {
    const sock = connectedSockets.get(socketId);
    if (!sock) {
        console.log("❌ Invalid socketId:", socketId);
        return;
    }
    console.log("inside here");
    const response = await deepgram.speak.request({ text: message }, {
        model: "aura-2-thalia-en",
        // encoding: "linear16",
        // container: "wav",
        encoding: "linear16",
        container: "wav",
        sample_rate: 48000,
    });
    const stream = await response.getStream();
    if (!stream)
        throw new Error("Audio generation failed");
    const reader = stream.getReader();
    // // Send text metadata once
    // console.log("sent here");
    // sock.emit("streamVoiceMessage", { message, status });
    const chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
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
const streamVoiceMessageController = (req, res) => {
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
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
}));
app.post("/stream-voice-message", streamVoiceMessageController);
const pendingAbortRequests = new Map();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);
    connectedSockets.set(socket.id, socket);
    socket.on("abort", () => {
        console.log("Abort received from socket:", socket.id);
        const pending = pendingAbortRequests.get(socket.id);
        if (pending) {
            pending.resolve();
            pendingAbortRequests.delete(socket.id);
        }
    });
    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
        connectedSockets.delete(socket.id);
    });
});
httpServer.listen(3002, () => {
    console.log("🚀 Socket.IO + REST API server running on http://localhost:3002");
});
//# sourceMappingURL=index.js.map
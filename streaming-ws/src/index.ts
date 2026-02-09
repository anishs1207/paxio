import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {
  connectedSockets,
} from "./utils/utils.js";
import app from "./app.js";

export const pendingAbortRequests = new Map<
  string,
  { resolve: () => void; reject: () => void; timeout: NodeJS.Timeout }
>();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log("⚡ Client connected:", socket.id);
  connectedSockets.set(socket.id, socket);

  // socket.on(
  //   "otpReceived",
  //   ({ otp, userId }: { otp: string; userId: string }) => {
  //     const pending = pendingOtpRequests.get(userId);
  //     if (pending) {
  //       pending.resolve(otp);
  //       pendingOtpRequests.delete(userId);
  //     }
  //   }
  // );

  socket.on("abort", () => {
    console.log("Abort received from socket:", socket.id);
    const pending = pendingAbortRequests.get(socket.id);
    if (pending) {
      pending.resolve();
      pendingAbortRequests.delete(socket.id);
    }
  });

  // socket.on(
  //   "getConfirmation",
  //   ({ confirmation, userId }: { confirmation: string; userId: string }) => {
  //     const pending = pendingConfirmationRequests.get(userId);
  //     if (pending) {
  //       pending.resolve(confirmation);
  //       pendingConfirmationRequests.delete(userId);
  //     }
  //   }
  // );

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    connectedSockets.delete(socket.id);
  });
});

httpServer.listen(3002, () => {
  console.log(
    "🚀 Socket.IO + REST API server running on http://localhost:3002"
  );
});

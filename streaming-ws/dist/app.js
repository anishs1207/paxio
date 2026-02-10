import express from "express";
import cors from "cors";
import { 
// streamMessageController,
// streamQuestionsController,
// streamNodesController,
// abortFlow,
streamVoiceMessageController, } from "./controllers/streaming.controller.js";
// import {
//   checkOtp,
//   checkConfirmation,
// } from "./controllers/shopping.controller.js";
const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
}));
app.post("/stream-voice-message", streamVoiceMessageController);
// app.post("/stream-message", streamMessageController);
// app.post("/stream-questions", streamQuestionsController);
// app.post("/stream-nodes", streamNodesController);
// app.post("/abort", abortFlow);
export default app;

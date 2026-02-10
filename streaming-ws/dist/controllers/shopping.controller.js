// import {
//   connectedSockets,
//   pendingOtpRequests,
//   pendingConfirmationRequests,
// } from "../utils/utils.js";
export {};
// // for the shopping related stuff:
// const checkOtp = async (req: any, res: any) => {
//   const socketId = req.query.socketId as string;
//   if (!socketId) return res.status(400).json({ error: "socketId required" });
//   const sock = connectedSockets.get(socketId);
//   if (!sock) return res.status(404).json({ error: "Socket not connected" });
//   const otpPromise = new Promise<string>((resolve) => {
//     const timeout = setTimeout(() => {
//       pendingOtpRequests.delete(socketId);
//       resolve("failed");
//     }, 60 * 1000);
//     pendingOtpRequests.set(socketId, {
//       resolve: (otp: string) => {
//         clearTimeout(timeout);
//         resolve(otp);
//       },
//       reject: () => {
//         clearTimeout(timeout);
//         resolve("failed");
//       },
//       timeout,
//     });
//     sock.emit("receiveOtp", { socketId });
//   });
//   const otp = await otpPromise;
//   return res.json({ status: otp === "failed" ? "failed" : "received", otp });
// };
// const checkConfirmation = async (req: any, res: any) => {
//   const { socketId, image } = req.body;
//   if (!socketId || !image)
//     return res.status(400).json({ error: "socketId and image required" });
//   const sock = connectedSockets.get(socketId);
//   if (!sock) return res.status(404).json({ error: "Socket not connected" });
//   const confirmationPromise = new Promise<string>((resolve) => {
//     const timeout = setTimeout(
//       () => {
//         pendingConfirmationRequests.delete(socketId);
//         resolve("failed");
//       },
//       2 * 60 * 1000
//     );
//     pendingConfirmationRequests.set(socketId, {
//       resolve: (confirmation: string) => {
//         clearTimeout(timeout);
//         resolve(confirmation);
//       },
//       reject: () => {
//         clearTimeout(timeout);
//         resolve("failed");
//       },
//       timeout,
//     });
//     sock.emit("receiveConfirmation", { socketId, image });
//   });
//   const confirmation = await confirmationPromise;
//   return res.json({
//     status: confirmation === "failed" ? "failed" : "received",
//     confirmation,
//   });
// };
// export { checkOtp, checkConfirmation };

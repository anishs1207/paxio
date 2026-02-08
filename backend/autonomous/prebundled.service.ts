import { google } from "googleapis";
import prisma from "../../../../../../web/lib/db";
import { callGemini } from "../../../../utils/geminiClient";
import { getValidGmailAccessToken } from "../../../nodes/global.credentials";
import { generateRunSummary } from "./autonomous-service-agent/autonomous-service-agent";

const repliedMessageCache: Record<string, Set<string>> = {};

/**
 * 1️⃣ Gmail Auto Reply Agent (uses Gemini for reply, returns summary string)
 */


export async function runGmailAutoReplyAgent(userId: string, taskId: string) {
  try {
    const accessToken = await getValidGmailAccessToken(userId);
    if (!accessToken) {
      console.warn(`[autoReply] No Gmail access token for user ${userId}`);
      return "No Gmail access token found";
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // ✅ Only unread messages not sent by self
    const res = await gmail.users.messages.list({
      userId: "me",
      q: "in:inbox is:unread -from:me",
      maxResults: 5,
    });

    const messages = res.data.messages || [];
    if (!messages.length) {
      console.log(`[autoReply] No unread messages for ${userId}`);
      return "No unread messages found.";
    }

    let replies: string[] = [
      "✅ Gmail Auto-Reply Agent: These are all the email replies.",
    ];

    for (const msg of messages) {
      if (!msg.id) continue;

      // Fetch full message details
      const fullMsg = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = fullMsg.data.payload?.headers || [];
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
      const sender = headers.find((h) => h.name === "From")?.value;
      const messageId = headers.find((h) => h.name === "Message-ID")?.value;
      const snippet = fullMsg.data.snippet || "";
      const threadId = fullMsg.data.threadId;

      if (!sender) continue;
      if (sender.toLowerCase().includes("no-reply")) continue;

      // 🧠 Generate AI reply dynamically via Gemini
      const replyBody = await callGemini(
        `You are a professional email assistant. Write a concise, friendly, and relevant reply to this email:\n\nSubject: ${subject}\n\nBody:\n${snippet}`
      );

      // 📧 Construct raw reply
      const rawMessage = [
        `To: ${sender}`,
        `Subject: Re: ${subject}`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        replyBody,
      ].join("\n");

      // Send the reply
      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: Buffer.from(rawMessage)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_"),
          threadId,
        },
      });

      // ✅ Mark the original message (and thread) as read
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id,
        requestBody: { removeLabelIds: ["UNREAD"] },
      });

      // Optional: ensure no unread messages left in this thread (prevents loops)
      if (threadId) {
        await gmail.users.threads.modify({
          userId: "me",
          id: threadId,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });
      }

      // after sending the reply and marking as read
      await prisma.gmailMessage.upsert({
        where: { messageId: messageId! },
        update: {
          aiReply: replyBody,
          subject,
          snippet,
          threadId,
          sender,
          replied: true,
          metadata: {
            messageId,
            threadId,
            from: sender,
            subject,
            snippet,
          },
        },
        create: {
          userId,
          messageId,
          threadId,
          sender,
          subject,
          snippet,
          aiReply: replyBody,
          replied: true,
          direction: "INBOUND",
          metadata: {
            messageId,
            threadId,
            from: sender,
            subject,
            snippet,
          },
        },
      });

      console.log("after db")


      replies.push(`Replied to: ${sender} | Subject: ${subject}\n${replyBody}`);
      console.log(`[autoReply] ✅ Replied to ${sender} (subject: ${subject})`);
    }

    // 🧾 Generate summary report
    await generateRunSummary(taskId, userId, replies);
    return "✅ Gmail Auto-Reply Agent completed successfully.";
  } catch (err: any) {
    console.error(`[autoReply] Gmail auto-reply error:`, err);
    return `❌ Gmail Auto-Reply Agent error: ${err.message}`;
  }
}


export async function runMorningCalendarSummaryAgent(userId: string, taskId: string) {
  try {
    const accessToken = await getValidGmailAccessToken(userId);
    if (!accessToken) {
      console.warn(`[CalendarAgent] No Google Calendar token for ${userId}`);
      return "No Google Calendar access token found";
    }

    // 🔐 Setup Google OAuth client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 🕒 Define *local* start and end of today (not UTC)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // ✅ Convert local range to UTC for Google API
    const timeMin = new Date(startOfDay.getTime() - startOfDay.getTimezoneOffset() * 60000).toISOString();
    const timeMax = new Date(endOfDay.getTime() - endOfDay.getTimezoneOffset() * 60000).toISOString();

    // 📅 Fetch today's events
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = res.data.items || [];
    if (!events.length) {
      console.log(`[CalendarAgent] No events today for user ${userId}`);
      await generateRunSummary(taskId, userId, ["No events scheduled for today."]);
      return "No events scheduled for today.";
    }

    // 🧹 Clean up old events for today
    await prisma.calendarEvent.deleteMany({
      where: {
        userId,
        startTime: { gte: startOfDay },
      },
    });

    // 🧩 Store fresh events
    const dbEvents = await Promise.all(
      events.map(async (e) => {
        const start = e.start?.dateTime || e.start?.date;
        const end = e.end?.dateTime || e.end?.date;
        const title = e.summary || "Untitled Event";
        const timeZone = e.start?.timeZone || "UTC";

        // 🕒 Keep raw ISO time for accurate display later
        return prisma.calendarEvent.create({
          data: {
            userId,
            title,
            startTime: new Date(start), // still stored as Date
            endTime: end ? new Date(end) : null,
            link: e.hangoutLink || e.htmlLink || null,
            // Optional: store timezone for future global use
            // timeZone,
          },
        });
      })
    );

    // 📝 Generate readable summary (in local time)
    const eventsSummaryArray = dbEvents.map((e) => {
      const localTime = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata", // Force IST (adjust to user zone later)
      }).format(e.startTime);

      return `🕒 ${localTime} - ${e.title}`;
    });

    await generateRunSummary(taskId, userId, eventsSummaryArray);

    console.log(`[CalendarAgent] Stored ${dbEvents.length} calendar events for ${userId}`);

    return `📅 Stored ${dbEvents.length} events in DB.`;
  } catch (err: any) {
    console.error(`[CalendarAgent] Error:`, err);
    return `❌ Calendar summary error: ${err.message}`;
  }
}


// export async function runGmailAutoReplyAgent(userId: string,taskId:string) {
//   try {
//     const accessToken = await getValidGmailAccessToken(userId);
//     if (!accessToken) {
//       console.warn(`[prebundled] No Gmail access token for user ${userId}`);
//       return "No Gmail access token found";
//     }

//     // initialize cache per user
//     if (!repliedMessageCache[userId]) repliedMessageCache[userId] = new Set();

//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const gmail = google.gmail({ version: "v1", auth: oauth2Client });

//     // safer query to avoid replying to own messages
//     const res = await gmail.users.messages.list({
//       userId: "me",
//       q: "in:inbox is:unread -from:me",
//       maxResults: 5,
//     });

//     const messages = res.data.messages || [];
//     if (!messages.length) {
//       console.log(`[prebundled] No new messages for ${userId}`);
//       return "No new unread messages found";
//     }

//     let replies = ["✅ Gmail Auto-Reply Agent:these are all the emails replies."];

//     for (const msg of messages) {
//       if (repliedMessageCache[userId].has(msg.id!)) continue;

//       const fullMsg = await gmail.users.messages.get({
//         userId: "me",
//         id: msg.id!,
//       });

//       const headers = fullMsg.data.payload?.headers || [];
//       const subject =
//         headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
//       const sender = headers.find((h) => h.name === "From")?.value;
//       const messageId = headers.find((h) => h.name === "Message-ID")?.value;
//       const snippet = fullMsg.data.snippet || "";

//       if (!sender) continue;

//       // 🧠 Generate the AI reply content
//       const replyBody = await callGemini(
//         `You are a professional email assistant. Write a concise, friendly, and relevant reply to this email:\n\nSubject: ${subject}\n\nBody:\n${snippet}`
//       );

//       // 📧 Construct reply within same thread
//       const rawMessage = [
//         `To: ${sender}`,
//         `In-Reply-To: ${messageId}`,
//         `References: ${messageId}`,
//         "Content-Type: text/plain; charset=utf-8",
//         "",
//         replyBody,
//       ].join("\n");

//       await gmail.users.messages.send({
//         userId: "me",
//         requestBody: {
//           raw: Buffer.from(rawMessage)
//             .toString("base64")
//             .replace(/\+/g, "-")
//             .replace(/\//g, "_"),
//           threadId: fullMsg.data.threadId, // ensures same thread
//         },
//       });

//       repliedMessageCache[userId].add(msg.id!);
//       replies.push(rawMessage)

//       // mark as read
//       await gmail.users.messages.modify({
//         userId: "me",
//         id: msg.id!,
//         requestBody: { removeLabelIds: ["UNREAD"] },
//       });

//       console.log(`[prebundled] Replied to ${sender} (subject: ${subject})`);
//     }

//     generateRunSummary(taskId,userId,replies);
//   } catch (err) {
//     console.error(`[prebundled] Gmail auto-reply error:`, err);
//     return `❌ Gmail Auto-Reply Agent error: ${err.message}`;
//   }
// }

/**
 * 2️⃣ Morning Calendar Summary Agent (no Gemini summarization here)
 */
// export async function runMorningCalendarSummaryAgent(userId: string, taskId: string) {
//   try {
//     const accessToken = await getValidGmailAccessToken(userId);
//     if (!accessToken) {
//       console.warn(`[prebundled] No Google Calendar token for ${userId}`);
//       return "No Google Calendar access token found";
//     }

//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const calendar = google.calendar({ version: "v3", auth: oauth2Client });

//     const now = new Date();
//     const endOfDay = new Date();
//     endOfDay.setHours(23, 59, 59, 999);
//     now.setHours(0, 0, 0, 0);

//     const res = await calendar.events.list({
//       calendarId: "primary",
//       timeMin: now.toISOString(),
//       timeMax: endOfDay.toISOString(),
//       singleEvents: true,
//       orderBy: "startTime",
//     });

//     const events = res.data.items || [];
//     if (!events.length) {
//       console.log(`[prebundled] No events today for user ${userId}`);
//       await generateRunSummary(taskId, userId, ["No events scheduled for today."]);
//       return "No events scheduled for today.";
//     }

//     // 🧹 Remove old events for today
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     await prisma.calendarEvent.deleteMany({
//       where: {
//         userId,
//         startTime: { gte: startOfDay },
//       },
//     });

//     // 🧩 Insert fresh events
//     const dbEvents = await Promise.all(
//       events.map(async (e) => {
//         const start = e.start?.dateTime || e.start?.date;
//         const end = e.end?.dateTime || e.end?.date;
//         const title = e.summary || "Untitled Event";

//         return prisma.calendarEvent.create({
//           data: {
//             userId,
//             title,
//             startTime: new Date(start),
//             endTime: end ? new Date(end) : null,
//             link: e.hangoutLink || e.htmlLink || null,
//           },
//         });
//       })
//     );

//     // 📝 Generate text summary for agent log
//     const eventsSummaryArray = dbEvents.map(
//       (e) =>
//         `🕒 ${e.startTime.toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         })} - ${e.title}`
//     );

//     await generateRunSummary(taskId, userId, eventsSummaryArray);
//     console.log(`[prebundled] Stored ${dbEvents.length} calendar events for ${userId}`);

//     return `📅 Stored ${dbEvents.length} events in DB.`;
//   } catch (err: any) {
//     console.error(`[prebundled] Calendar summary error:`, err);
//     return `❌ Calendar summary error: ${err.message}`;
//   }
// }


//this type of frontend we have decided apart from gmail auto reply, i want gmail auto reply to show that summary on lt what he have replied shown there, now what i want is that user can direclty reply from this frontend or maybe give a breife then ai reponse is replied as, what i want is to change this frontend file for showing real mails that has been replied, and ten user can enter its query for what to reply further if any, now what i thing is you have to think of is the how to save these reply deatils and all so that it can be replied later on using this type of frontend 

// import { google } from "googleapis";
// import prisma from "../../../../../../web/lib/db";
// import { callGemini } from "../../../../utils/geminiClient";
// import { getValidGmailAccessToken } from "../../../nodes/global.credentials";

// /**
//  * === Prebundled Autonomous Agents ===
//  * These are "specialized" autonomous tasks that don't use workflows.
//  * They are directly handled by the backend logic.
//  */

// // 1️⃣ Gmail Auto Reply Agent
// // export async function runGmailAutoReplyAgent(userId: string) {
// //   try {
// //     const accessToken = await getValidGmailAccessToken(userId);
// //     if (!accessToken) {
// //       console.warn(`[prebundled] No Gmail access token for user ${userId}`);
// //       return;
// //     }

// //     const oauth2Client = new google.auth.OAuth2();
// //     oauth2Client.setCredentials({ access_token: accessToken });
// //     const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// //     // Get unread emails
// //     const res = await gmail.users.messages.list({
// //       userId: "me",
// //       q: "is:unread in:inbox",
// //       maxResults: 5,
// //     });

// //     const messages = res.data.messages || [];
// //     if (!messages.length) {
// //       console.log(`[prebundled] No new unread emails for ${userId}`);
// //       return;
// //     }

// //     for (const msg of messages) {
// //       const fullMsg = await gmail.users.messages.get({
// //         userId: "me",
// //         id: msg.id!,
// //       });

// //       const snippet = fullMsg.data.snippet || "";
// //       const subjectHeader = fullMsg.data.payload?.headers?.find(
// //         (h) => h.name === "Subject"
// //       )?.value;

// //       const sender = fullMsg.data.payload?.headers?.find(
// //         (h) => h.name === "From"
// //       )?.value;

// //       // Create reply using Gemini
// //       const geminiResponse = await callGemini(
// //         `You are an AI email assistant. Write a short, professional reply to this email:\n\nSubject: ${subjectHeader}\n\nBody:\n${snippet}`
// //       );

// //       // Send reply
// //       const rawMessage = [
// //         `To: ${sender}`,
// //         "Subject: Re: " + subjectHeader,
// //         "In-Reply-To: " + msg.id,
// //         "References: " + msg.id,
// //         "",
// //         geminiResponse,
// //       ].join("\n");

// //       await gmail.users.messages.send({
// //         userId: "me",
// //         requestBody: {
// //           raw: Buffer.from(rawMessage)
// //             .toString("base64")
// //             .replace(/\+/g, "-")
// //             .replace(/\//g, "_"),
// //         },
// //       });

// //       console.log(`[prebundled] Replied to ${sender} (${subjectHeader})`);
// //     }
// //   } catch (err) {
// //     console.error(`[prebundled] Gmail auto-reply error:`, err);
// //   }
// // }

// const repliedMessageCache: Record<string, Set<string>> = {};

// export async function runGmailAutoReplyAgent(userId: string) {
//   try {
//     const accessToken = await getValidGmailAccessToken(userId);
//     if (!accessToken) {
//       console.warn(`[prebundled] No Gmail access token for user ${userId}`);
//       return;
//     }

//     // initialize per-user cache
//     if (!repliedMessageCache[userId]) repliedMessageCache[userId] = new Set();

//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const gmail = google.gmail({ version: "v1", auth: oauth2Client });

//     // safer query: only new inbox messages not from me
//     const res = await gmail.users.messages.list({
//       userId: "me",
//       q: "in:inbox is:unread -from:me",
//       maxResults: 5,
//     });

//     const messages = res.data.messages || [];
//     if (!messages.length) {
//       console.log(`[prebundled] No new messages for ${userId}`);
//       return;
//     }

//     for (const msg of messages) {
//       if (repliedMessageCache[userId].has(msg.id!)) continue; // skip already replied ones

//       const fullMsg = await gmail.users.messages.get({
//         userId: "me",
//         id: msg.id!,
//       });

//       const headers = fullMsg.data.payload?.headers || [];
//       const subject = headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
//       const sender = headers.find((h) => h.name === "From")?.value;
//       const messageId = headers.find((h) => h.name === "Message-ID")?.value;
//       const snippet = fullMsg.data.snippet || "";

//       if (!sender) continue;

//       // 🧠 Generate AI reply
//       const replyBody = await callGemini(
//         `You are a professional email assistant. Write a concise, friendly reply to this email:\n\nSubject: ${subject}\n\nBody:\n${snippet}`
//       );

//       // 📧 Construct reply in the same thread
//       const rawMessage = [
//         `To: ${sender}`,
//         `Subject: Re: ${subject}`,
//         `In-Reply-To: ${messageId}`,
//         `References: ${messageId}`,
//         "Content-Type: text/plain; charset=utf-8",
//         "",
//         replyBody,
//       ].join("\n");

//       await gmail.users.messages.send({
//         userId: "me",
//         requestBody: {
//           raw: Buffer.from(rawMessage)
//             .toString("base64")
//             .replace(/\+/g, "-")
//             .replace(/\//g, "_"),
//           threadId: fullMsg.data.threadId, // ✅ ensures reply in same thread
//         },
//       });

//       // mark as replied
//       repliedMessageCache[userId].add(msg.id!);

//       // optionally mark as read
//       await gmail.users.messages.modify({
//         userId: "me",
//         id: msg.id!,
//         requestBody: { removeLabelIds: ["UNREAD"] },
//       });

//       console.log(`[prebundled] Replied to ${sender} (subject: ${subject})`);
//     }
//   } catch (err) {
//     console.error(`[prebundled] Gmail auto-reply error:`, err);
//   }
// }

// // 2️⃣ Morning Calendar Summary Agent
// export async function runMorningCalendarSummaryAgent(userId: string) {
//   try {
//     const accessToken = await getValidGmailAccessToken(userId);
//     if (!accessToken) {
//       console.warn(`[prebundled] No Google Calendar token for ${userId}`);
//       return;
//     }

//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const calendar = google.calendar({ version: "v3", auth: oauth2Client });

//     const now = new Date();
//     const endOfDay = new Date(now);
//     endOfDay.setHours(23, 59, 59, 999);

//     const res = await calendar.events.list({
//       calendarId: "primary",
//       timeMin: now.toISOString(),
//       timeMax: endOfDay.toISOString(),
//       singleEvents: true,
//       orderBy: "startTime",
//     });

//     const events = res.data.items || [];
//     if (!events.length) {
//       console.log(`[prebundled] No events today for user ${userId}`);
//       return;
//     }

//     const eventsSummary = events
//       .map(
//         (e) =>
//           `🕒 ${e.start?.dateTime || e.start?.date} - ${e.summary || "No title"}`
//       )
//       .join("\n");

//     const aiSummary = await callGemini(
//       `You are a helpful assistant. Summarize the following list of today's calendar events in a friendly and concise tone:\n\n${eventsSummary}`
//     );

//     console.log(`[prebundled] Morning summary for ${userId}:\n${aiSummary}`);
//   } catch (err) {
//     console.error(`[prebundled] Calendar summary error:`, err);
//   }
// }

import { DynamicTool } from "langchain/tools";
import { gmail } from "./credential";
import collaborate from "../../../collaboration/collab";

/*
to be added in general
Core Features of Gmails: (Essential params)
- read emails (all)or filtered - count & query
- send emails - recipient, subject, body
- delete emails (not required)
- star or unstar Emails (not required)
- draft email (recipient, subject, body)
- @anish-check: remove unnecessary ones here

*/
const callAgent = new DynamicTool({
  name: "callAgent",
  description: `Call another assistant/agent by name. Input: JSON { assistantToCall: string, prompt: string }
  assistant can be: "AI Financial Expert" or "AI Legal Expert"
  prompt: it is the prompt or question which will be passed to the given agent here
  `,
  func: async (input: string) => {
    try {
      const { assistantToCall, prompt } = JSON.parse(input);
      if (!assistantToCall)
        return JSON.stringify({ error: "assistantToCall required" });
      if (!prompt) return JSON.stringify({ error: "prompt required" });

      // Delegate to a helper that finds & runs the right agent
      const result = await collaborate(assistantToCall, prompt);

      return JSON.stringify({
        success: true,
        agent: assistantToCall,
        response: result,
      });
    } catch (err) {
      return JSON.stringify({
        error: "Failed to call agent",
        details: (err as Error).message,
      });
    }
  },
});

function base64Encode(str: string) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const readEmails = new DynamicTool({
  name: "readEmails",
  description:
    "Reads Gmail messages. Expects JSON input with optional 'count' (default 5) and 'q' (query, default 'is:unread'). Supports 'today' as shorthand for emails from the current day.",
  func: async (input: string) => {
    try {
      let params = { count: 5, q: "is:unread" };

      if (input && input.trim()) {
        try {
          params = { ...params, ...JSON.parse(input) };
        } catch {
          params.q = input;
        }
      }

      // 🔥 Handle "today" as query
      if (params.q && params.q.toLowerCase() === "today") {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");

        const after = `${yyyy}/${mm}/${dd}`;
        // next day
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yyyyT = tomorrow.getFullYear();
        const mmT = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const ddT = String(tomorrow.getDate()).padStart(2, "0");
        const before = `${yyyyT}/${mmT}/${ddT}`;

        params.q = `after:${after} before:${before}`;
      }

      const listRes = await gmail.users.messages.list({
        userId: "me",
        maxResults: params.count,
        q: params.q,
      });

      const messages = listRes.data.messages || [];
      if (messages.length === 0) {
        return JSON.stringify({
          message: "No emails found",
          count: 0,
          emails: [],
        });
      }

      const detailed = await Promise.all(
        messages.map(async (msg: any) => {
          try {
            const full = await gmail.users.messages.get({
              userId: "me",
              id: msg.id!,
            });
            const headers = full.data.payload?.headers || [];
            return {
              id: msg.id,
              snippet: full.data.snippet,
              subject:
                headers.find((h: any) => h.name === "Subject")?.value ||
                "No Subject",
              from:
                headers.find((h: any) => h.name === "From")?.value ||
                "Unknown Sender",
              date: headers.find((h: any) => h.name === "Date")?.value || "",
            };
          } catch (msgError) {
            return { id: msg.id, error: "Failed to fetch message details" };
          }
        })
      );

      return JSON.stringify({ count: detailed.length, emails: detailed });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to read emails",
        details: (error as Error).message,
      });
    }
  },
});

const sendEmail = new DynamicTool({
  name: "sendEmail",
  description:
    "Sends an email. Expects JSON input: { recipient, subject, body }. If any field is missing, returns a prompt asking for more details.",
  func: async (input: string) => {
    let data;
    try {
      data = JSON.parse(input);
    } catch {
      return JSON.stringify({
        needsMoreInfo: true,
        message: "Invalid JSON. Please provide recipient, subject, and body.",
      });
    }

    const missingFields = [];
    if (!data.recipient) missingFields.push("recipient");
    if (!data.subject) missingFields.push("subject");
    if (!data.body) missingFields.push("body");

    if (missingFields.length > 0) {
      return JSON.stringify({
        needsMoreInfo: true,
        message: `Missing fields: ${missingFields.join(
          ", "
        )}. Please provide them to send the email.`,
      });
    }

    // All info is present, proceed to send email
    try {
      const emailContent = [
        `To: ${data.recipient}`,
        `Subject: ${data.subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        data.body,
      ].join("\r\n");

      const raw = base64Encode(emailContent);

      const result = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      return JSON.stringify({
        success: true,
        messageId: result.data.id,
        message: `Email sent to ${data.recipient}`,
      });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to send email",
        details: (error as Error).message,
      });
    }
  },
});

// @anish-check: here user will not supply a messageId so intregate a system by user can get a particular message
// by user of some filters or content, or sent by etc
const deleteEmail = new DynamicTool({
  name: "deleteEmail",
  description: "Deletes an email. Expects JSON input: { messageId }",
  func: async (input: string) => {
    try {
      const { messageId } = JSON.parse(input);
      if (!messageId) return JSON.stringify({ error: "messageId is required" });

      await gmail.users.messages.delete({ userId: "me", id: messageId });
      return JSON.stringify({ success: true, deletedId: messageId });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to delete email",
        details: (error as Error).message,
      });
    }
  },
});

const draftEmail = new DynamicTool({
  name: "draftEmail",
  description:
    "Creates a draft email. Expects JSON input: { recipient, subject, body }",
  func: async (input: string) => {
    try {
      const { recipient, subject, body } = JSON.parse(input);
      if (!recipient || !subject || !body) {
        return JSON.stringify({
          error: "recipient, subject, and body are required",
        });
      }

      const emailContent = [
        `To: ${recipient}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        body,
      ].join("\r\n");

      const raw = base64Encode(emailContent);

      const result = await gmail.users.drafts.create({
        userId: "me",
        requestBody: { message: { raw } },
      });

      return JSON.stringify({
        success: true,
        draftId: result.data.id,
        message: `Draft created for ${recipient}`,
      });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to create draft",
        details: (error as Error).message,
      });
    }
  },
});

// // 📌 List Labels
// const listLabels = new DynamicTool({
//   name: "listLabels",
//   description: "Lists all Gmail labels. No input required.",
//   func: async () => {
//     try {
//       const res = await gmail.users.labels.list({ userId: "me" });
//       return JSON.stringify({ labels: res.data.labels || [] });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to list labels",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// // 📌 Create Label
// const createLabel = new DynamicTool({
//   name: "createLabel",
//   description:
//     "Creates a new Gmail label. Input: { name, messageListVisibility?, labelListVisibility? }",
//   func: async (input: string) => {
//     try {
//       const body = JSON.parse(input);
//       const res = await gmail.users.labels.create({
//         userId: "me",
//         requestBody: body,
//       });
//       return JSON.stringify({ success: true, label: res.data });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to create label",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// // 📌 Modify Labels on a Message
// const modifyLabels = new DynamicTool({
//   name: "modifyLabels",
//   description:
//     "Adds/removes labels on a message. Input: { messageId, addLabels:[], removeLabels:[] }",
//   func: async (input: string) => {
//     try {
//       const { messageId, addLabels, removeLabels } = JSON.parse(input);
//       if (!messageId) return JSON.stringify({ error: "messageId required" });
//       const res = await gmail.users.messages.modify({
//         userId: "me",
//         id: messageId,
//         requestBody: {
//           addLabelIds: addLabels || [],
//           removeLabelIds: removeLabels || [],
//         },
//       });
//       return JSON.stringify({ success: true, message: res.data });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to modify labels",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// // 📌 Mark as Read / Unread
// const markReadUnread = new DynamicTool({
//   name: "markReadUnread",
//   description:
//     "Marks a message as read or unread. Input: { messageId, read: true|false }",
//   func: async (input: string) => {
//     try {
//       const { messageId, read } = JSON.parse(input);
//       if (!messageId) return JSON.stringify({ error: "messageId required" });
//       const res = await gmail.users.messages.modify({
//         userId: "me",
//         id: messageId,
//         requestBody: {
//           addLabelIds: read ? [] : ["UNREAD"],
//           removeLabelIds: read ? ["UNREAD"] : [],
//         },
//       });
//       return JSON.stringify({ success: true, message: res.data });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to mark read/unread",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// // 📌 List Threads
// const listThreads = new DynamicTool({
//   name: "listThreads",
//   description: "Lists Gmail threads. Input optional: { q, count }",
//   func: async (input: string) => {
//     try {
//       let params: any = { userId: "me", maxResults: 5 };
//       if (input && input.trim()) {
//         try {
//           const obj = JSON.parse(input);
//           if (obj.q) params.q = obj.q;
//           if (obj.count) params.maxResults = obj.count;
//         } catch {
//           params.q = input;
//         }
//       }
//       const res = await gmail.users.threads.list(params);
//       return JSON.stringify({ threads: res.data.threads || [] });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to list threads",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// // 📌 Trash / Untrash
// const trashEmail = new DynamicTool({
//   name: "trashEmail",
//   description: "Moves a message to trash. Input: { messageId }",
//   func: async (input: string) => {
//     try {
//       const { messageId } = JSON.parse(input);
//       const res = await gmail.users.messages.trash({
//         userId: "me",
//         id: messageId,
//       });
//       return JSON.stringify({ success: true, trashed: res.data });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to trash email",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// const untrashEmail = new DynamicTool({
//   name: "untrashEmail",
//   description: "Restores a trashed message. Input: { messageId }",
//   func: async (input: string) => {
//     try {
//       const { messageId } = JSON.parse(input);
//       const res = await gmail.users.messages.untrash({
//         userId: "me",
//         id: messageId,
//       });
//       return JSON.stringify({ success: true, untrashed: res.data });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to untrash email",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// // 📌 Star / Unstar
// const starEmail = new DynamicTool({
//   name: "starEmail",
//   description: "Stars a message. Input: { messageId }",
//   func: async (input: string) => {
//     try {
//       const { messageId } = JSON.parse(input);
//       const res = await gmail.users.messages.modify({
//         userId: "me",
//         id: messageId,
//         requestBody: { addLabelIds: ["STARRED"] },
//       });
//       return JSON.stringify({ success: true, starred: res.data });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to star email",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

// const unstarEmail = new DynamicTool({
//   name: "unstarEmail",
//   description: "Removes star from a message. Input: { messageId }",
//   func: async (input: string) => {
//     try {
//       const { messageId } = JSON.parse(input);
//       const res = await gmail.users.messages.modify({
//         userId: "me",
//         id: messageId,
//         requestBody: { removeLabelIds: ["STARRED"] },
//       });
//       return JSON.stringify({ success: true, unstarred: res.data });
//     } catch (error) {
//       return JSON.stringify({
//         error: "Failed to unstar email",
//         details: (error as Error).message,
//       });
//     }
//   },
// });

export {
  readEmails,
  sendEmail,
  deleteEmail,
  draftEmail,
  listLabels,
  createLabel,
  modifyLabels,
  markReadUnread,
  listThreads,
  trashEmail,
  untrashEmail,
  starEmail,
  unstarEmail,
  callAgent,
};

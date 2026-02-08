import { google } from "googleapis";

export async function sendGmailReply({
  accessToken,
  to,
  subject,
  inReplyTo,
  threadId,
  body,
}: {
  accessToken: string;
  to: string;
  subject?: string;
  inReplyTo?: string | null;
  threadId?: string | null;
  body: string;
}) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const safeBody = (body ?? "").trim() || "(No message content)";

  // IMPORTANT: keep an explicit blank string between headers and body.
  // DO NOT remove/strip it (don't .filter(Boolean) the array).
  const messageLines = [
    `From: me`,
    `To: ${to}`,
    `Subject: ${subject ? `Re: ${subject}` : "Re: (no subject)"}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : "",
    inReplyTo ? `References: ${inReplyTo}` : "",
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    safeBody,
  ];

  const raw = messageLines.join("\r\n");
  console.log("RAW MIME:\n", raw);

  const encodedMessage = Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
      threadId: threadId || undefined,
    },
  });

  return res.data;
}

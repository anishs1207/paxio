//apps\backend\src\agents\mainCredentials.ts
import { google } from "googleapis";
import {
  getValidGoogleCalendarAccessToken,
  getValidGmailAccessToken,
  getValidNotionAccessToken,
} from "@/lib/tokenHelpers";
import { Client as NotionClient } from "@notionhq/client";

type ServiceResult<T> = T | false;

export default async function TestAllCredentials(userId: string): Promise<{
  gmail: ServiceResult<unknown>;
  calendar: ServiceResult<unknown>;
  notion: ServiceResult<NotionClient>;
}> {
  let gmail: ServiceResult<unknown> = false;
  let calendar: ServiceResult<unknown> = false;
  let notion: ServiceResult<NotionClient> = false;

  /* ---------------- GOOGLE ENV CHECK ---------------- */
  const hasGoogleEnv =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI;

  /* ---------------- CALENDAR ---------------- */
  if (hasGoogleEnv) {
    try {
      const calendarToken = await getValidGoogleCalendarAccessToken(userId);

      if (calendarToken) {
        const calendarOAuth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        calendarOAuth.setCredentials({ access_token: calendarToken });

        const calendarClient = google.calendar({
          version: "v3",
          auth: calendarOAuth,
        });

        // Test call
        await calendarClient.calendarList.list({ maxResults: 1 });

        calendar = calendarClient;
        console.log("✅ Google Calendar connected");
      }
    } catch (err) {
      console.error("❌ Google Calendar failed:", err);
      calendar = false;
    }
  }

  /* ---------------- GMAIL ---------------- */
  if (hasGoogleEnv) {
    try {
      const gmailToken = await getValidGmailAccessToken(userId);

      if (gmailToken) {
        const gmailOAuth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        gmailOAuth.setCredentials({ access_token: gmailToken });

        const gmailClient = google.gmail({
          version: "v1",
          auth: gmailOAuth,
        });

        // Test call
        await gmailClient.users.getProfile({ userId: "me" });

        gmail = gmailClient;
        console.log("✅ Gmail connected");
      }
    } catch (err) {
      console.error("❌ Gmail failed:", err);
      gmail = false;
    }
  }

  /* ---------------- NOTION ---------------- */
  if (process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET) {
    try {
      const notionToken = await getValidNotionAccessToken(userId);

      if (notionToken) {
        const notionClient = new NotionClient({ auth: notionToken });

        // Test call
        //@ts-expect-error - Notion client might have version-specific typing issues with the users.me method
        await notionClient.users.me({});

        notion = notionClient;
        console.log("✅ Notion connected");
      }
    } catch (err: unknown) {
      console.error("❌ Notion failed:", (err as Error)?.message || err);
      notion = false;
    }
  }

  /* ---------------- FINAL RETURN ---------------- */
  return {
    gmail,
    calendar,
    notion,
  };
}

// apps/backend/src/nodes/outreach/gmail/credential.ts
import { google } from "googleapis";
import { getValidGmailAccessToken } from "@/backend/global.credentials"; // import your function

let gmail: any;

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

/**
 * @param userId - ID of the user to fetch the valid Gmail access token
 */
export default async function getGmailCredentialsAndTestConnection(
  userId: string
) {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    return { success: false, message: "Missing credentials" };
  }

  console.log(".env val done");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  console.log("client made");

  // Fetch valid Gmail access token for this user
  const googleAccessToken = await getValidGmailAccessToken(userId);
  if (!googleAccessToken) {
    return {
      success: false,
      message: "No valid Gmail access token found for user.",
    };
  }

  oauth2Client.setCredentials({
    access_token: googleAccessToken,
  });

  console.log("access token is set");

  gmail = google.gmail({ version: "v1", auth: oauth2Client });

  console.log("got the google object");

  try {
    const profile = await gmail.users.getProfile({ userId: "me" });
    console.log("Gmail connection successful:", profile.data.emailAddress);
    console.log("connected tested successfully");
    return { success: true, message: "Gmail connection successful" };
  } catch (authError) {
    console.error("Gmail authentication failed:", authError);
    return { success: false, message: "Gmail authentication failed" };
  }
}

export { gmail, SCOPES };

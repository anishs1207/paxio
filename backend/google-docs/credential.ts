// apps/backend/src/nodes/docs/credential.ts
import { google } from "googleapis";
import {
  getValidGoogleDocsAccessToken,
  getValidGoogleDriveAccessToken,
} from "../../global.credentials";

let docs: any;
let drive: any;

const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
];

/**
 * Get Google Docs + Drive OAuth2 credentials for a user and test connection
 * @param userId - The ID of the user
 */
export default async function getGoogleDocsAndDriveCredentialsAndTestConnection(
  userId: string
) {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    return {
      success: false,
      message: "Missing Google API credentials in .env",
    };
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Fetch valid Google Docs and Drive access tokens for this user
  const docsAccessToken = await getValidGoogleDocsAccessToken(userId);
  const driveAccessToken = await getValidGoogleDriveAccessToken(userId);

  if (!docsAccessToken || !driveAccessToken) {
    return {
      success: false,
      message: "No valid Docs/Drive access token found for user.",
    };
  }

  oauth2Client.setCredentials({ access_token: docsAccessToken });

  docs = google.docs({ version: "v1", auth: oauth2Client });
  drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    // Test Drive: List 5 files
    const res = await drive.files.list({
      pageSize: 5,
      fields: "files(id, name)",
    });

    console.log(
      "✅ Docs + Drive connection successful. Files found:",
      res.data.files?.length || 0
    );
    return {
      success: true,
      message: "Google Docs + Drive connection successful",
    };
  } catch (authError) {
    console.error("❌ Docs/Drive authentication failed:", authError);
    return {
      success: false,
      message: "Google Docs/Drive authentication failed",
    };
  }
}

export { docs, drive, SCOPES };

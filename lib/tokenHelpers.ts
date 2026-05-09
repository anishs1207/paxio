import { google } from "googleapis";
import prisma from "./db";
import type { User } from "../generated/prisma";
import {
  getValidNotionAccessToken,
} from "./nodeHelpers";

/* ---------- GOOGLE HELPER ---------- */
async function refreshGoogleToken(userId: string, service: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const accessTokenField = `${service}AccessToken` as keyof User;
  const refreshTokenField = `${service}RefreshToken` as keyof User;
  const expiryField = `${service}Expiry` as keyof User;

  let accessToken = user[accessTokenField] as string;
  const refreshToken = user[refreshTokenField] as string;
  let expiry = user[expiryField] as number;

  if (!refreshToken) {
    return false;
  }

  if (
    !accessToken ||
    !expiry ||
    Date.now() >
      (typeof expiry === "bigint" ? Number(expiry) : expiry) - 60 * 1000
  ) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();
    accessToken = credentials.access_token!;
    expiry = credentials.expiry_date!;

    await prisma.user.update({
      where: { id: userId },
      data: {
        [accessTokenField]: accessToken,
        [expiryField]: expiry,
      },
    });
  }

  return accessToken;
}

async function getValidGmailAccessToken(userId: string) {
  return refreshGoogleToken(userId, "gmail");
}

async function getValidGoogleDocsAccessToken(userId: string) {
  return refreshGoogleToken(userId, "googleDocs");
}

async function getValidGoogleSheetsAccessToken(userId: string) {
  return refreshGoogleToken(userId, "googleSheets");
}

async function getValidGoogleCalendarAccessToken(userId: string) {
  return refreshGoogleToken(userId, "googleCalendar");
}

async function getValidGoogleDriveAccessToken(userId: string) {
  return refreshGoogleToken(userId, "googleDrive");
}

async function getValidGoogleFormsAccessToken(userId: string) {
  return refreshGoogleToken(userId, "googleForms");
}

export {
  getValidGmailAccessToken,
  getValidGoogleDocsAccessToken,
  getValidGoogleSheetsAccessToken,
  getValidGoogleDriveAccessToken,
  getValidGoogleCalendarAccessToken,
  getValidGoogleFormsAccessToken,
  getValidNotionAccessToken,
};

import prisma from "@/lib/db";

export async function getUserConnectedNodes(userId: string) {
  console.log(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gmailRefreshToken: true,
      googleSheetsRefreshToken: true,
      // slackRefreshToken: true,
      notionAccessToken: true,
      googleCalendarRefreshToken: true,
      googleDocsRefreshToken: true,
      googleDriveRefreshToken: true,
      // outlookRefreshToken: true,
      // calendlyRefreshToken: true,
      // twitterAccessToken: true,
      // redditAccessToken: true,
      // googleFormsAccessToken: true,
      // airtableRefreshToken: true,
      // typeformRefreshToken: true,
      // linearRefreshToken: true,
    },
  });

  if (!user) return null;

  // Build status map
  const status = {
    gmail: !!user.gmailRefreshToken,
    sheets: !!user.googleSheetsRefreshToken,
    // slack: !!user.slackRefreshToken,
    notion: !!user.notionAccessToken,
    calendar: !!user.googleCalendarRefreshToken,
    docs: !!user.googleDocsRefreshToken,
    drive: !!user.googleDriveRefreshToken,
    // outlook: !!user.outlookRefreshToken,
    // calendly: !!user.calendlyRefreshToken,
    // twitter: !!user.twitterAccessToken,
    // reddit: !!user.redditAccessToken,
    // forms: !!user.googleFormsAccessToken,
    // linear: !!user.linearRefreshToken,
    // airtable: !!user.airtableRefreshToken,
    // typeform: !!user.typeformRefreshToken,
    "creative-node":true
  };

  console.log("returning status");

  return status;
}

export async function getPermittedNodes(userId: string) {
  console.log("in permitted nodes");
  console.log("userid", userId);
  const status = await getUserConnectedNodes(userId);
  console.log("status", status);
  if (!status) return [];
  return Object.keys(status).filter((k) => status[k as keyof typeof status]);
}

import prisma from "./db";

/* ---------- OUTLOOK HELPER ---------- */
// async function getValidOutlookAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     outlookAccessToken: accessToken,
//     outlookRefreshToken: refreshToken,
//     outlookExpiry: expiry,
//   } = user;

//   if (!accessToken || !expiry || Date.now() > expiry - 60 * 1000) {
//     if (!refreshToken) throw new Error("No Outlook refresh token available");

//     const params = new URLSearchParams();
//     params.append("client_id", process.env.OUTLOOK_CLIENT_ID!);
//     params.append("client_secret", process.env.OUTLOOK_CLIENT_SECRET!);
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken);

//     const response = await axios.post(
//       "https://login.microsoftonline.com/common/oauth2/v2.0/token",
//       params.toString(),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const data = response.data;
//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         outlookAccessToken: accessToken,
//         outlookRefreshToken: data.refresh_token ?? refreshToken,
//         outlookExpiry: expiry,
//       },
//     });
//   }

//   return accessToken;
// }
// /* ---------- SLACK HELPER ---------- */
// async function getValidSlackAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     slackAccessToken: accessToken,
//     slackRefreshToken: refreshToken,
//     slackExpiry: expiry,
//   } = user;

//   // if the refresh token is not present
//   if (!refreshToken) {
//     return false;
//   }

//   if (!accessToken || !expiry || Date.now() > expiry - 60 * 1000) {
//     const params = new URLSearchParams();
//     params.append("client_id", process.env.SLACK_CLIENT_ID!);
//     params.append("client_secret", process.env.SLACK_CLIENT_SECRET!);
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken!);

//     const response = await axios.post(
//       "https://slack.com/api/oauth.v2.access",
//       params
//     );
//     const data = response.data;

//     if (!data.ok) throw new Error("Slack refresh failed: " + data.error);

//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         slackAccessToken: accessToken,
//         slackRefreshToken: data.refresh_token ?? refreshToken,
//         slackExpiry: expiry,
//       },
//     });
//   }

//   return accessToken!;
// }

/* ---------- NOTION HELPER ---------- */
async function getValidNotionAccessToken(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const { notionAccessToken: accessToken } = user;

  if (!accessToken) {
    return false;
  }

  return accessToken!;
}

/* ---------- CALENDLY HELPER ---------- */
// async function getValidCalendlyAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     calendlyAccessToken: accessToken,
//     calendlyRefreshToken: refreshToken,
//     calendlyExpiry: expiry,
//   } = user;

//   if (!refreshToken) {
//     return false;
//   }

//   if (!accessToken || !expiry || Date.now() > expiry - 60 * 1000) {
//     const params = new URLSearchParams();
//     params.append("client_id", process.env.CALENDLY_CLIENT_ID!);
//     params.append("client_secret", process.env.CALENDLY_CLIENT_SECRET!);
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken);

//     const response = await axios.post(
//       "https://auth.calendly.com/oauth/token",
//       params.toString(),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const data = response.data;
//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         calendlyAccessToken: accessToken,
//         calendlyRefreshToken: data.refresh_token ?? refreshToken,
//         calendlyExpiry: expiry,
//       },
//     });
//   }

//   return accessToken;
// }

/* ---------- TWITTER HELPER ---------- */
// async function getValidTwitterAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     twitterAccessToken: accessToken,
//     twitterRefreshToken: refreshToken,
//     twitterExpiry: expiry,
//   } = user;

//   if (!refreshToken) return false;

//   if (!accessToken || !expiry || Date.now() > expiry - 60 * 1000) {
//     const params = new URLSearchParams();
//     params.append("client_id", process.env.TWITTER_CLIENT_ID!);
//     params.append("client_secret", process.env.TWITTER_CLIENT_SECRET!);
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken);

//     const response = await axios.post(
//       "https://api.twitter.com/2/oauth2/token",
//       params.toString(),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const data = response.data;
//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         twitterAccessToken: accessToken,
//         twitterRefreshToken: data.refresh_token ?? refreshToken,
//         twitterExpiry: expiry,
//       },
//     });
//   }

//   return accessToken;
// }

/* ---------- REDDIT HELPER ---------- */
// async function getValidRedditAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     redditAccessToken: accessToken,
//     redditRefreshToken: refreshToken,
//     redditExpiry: expiry,
//   } = user;

//   if (!refreshToken) return false;

//   if (!accessToken || !expiry || Date.now() > expiry - 60 * 1000) {
//     const params = new URLSearchParams();
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken);

//     const response = await axios.post(
//       "https://www.reddit.com/api/v1/access_token",
//       params.toString(),
//       {
//         auth: {
//           username: process.env.REDDIT_CLIENT_ID!,
//           password: process.env.REDDIT_CLIENT_SECRET!,
//         },
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       }
//     );

//     const data = response.data;
//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         redditAccessToken: accessToken,
//         redditRefreshToken: data.refresh_token ?? refreshToken,
//         redditExpiry: expiry,
//       },
//     });
//   }

//   return accessToken;
// }

// async function getValidLinearAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     linearAccessToken: accessToken,
//     linearRefreshToken: refreshToken,
//     linearExpiry: expiry,
//   } = user;

//   if (!refreshToken) return false;

//   if (!accessToken || !expiry || Date.now() > Number(expiry) - 60 * 1000) {
//     const params = new URLSearchParams();
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken);

//     const response = await axios.post(
//       "https://api.linear.app/oauth/refresh",
//       params.toString(),
//       {
//         auth: {
//           username: process.env.LINEAR_CLIENT_ID!,
//           password: process.env.LINEAR_CLIENT_SECRET!,
//         },
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       }
//     );

//     const data = response.data;
//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         linearAccessToken: accessToken,
//         linearRefreshToken: data.refresh_token ?? refreshToken,
//         linearExpiry: BigInt(expiry),
//       },
//     });
//   }

//   return accessToken;
// }

// ------------------- Typeform -------------------
// async function getValidTypeformAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     typeformAccessToken: accessToken,
//     typeformRefreshToken: refreshToken,
//     typeformExpiry: expiry,
//   } = user;

//   if (!refreshToken) return false;

//   if (!accessToken || !expiry || Date.now() > Number(expiry) - 60 * 1000) {
//     const params = new URLSearchParams();
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken);

//     const response = await axios.post(
//       "https://api.typeform.com/oauth/token",
//       params.toString(),
//       {
//         auth: {
//           username: process.env.TYPEFORM_CLIENT_ID!,
//           password: process.env.TYPEFORM_CLIENT_SECRET!,
//         },
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       }
//     );

//     const data = response.data;
//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         typeformAccessToken: accessToken,
//         typeformRefreshToken: data.refresh_token ?? refreshToken,
//         typeformExpiry: BigInt(expiry),
//       },
//     });
//   }

//   return accessToken;
// }

// ------------------- Airtable -------------------
// async function getValidAirtableAccessToken(userId: string) {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   let {
//     airtableAccessToken: accessToken,
//     airtableRefreshToken: refreshToken,
//     airtableExpiry: expiry,
//   } = user;

//   if (!refreshToken) return false;

//   if (!accessToken || !expiry || Date.now() > Number(expiry) - 60 * 1000) {
//     const params = new URLSearchParams();
//     params.append("grant_type", "refresh_token");
//     params.append("refresh_token", refreshToken);

//     const response = await axios.post(
//       "https://airtable.com/oauth2/v1/token",
//       params.toString(),
//       {
//         auth: {
//           username: process.env.AIRTABLE_CLIENT_ID!,
//           password: process.env.AIRTABLE_CLIENT_SECRET!,
//         },
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       }
//     );

//     const data = response.data;
//     accessToken = data.access_token;
//     expiry = Date.now() + data.expires_in * 1000;

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         airtableAccessToken: accessToken,
//         airtableRefreshToken: data.refresh_token ?? refreshToken,
//         airtableExpiry: BigInt(expiry),
//       },
//     });
//   }

//   return accessToken;
// }

export {
  // getValidOutlookAccessToken,
  // getValidSlackAccessToken,
  getValidNotionAccessToken,
  // getValidCalendlyAccessToken,
  // getValidTwitterAccessToken,
  // getValidRedditAccessToken,
  // getValidLinearAccessToken,
  // getValidAirtableAccessToken,
  // getValidTypeformAccessToken,
};

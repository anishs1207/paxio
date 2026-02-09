import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";

const serviceScopes: Record<string, string[]> = {
  gmail: [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/drive",
  ],
  forms: [
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/drive.file",
  ],
  sheets: [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/drive",
  ],
  calendly: ["default"],
  docs: [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.file",
  ],
  calendar: ["https://www.googleapis.com/auth/calendar"],
  drive: ["https://www.googleapis.com/auth/drive"],
  notion: [],
  outlook: [
    "openid",
    "offline_access",
    "https://graph.microsoft.com/Mail.ReadWrite",
    "https://graph.microsoft.com/Contacts.ReadWrite",
    "https://graph.microsoft.com/Calendars.ReadWrite",
  ],
  slack: [
    "channels:read",
    "chat:write",
    "users:read",
    "users:read.email",
    "groups:read",
    "im:read",
  ],
  reddit: ["identity", "read", "submit"],
  twitter: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  linear: ["read", "write"],
  airtable: [
    "data.records:read",
    "data.records:write",
    "data.bases:read",
    "data.bases:write",
  ],
  typeform: ["accounts:read", "forms:read", "forms:write", "responses:read"],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { service } = resolvedParams;

    if (!service || !serviceScopes[service]) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }

    if (service == "notion") {
      const notionAuthUrl = new URL(
        "https://api.notion.com/v1/oauth/authorize"
      );
      notionAuthUrl.searchParams.set(
        "client_id",
        process.env.NOTION_CLIENT_ID!
      );
      notionAuthUrl.searchParams.set("response_type", "code");
      notionAuthUrl.searchParams.set("owner", "user");
      notionAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.NOTION_REDIRECT_URI!
      );
      notionAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      return NextResponse.redirect(notionAuthUrl.toString());
    } else if (service == "outlook") {
      const outlookAuthUrl = new URL(
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
      );
      outlookAuthUrl.searchParams.set(
        "client_id",
        process.env.OUTLOOK_CLIENT_ID!
      );
      outlookAuthUrl.searchParams.set("response_type", "code");
      outlookAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.OUTLOOK_REDIRECT_URI!
      );
      outlookAuthUrl.searchParams.set(
        "scope",
        //@ts-ignore
        serviceScopes?.outlook.join(" ")
      );
      outlookAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      return NextResponse.redirect(outlookAuthUrl.toString());
    } else if (service == "slack") {
      // Slack OAuth

      const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
      slackAuthUrl.searchParams.set("client_id", process.env.SLACK_CLIENT_ID!);
      //@ts-ignore
      slackAuthUrl.searchParams.set("scope", serviceScopes?.slack.join(","));
      slackAuthUrl.searchParams.set("user_scope", "");
      slackAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.SLACK_REDIRECT_URI!
      );
      slackAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );
      return NextResponse.redirect(slackAuthUrl.toString());
    } else if (service === "calendly") {
      console.log("CALENDY client id", process.env.CALENDLY_CLIENT_ID);
      console.log("CALDENALY redirect uri");
      const calendlyAuthUrl = new URL(
        "https://auth.calendly.com/oauth/authorize"
      );
      calendlyAuthUrl.searchParams.set(
        "client_id",
        process.env.CALENDLY_CLIENT_ID!
      );
      calendlyAuthUrl.searchParams.set("response_type", "code");
      calendlyAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.CALENDLY_REDIRECT_URI!
      );
      calendlyAuthUrl.searchParams.set(
        "scope",
        //@ts-ignore
        serviceScopes.calendly.join(" ")
      );
      calendlyAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      return NextResponse.redirect(calendlyAuthUrl.toString());
    } else if (service === "twitter") {
      console.log();
      const twitterAuthUrl = new URL("https://twitter.com/i/oauth2/authorize");
      twitterAuthUrl.searchParams.set("response_type", "code");
      twitterAuthUrl.searchParams.set(
        "client_id",
        process.env.TWITTER_CLIENT_ID!
      );
      twitterAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.TWITTER_REDIRECT_URI!
      ); //@ts-ignore
      twitterAuthUrl.searchParams.set("scope", serviceScopes.twitter.join(" "));
      twitterAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );
      twitterAuthUrl.searchParams.set(
        "code_challenge",
        "YOUR_PKCE_CODE_CHALLENGE"
      );
      twitterAuthUrl.searchParams.set("code_challenge_method", "plain"); // or S256 if using SHA256 PKCE

      return NextResponse.redirect(twitterAuthUrl.toString());
    } else if (service == "outlook") {
      const redditAuthUrl = new URL("https://www.reddit.com/api/v1/authorize");
      redditAuthUrl.searchParams.set(
        "client_id",
        process.env.REDDIT_CLIENT_ID!
      );
      redditAuthUrl.searchParams.set("response_type", "code");
      redditAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.REDDIT_REDIRECT_URI!
      );
      redditAuthUrl.searchParams.set(
        "duration",
        "permanent" // Use 'permanent' for a refresh token
      );
      // @ts-ignore
      redditAuthUrl.searchParams.set("scope", serviceScopes.reddit.join(" "));
      redditAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      return NextResponse.redirect(redditAuthUrl.toString());
    } else if (service == "reddit") {
      const redditAuthUrl = new URL("https://www.reddit.com/api/v1/authorize");
      redditAuthUrl.searchParams.set(
        "client_id",
        process.env.REDDIT_CLIENT_ID!
      );
      redditAuthUrl.searchParams.set("response_type", "code");
      redditAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.REDDIT_REDIRECT_URI!
      );
      redditAuthUrl.searchParams.set("duration", "permanent");
      // @ts-ignore
      redditAuthUrl.searchParams.set("scope", serviceScopes.reddit.join(" "));
      redditAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      return NextResponse.redirect(redditAuthUrl.toString());
    } else if (service === "linear") {
      const linearAuthUrl = new URL("https://linear.app/oauth/authorize");

      console.log(
        "testing",
        process.env.LINEAR_CLIENT_ID,
        process.env.LINEAR_REDIRECT_URI,
        process.env.LINEAR_REDIRECT_URI
      );

      linearAuthUrl.searchParams.set(
        "client_id",
        process.env.LINEAR_CLIENT_ID!
      );
      linearAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.LINEAR_REDIRECT_URI!
      );
      linearAuthUrl.searchParams.set("response_type", "code");
      linearAuthUrl.searchParams.set("scope", serviceScopes.linear.join(" "));
      linearAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      return NextResponse.redirect(linearAuthUrl.toString());
    } else if (service === "airtable") {
      const airtableAuthUrl = new URL(
        "https://airtable.com/oauth2/v1/authorize"
      );

      airtableAuthUrl.searchParams.set(
        "client_id",
        process.env.AIRTABLE_CLIENT_ID!
      );
      airtableAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.AIRTABLE_REDIRECT_URI!
      );
      airtableAuthUrl.searchParams.set("response_type", "code");
      airtableAuthUrl.searchParams.set(
        "scope",
        serviceScopes.airtable.join(" ")
      );
      airtableAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      console.log("Final Airtable Auth URL:", airtableAuthUrl.toString());

      console.log("airtable connect");

      return NextResponse.redirect(airtableAuthUrl.toString());
    } else if (service === "typeform") {
      const typeformAuthUrl = new URL(
        "https://api.typeform.com/oauth/authorize"
      );

      typeformAuthUrl.searchParams.set(
        "client_id",
        process.env.TYPEFORM_CLIENT_ID!
      );
      typeformAuthUrl.searchParams.set("response_type", "code");
      typeformAuthUrl.searchParams.set(
        "redirect_uri",
        process.env.TYPEFORM_REDIRECT_URI!
      );
      // @ts-ignore
      typeformAuthUrl.searchParams.set(
        "scope",
        serviceScopes.typeform.join(" ")
      );
      typeformAuthUrl.searchParams.set(
        "state",
        JSON.stringify({ userId: session.user.id, service })
      );

      return NextResponse.redirect(typeformAuthUrl.toString());
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      `${process.env.NEXTAUTH_URL}/api/connect/callback`
    );

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: serviceScopes[service],
      prompt: "consent",
      state: JSON.stringify({ userId: session.user.id, service }),
    });

    console.log(authorizationUrl);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Error during authorization setup:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

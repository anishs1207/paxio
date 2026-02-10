import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getGeminiLLM, getGeminiLLMByIndex, getApiKeyCount, rotateApiKey } from "../utils/GeminiChatModel";
import TestAllCredentials from "./mainCredentials";
import * as chrono from "chrono-node";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
export { chrono };
import {
  getShortTermMemory,
  saveShortTermMemory,
  getRelevantLongTermMemory,
  extractLongTermMemoryFromText,
  saveLongTermMemory,
} from "../memory/memory";
import { streamVoiceMessage } from "../utils/ws";
import prisma from "@/lib/db";
import { BrowserUseClient } from "browser-use-sdk";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

/* ============================================================
   TYPES
============================================================ */
type RunMainAgentInput = {
  prompt: string;
  socketId?: string;
  userId: string;
  conversationId?: string;
  assistant?: string;
  files?: File[];
};

type RunMainAgentOutput = {
  response: string;
};

/* ============================================================
   NOTION TOOLS
============================================================ */

function createNotionTools(notion: any) {
  if (!notion) {
    console.log("⚠️  Notion credentials not available");
    return [];
  }

  console.log("✅ Creating Notion tools");
  const tools = [];

  tools.push(
    tool(
      async ({
        query,
        pageSize = 10,
        sortDirection,
        sortTimestamp,
        startCursor,
      }) => {
        try {
          // Build search options
          const searchOptions: any = {
            query,
            page_size: Math.min(Math.max(1, pageSize), 100),
            filter: { property: "object", value: "page" },
          };

          // Add sorting if specified
          if (sortDirection && sortTimestamp) {
            searchOptions.sort = {
              direction: sortDirection,
              timestamp: sortTimestamp,
            };
          }

          // Add pagination cursor
          if (startCursor) {
            searchOptions.start_cursor = startCursor;
          }

          const res = await notion?.search(searchOptions);
          const pages = res?.results || [];

          if (pages.length === 0) {
            return JSON.stringify({
              success: true,
              message: "No pages found",
              count: 0,
              pages: [],
            });
          }

          return JSON.stringify({
            success: true,
            count: pages.length,
            hasMore: res?.has_more || false,
            nextCursor: res?.next_cursor || null,
            pages: pages.map((page: any) => ({
              pageId: page.id,
              title:
                page.properties?.title?.title?.[0]?.plain_text ||
                page.properties?.Name?.title?.[0]?.plain_text ||
                "Untitled",
              url: page.url,
              createdTime: page.created_time,
              lastEditedTime: page.last_edited_time,
              icon: page.icon,
              cover: page.cover,
            })),
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to search page",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_searchPage",
        description:
          "Search for Notion pages by title with sorting and pagination. Use this when user asks to find, search, or locate Notion pages.",
        schema: z.object({
          query: z
            .string()
            .describe("The title or keywords to search for in Notion pages"),
          pageSize: z
            .number()
            .optional()
            .describe("Number of results to return (1-100, default: 10)"),
          sortDirection: z
            .enum(["ascending", "descending"])
            .optional()
            .describe("Sort direction for results"),
          sortTimestamp: z
            .enum(["last_edited_time", "created_time"])
            .optional()
            .describe("Sort by 'last_edited_time' or 'created_time'"),
          startCursor: z
            .string()
            .optional()
            .describe("Pagination cursor from previous search (nextCursor)"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({
        query,
        pageSize = 10,
        sortDirection,
        sortTimestamp,
        startCursor,
      }) => {
        try {
          // Build search options
          const searchOptions: any = {
            query,
            filter: { property: "object", value: "database" },
            page_size: Math.min(Math.max(1, pageSize), 100),
          };

          // Add sorting if specified
          if (sortDirection && sortTimestamp) {
            searchOptions.sort = {
              direction: sortDirection,
              timestamp: sortTimestamp,
            };
          }

          // Add pagination cursor
          if (startCursor) {
            searchOptions.start_cursor = startCursor;
          }

          const res = await notion?.search(searchOptions);
          const databases = res?.results || [];

          if (databases.length === 0) {
            return JSON.stringify({
              success: true,
              message: "No databases found",
              count: 0,
              databases: [],
            });
          }

          return JSON.stringify({
            success: true,
            count: databases.length,
            hasMore: res?.has_more || false,
            nextCursor: res?.next_cursor || null,
            databases: databases.map((db: any) => ({
              databaseId: db.id,
              title: db.title?.[0]?.plain_text || "Untitled",
              description: db.description?.[0]?.plain_text || "",
              url: db.url,
              createdTime: db.created_time,
              lastEditedTime: db.last_edited_time,
              icon: db.icon,
              properties: Object.keys(db.properties || {}),
            })),
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to search database",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_searchDatabase",
        description:
          "Search for Notion databases by name with sorting and pagination. Use this when user wants to find databases to query or create pages in.",
        schema: z.object({
          query: z.string().describe("The database name or keywords to search for"),
          pageSize: z
            .number()
            .optional()
            .describe("Number of results to return (1-100, default: 10)"),
          sortDirection: z
            .enum(["ascending", "descending"])
            .optional()
            .describe("Sort direction for results"),
          sortTimestamp: z
            .enum(["last_edited_time", "created_time"])
            .optional()
            .describe("Sort by 'last_edited_time' or 'created_time'"),
          startCursor: z
            .string()
            .optional()
            .describe("Pagination cursor from previous search (nextCursor)"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ pageId }) => {
        try {
          const blocks = await notion?.blocks.children.list({
            block_id: pageId,
          });
          return JSON.stringify({ success: true, blocks: blocks?.results });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to read page",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_readPageById",
        description:
          "Read the content of a Notion page using its ID. Use this after searching for a page to get its full content.",
        schema: z.object({
          pageId: z.string().describe("The unique ID of the Notion page"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ title }) => {
        try {
          const searchRes = await notion?.search({
            query: title,
            page_size: 1,
          });
          const page = searchRes?.results?.[0];
          if (!page) return JSON.stringify({ error: "No page found" });

          const blocks = await notion?.blocks.children.list({
            block_id: (page as any).id,
          });
          return JSON.stringify({
            success: true,
            pageId: (page as any).id,
            title:
              (page as any).properties?.title?.title?.[0]?.plain_text ||
              "Untitled",
            blocks: blocks?.results,
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to read page",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_readPageByTitle",
        description:
          "Read a Notion page by searching for its title and retrieving its content in one step. Use this when user asks to read, view, or show a page by name.",
        schema: z.object({
          title: z.string().describe("The title of the page to read"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ parentDatabaseId, title }) => {
        try {
          const res = await notion.pages.create({
            parent: { database_id: parentDatabaseId },
            properties: {
              title: { title: [{ text: { content: title } }] },
            },
          });
          return JSON.stringify({ success: true, pageId: res.id, title });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to create page",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_createPageInDatabase",
        description:
          "Create a new page in a Notion database using the database ID. Use this after searching for a database.",
        schema: z.object({
          parentDatabaseId: z
            .string()
            .describe("The database ID where the page should be created"),
          title: z.string().describe("The title for the new page"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ databaseName, title }) => {
        try {
          const searchRes = await notion?.search({
            query: databaseName,
            filter: { property: "object", value: "database" },
            page_size: 1,
          });
          const db = searchRes?.results?.[0];
          if (!db) return JSON.stringify({ error: "Database not found" });

          const res = await notion.pages.create({
            parent: { database_id: (db as any).id },
            properties: {
              title: { title: [{ text: { content: title } }] },
            },
          });
          return JSON.stringify({ success: true, pageId: res.id, title });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to create page",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_createPage",
        description:
          "Create a new Notion page in a database by database name. Use this when user asks to create, add, or make a new page in Notion.",
        schema: z.object({
          databaseName: z
            .string()
            .describe("The name of the database to create the page in"),
          title: z.string().describe("The title for the new page"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ pageId, title }) => {
        try {
          const res = await notion.pages.update({
            page_id: pageId,
            properties: {
              title: { title: [{ text: { content: title } }] },
            },
          });
          return JSON.stringify({
            success: true,
            pageId: res.id,
            newTitle: title,
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to update page",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_updatePageById",
        description: "Update a Notion page's title using its ID.",
        schema: z.object({
          pageId: z.string().describe("The ID of the page to update"),
          title: z.string().describe("The new title for the page"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ currentTitle, newTitle }) => {
        try {
          const searchRes = await notion?.search({
            query: currentTitle,
            page_size: 1,
          });
          const page = searchRes?.results?.[0];
          if (!page) return JSON.stringify({ error: "Page not found" });

          const res = await notion.pages.update({
            page_id: (page as any).id,
            properties: {
              title: { title: [{ text: { content: newTitle } }] },
            },
          });
          return JSON.stringify({ success: true, pageId: res.id, newTitle });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to update page",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_updatePage",
        description:
          "Update a Notion page's title by searching for it first. Use this when user asks to rename, update, or change a page title.",
        schema: z.object({
          currentTitle: z
            .string()
            .describe("The current title of the page to find"),
          newTitle: z.string().describe("The new title for the page"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ pageId, block }) => {
        try {
          const res = await notion?.blocks.children.append({
            block_id: pageId,
            children: [block],
          });
          return JSON.stringify({ success: true, appended: true });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to append block",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_appendBlockById",
        description: "Append content blocks to a Notion page using its ID.",
        schema: z.object({
          pageId: z.string().describe("The ID of the page to append to"),
          block: z
            .any()
            .describe(
              "The block object to append (e.g., paragraph, heading, etc.)",
            ),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ title, block }) => {
        try {
          const searchRes = await notion?.search({
            query: title,
            page_size: 1,
          });
          const page = searchRes?.results?.[0];
          if (!page) return JSON.stringify({ error: "Page not found" });

          const res = await notion?.blocks.children.append({
            block_id: (page as any).id,
            children: [block],
          });
          return JSON.stringify({ success: true, appended: true });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to append block",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "notion_appendBlock",
        description:
          "Add content to a Notion page by searching for it first. Use this when user asks to add text, content, or blocks to a page.",
        schema: z.object({
          title: z.string().describe("The title of the page to add content to"),
          block: z.any().describe("The block object to append"),
        }),
      },
    ),
  );

  return tools;
}

/* ============================================================
   GOOGLE CALENDAR TOOLS
============================================================ */

function createCalendarTools(calendar: any) {
  if (!calendar) {
    console.log("⚠️  Calendar credentials not available");
    return [];
  }

  console.log("✅ Creating Calendar tools");
  const tools = [];

  tools.push(
    tool(
      async (input) => {
        try {
          let data: any = input;

          // Handle natural language
          if (input.naturalLanguage) {
            const text = input.naturalLanguage;
            let title = "Event";

            const range = chrono.parse(text, new Date(), { forwardDate: true });
            if (range.length > 0 && range[0].start) {
              const start = range[0].start.date();
              const end =
                range[0].end?.date() || new Date(start.getTime() + 30 * 60000);

              // Extract title from text
              const cleanText = text
                .replace(
                  /tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at \d+:\d+|at \d+ ?(am|pm)?/gi,
                  "",
                )
                .trim();
              if (cleanText) title = cleanText;

              data = {
                ...data,
                title,
                start: start.toISOString(),
                end: end.toISOString(),
              };
            } else {
              return JSON.stringify({
                error: "Could not parse date/time from natural language",
                input: text,
              });
            }
          }

          if (!data.title || !data.start) {
            return JSON.stringify({
              error: "Missing required fields: title and start time",
            });
          }

          // Build event object with all supported parameters
          const event: any = {
            summary: data.title,
            start: {
              dateTime: data.start,
              timeZone: data.timezone || "Asia/Kolkata",
            },
            end: {
              dateTime:
                data.end ||
                new Date(
                  new Date(data.start).getTime() + 30 * 60000,
                ).toISOString(),
              timeZone: data.timezone || "Asia/Kolkata",
            },
          };

          // Add optional description
          if (data.description) {
            event.description = data.description;
          }

          // Add optional location
          if (data.location) {
            event.location = data.location;
          }

          // Add attendees
          if (data.attendees && data.attendees.length > 0) {
            event.attendees = data.attendees.map((email: string) => ({
              email,
            }));
          }

          // Set reminders
          if (data.reminders) {
            event.reminders = {
              useDefault: false,
              overrides: data.reminders,
            };
          } else {
            event.reminders = { useDefault: true };
          }

          // Add recurrence rules
          if (data.recurrence && data.recurrence.length > 0) {
            event.recurrence = data.recurrence;
          }

          // Add color
          if (data.colorId) {
            event.colorId = data.colorId;
          }

          // Add visibility
          if (data.visibility) {
            event.visibility = data.visibility;
          }

          // Prepare insert options
          const insertOptions: any = {
            calendarId: data.calendarId || "primary",
            requestBody: event,
          };

          // Add sendUpdates option for attendee notifications
          if (data.sendUpdates) {
            insertOptions.sendUpdates = data.sendUpdates;
          }

          const res = await calendar.events.insert(insertOptions);

          return JSON.stringify({
            success: true,
            eventId: res.data.id,
            link: res.data.htmlLink,
            summary: res.data.summary,
            start: res.data.start,
            end: res.data.end,
            attendees: res.data.attendees,
            location: res.data.location,
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to create event",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "calendar_createEvent",
        description:
          "Create a new Google Calendar event with full options. Use this when user asks to schedule, book, create an appointment, or add an event to calendar. Supports natural language, attendees, reminders, recurring events, and more.",
        schema: z.object({
          title: z.string().optional().describe("Event title/summary (required unless using naturalLanguage)"),
          start: z.string().optional().describe("Start time in ISO format (required unless using naturalLanguage)"),
          end: z.string().optional().describe("End time in ISO format (default: 30 min after start)"),
          description: z
            .string()
            .optional()
            .describe("Detailed description of the event"),
          location: z
            .string()
            .optional()
            .describe("Event location (e.g., 'Conference Room A', 'https://meet.google.com/xxx')"),
          attendees: z
            .array(z.string())
            .optional()
            .describe("List of attendee email addresses to invite"),
          sendUpdates: z
            .enum(["all", "externalOnly", "none"])
            .optional()
            .describe("Send invite emails: 'all' (everyone), 'externalOnly' (non-domain), 'none'"),
          timezone: z
            .string()
            .optional()
            .describe("Timezone (default: Asia/Kolkata). Examples: 'America/New_York', 'Europe/London'"),
          reminders: z
            .array(
              z.object({
                method: z.enum(["email", "popup"]).describe("Reminder method"),
                minutes: z.number().describe("Minutes before event to remind"),
              })
            )
            .optional()
            .describe("Custom reminders. Example: [{method: 'popup', minutes: 30}]"),
          recurrence: z
            .array(z.string())
            .optional()
            .describe(
              "RRULE recurrence rules. Examples: ['RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR'], ['RRULE:FREQ=DAILY;COUNT=5']"
            ),
          colorId: z
            .string()
            .optional()
            .describe("Event color ID (1-11). 1=Lavender, 2=Sage, 3=Grape, 4=Flamingo, 5=Banana, etc."),
          visibility: z
            .enum(["default", "public", "private", "confidential"])
            .optional()
            .describe("Event visibility: 'public', 'private', 'confidential', or 'default'"),
          calendarId: z
            .string()
            .optional()
            .describe("Target calendar ID (default: 'primary')"),
          naturalLanguage: z
            .string()
            .optional()
            .describe(
              "Natural language description like 'team meeting tomorrow at 3pm'. Will extract title and time automatically.",
            ),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({
        maxResults = 10,
        query,
        timeMin,
        timeMax,
        calendarId = "primary",
        orderBy = "startTime",
        showDeleted = false,
        singleEvents = true,
        timeZone,
      }) => {
        try {
          // Build params object
          const params: any = {
            calendarId,
            maxResults: Math.min(Math.max(1, maxResults), 2500),
            singleEvents,
            orderBy,
            showDeleted,
          };

          // Set time bounds - default to now if not specified
          if (timeMin) {
            params.timeMin = timeMin;
          } else if (singleEvents) {
            // Only set default timeMin for single events queries
            params.timeMin = new Date().toISOString();
          }

          if (timeMax) {
            params.timeMax = timeMax;
          }

          // Add search query
          if (query) {
            params.q = query;
          }

          // Add timezone
          if (timeZone) {
            params.timeZone = timeZone;
          }

          const res = await calendar.events.list(params);

          const events = res.data.items || [];
          return JSON.stringify({
            success: true,
            count: events.length,
            nextPageToken: res.data.nextPageToken || null,
            events: events.map((e: any) => ({
              id: e.id,
              title: e.summary,
              description: e.description,
              location: e.location,
              start: e.start,
              end: e.end,
              status: e.status,
              creator: e.creator,
              attendees: e.attendees,
              link: e.htmlLink,
              colorId: e.colorId,
              recurringEventId: e.recurringEventId,
            })),
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to list events",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "calendar_listEvents",
        description:
          "List Google Calendar events with comprehensive filtering options. Use this when user asks to show, list, see, or check their calendar events or schedule. Supports date range filtering, multiple calendars, and various ordering options.",
        schema: z.object({
          maxResults: z
            .number()
            .optional()
            .describe("Maximum number of events to return (1-2500, default: 10)"),
          query: z
            .string()
            .optional()
            .describe("Free text search terms to filter events"),
          timeMin: z
            .string()
            .optional()
            .describe(
              "Lower bound for event start time (RFC3339 timestamp, e.g., '2026-02-01T00:00:00Z'). Default: now",
            ),
          timeMax: z
            .string()
            .optional()
            .describe(
              "Upper bound for event start time (RFC3339 timestamp, e.g., '2026-02-28T23:59:59Z')",
            ),
          calendarId: z
            .string()
            .optional()
            .describe("Calendar ID to query (default: 'primary'). Use email for shared calendars"),
          orderBy: z
            .enum(["startTime", "updated"])
            .optional()
            .describe("Sort order: 'startTime' (chronological) or 'updated' (last modified). Default: startTime"),
          showDeleted: z
            .boolean()
            .optional()
            .describe("Include deleted/cancelled events (default: false)"),
          singleEvents: z
            .boolean()
            .optional()
            .describe("Expand recurring events into individual instances (default: true)"),
          timeZone: z
            .string()
            .optional()
            .describe("Timezone for response times (e.g., 'America/New_York', 'Asia/Kolkata')"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ title }) => {
        try {
          const res = await calendar.events.list({
            calendarId: "primary",
            q: title,
            singleEvents: true,
            orderBy: "updated",
            maxResults: 1,
          });
          const event = res.data.items?.[0];
          if (!event) {
            return JSON.stringify({
              error: "No event found",
              details: `No event found with title containing '${title}'`,
            });
          }
          return JSON.stringify({
            success: true,
            eventId: event.id,
            title: event.summary,
            start: event.start,
            end: event.end,
            link: event.htmlLink,
          });
        } catch (e) {
          return JSON.stringify({
            error: "Failed to search event",
            details: (e as Error).message,
          });
        }
      },
      {
        name: "calendar_searchEvent",
        description:
          "Search for a specific Google Calendar event by its title. Use this when user asks to find or look up a specific event.",
        schema: z.object({
          title: z.string().describe("The event title to search for"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ eventId }) => {
        try {
          await calendar.events.delete({ calendarId: "primary", eventId });
          return JSON.stringify({ success: true, deletedId: eventId });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to delete event",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "calendar_deleteEventById",
        description:
          "Delete a Google Calendar event using its ID. Use this after searching for an event.",
        schema: z.object({
          eventId: z.string().describe("The unique ID of the event to delete"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ title }) => {
        try {
          const res = await calendar.events.list({
            calendarId: "primary",
            q: title,
            singleEvents: true,
            orderBy: "updated",
            maxResults: 1,
          });
          const event = res.data.items?.[0];
          if (!event) {
            return JSON.stringify({ error: "Event not found" });
          }

          await calendar.events.delete({
            calendarId: "primary",
            eventId: event.id,
          });
          return JSON.stringify({ success: true, deletedTitle: title });
        } catch (e) {
          return JSON.stringify({
            error: "Failed to delete event",
            details: (e as Error).message,
          });
        }
      },
      {
        name: "calendar_deleteEvent",
        description:
          "Delete a Google Calendar event by searching for its title. Use this when user asks to cancel, remove, or delete an event by name.",
        schema: z.object({
          title: z.string().describe("The title of the event to delete"),
        }),
      },
    ),
  );

  return tools;
}

/* ============================================================
   GMAIL TOOLS
============================================================ */

function base64Encode(str: string) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createGmailTools(gmail: any) {
  if (!gmail) {
    console.log("⚠️  Gmail credentials not available");
    return [];
  }

  console.log("✅ Creating Gmail tools");
  const tools = [];

  tools.push(
    tool(
      async ({
        maxResults = 10,
        query,
        labelIds,
        category,
        includeSpamTrash = false,
        after,
        before,
        from,
        to,
        subject,
        hasAttachment,
      }) => {
        try {
          // Build search query from parameters
          let queryParts: string[] = [];

          // Add base query if provided
          if (query) {
            if (query.toLowerCase() === "today") {
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, "0");
              const dd = String(today.getDate()).padStart(2, "0");
              queryParts.push(`after:${yyyy}/${mm}/${dd}`);

              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);
              const yyyyT = tomorrow.getFullYear();
              const mmT = String(tomorrow.getMonth() + 1).padStart(2, "0");
              const ddT = String(tomorrow.getDate()).padStart(2, "0");
              queryParts.push(`before:${yyyyT}/${mmT}/${ddT}`);
            } else {
              queryParts.push(query);
            }
          }

          // Add category filter
          if (category) {
            queryParts.push(`category:${category}`);
          }

          // Add date filters
          if (after) {
            queryParts.push(`after:${after}`);
          }
          if (before) {
            queryParts.push(`before:${before}`);
          }

          // Add sender filter
          if (from) {
            queryParts.push(`from:${from}`);
          }

          // Add recipient filter
          if (to) {
            queryParts.push(`to:${to}`);
          }

          // Add subject filter
          if (subject) {
            queryParts.push(`subject:${subject}`);
          }

          // Add attachment filter
          if (hasAttachment) {
            queryParts.push("has:attachment");
          }

          const searchQuery = queryParts.length > 0 ? queryParts.join(" ") : "is:unread";

          // Build list request params
          const listParams: any = {
            userId: "me",
            maxResults: Math.min(Math.max(1, maxResults), 500),
            q: searchQuery,
            includeSpamTrash,
          };

          // Add label filtering
          if (labelIds && labelIds.length > 0) {
            listParams.labelIds = labelIds;
          }

          const listRes = await gmail.users.messages.list(listParams);

          const messages = listRes.data.messages || [];
          if (messages.length === 0) {
            return JSON.stringify({
              success: true,
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
                const labelList = full.data.labelIds || [];
                return {
                  id: msg.id,
                  threadId: full.data.threadId,
                  snippet: full.data.snippet,
                  subject:
                    headers.find((h: any) => h.name === "Subject")?.value ||
                    "No Subject",
                  from:
                    headers.find((h: any) => h.name === "From")?.value ||
                    "Unknown",
                  to:
                    headers.find((h: any) => h.name === "To")?.value || "",
                  date:
                    headers.find((h: any) => h.name === "Date")?.value || "",
                  labels: labelList,
                  isUnread: labelList.includes("UNREAD"),
                  isStarred: labelList.includes("STARRED"),
                };
              } catch (msgError) {
                return { id: msg.id, error: "Failed to fetch details" };
              }
            }),
          );

          return JSON.stringify({
            success: true,
            count: detailed.length,
            emails: detailed,
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to read emails",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "gmail_readEmails",
        description:
          "Read and fetch emails from Gmail inbox with comprehensive filtering options. Use this when user asks to read, check, show, or list emails. Supports filtering by labels, categories, date ranges, sender, recipient, subject, and attachments.",
        schema: z.object({
          maxResults: z
            .number()
            .optional()
            .describe("Maximum number of emails to fetch (1-500, default: 10)"),
          query: z
            .string()
            .optional()
            .describe(
              "Gmail search query. Use 'today' for today's emails, 'is:unread' for unread, etc.",
            ),
          labelIds: z
            .array(z.string())
            .optional()
            .describe(
              "Filter by label IDs. System labels: INBOX, UNREAD, STARRED, IMPORTANT, SENT, DRAFT, SPAM, TRASH, CATEGORY_PERSONAL, CATEGORY_SOCIAL, CATEGORY_PROMOTIONS, CATEGORY_UPDATES, CATEGORY_FORUMS",
            ),
          category: z
            .enum(["primary", "social", "promotions", "updates", "forums"])
            .optional()
            .describe("Filter by email category tab"),
          includeSpamTrash: z
            .boolean()
            .optional()
            .describe("Include emails from SPAM and TRASH (default: false)"),
          after: z
            .string()
            .optional()
            .describe("Emails after this date (format: YYYY/MM/DD)"),
          before: z
            .string()
            .optional()
            .describe("Emails before this date (format: YYYY/MM/DD)"),
          from: z
            .string()
            .optional()
            .describe("Filter by sender email address"),
          to: z
            .string()
            .optional()
            .describe("Filter by recipient email address"),
          subject: z
            .string()
            .optional()
            .describe("Filter by subject line containing this text"),
          hasAttachment: z
            .boolean()
            .optional()
            .describe("Only return emails with attachments"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ recipient, cc, bcc, subject, body, isHtml = false, replyTo }) => {
        try {
          if (!recipient || !subject || !body) {
            return JSON.stringify({
              needsMoreInfo: true,
              message: `Missing required fields. Need: ${!recipient ? "recipient " : ""}${!subject ? "subject " : ""}${!body ? "body" : ""}`,
            });
          }

          // Build email headers
          const headers: string[] = [];
          headers.push(`To: ${recipient}`);

          if (cc && cc.length > 0) {
            headers.push(`Cc: ${cc.join(", ")}`);
          }

          if (bcc && bcc.length > 0) {
            headers.push(`Bcc: ${bcc.join(", ")}`);
          }

          if (replyTo) {
            headers.push(`Reply-To: ${replyTo}`);
          }

          headers.push(`Subject: ${subject}`);
          headers.push(`Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset="UTF-8"`);
          headers.push(`MIME-Version: 1.0`);

          const emailContent = [...headers, "", body].join("\r\n");
          const raw = base64Encode(emailContent);

          const result = await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw },
          });

          return JSON.stringify({
            success: true,
            messageId: result.data.id,
            threadId: result.data.threadId,
            message: `Email sent successfully to ${recipient}${cc && cc.length > 0 ? `, CC: ${cc.join(", ")}` : ""}`,
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to send email",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "gmail_sendEmail",
        description:
          "Send an email via Gmail with full email options. Use this when user asks to send, email, or message someone. Supports CC, BCC, HTML content, and reply-to address.",
        schema: z.object({
          recipient: z.string().describe("Primary recipient's email address (required)"),
          cc: z
            .array(z.string())
            .optional()
            .describe("Carbon copy recipients - list of email addresses"),
          bcc: z
            .array(z.string())
            .optional()
            .describe("Blind carbon copy recipients - list of email addresses"),
          subject: z.string().describe("Email subject line (required)"),
          body: z.string().describe("Email body content/message (required)"),
          isHtml: z
            .boolean()
            .optional()
            .describe("Send as HTML email instead of plain text (default: false)"),
          replyTo: z
            .string()
            .optional()
            .describe("Reply-to email address if different from sender"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ recipient, cc, bcc, subject, body, isHtml = false, replyTo }) => {
        try {
          if (!recipient || !subject || !body) {
            return JSON.stringify({
              error: "Missing required fields: recipient, subject, and body",
            });
          }

          // Build email headers
          const headers: string[] = [];
          headers.push(`To: ${recipient}`);

          if (cc && cc.length > 0) {
            headers.push(`Cc: ${cc.join(", ")}`);
          }

          if (bcc && bcc.length > 0) {
            headers.push(`Bcc: ${bcc.join(", ")}`);
          }

          if (replyTo) {
            headers.push(`Reply-To: ${replyTo}`);
          }

          headers.push(`Subject: ${subject}`);
          headers.push(`Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset="UTF-8"`);
          headers.push(`MIME-Version: 1.0`);

          const emailContent = [...headers, "", body].join("\r\n");
          const raw = base64Encode(emailContent);

          const result = await gmail.users.drafts.create({
            userId: "me",
            requestBody: { message: { raw } },
          });

          return JSON.stringify({
            success: true,
            draftId: result.data.id,
            message: `Draft created successfully for ${recipient}`,
          });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to create draft",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "gmail_createDraft",
        description:
          "Create an email draft in Gmail without sending it. Use this when user asks to draft, prepare, or write an email for later. Supports CC, BCC, HTML content, and reply-to address.",
        schema: z.object({
          recipient: z.string().describe("Primary recipient's email address (required)"),
          cc: z
            .array(z.string())
            .optional()
            .describe("Carbon copy recipients - list of email addresses"),
          bcc: z
            .array(z.string())
            .optional()
            .describe("Blind carbon copy recipients - list of email addresses"),
          subject: z.string().describe("Email subject line (required)"),
          body: z.string().describe("Email body content (required)"),
          isHtml: z
            .boolean()
            .optional()
            .describe("Create as HTML email instead of plain text (default: false)"),
          replyTo: z
            .string()
            .optional()
            .describe("Reply-to email address if different from sender"),
        }),
      },
    ),
  );

  tools.push(
    tool(
      async ({ messageId }) => {
        try {
          await gmail.users.messages.delete({ userId: "me", id: messageId });
          return JSON.stringify({ success: true, deletedId: messageId });
        } catch (error) {
          return JSON.stringify({
            error: "Failed to delete email",
            details: (error as Error).message,
          });
        }
      },
      {
        name: "gmail_deleteEmail",
        description:
          "Delete an email from Gmail using its message ID. Use this when user asks to delete or remove a specific email.",
        schema: z.object({
          messageId: z
            .string()
            .describe("The unique ID of the email message to delete"),
        }),
      },
    ),
  );

  return tools;
}

/* ============================================================
   REDDIT TOOLS (NO AUTH REQUIRED)
============================================================ */

function createRedditTools() {
  console.log("✅ Creating Reddit tools");

  const tools = [];

  // 🔎 Discover subreddits
  tools.push(
    tool(
      async ({ query, limit = 50 }) => {
        const url = `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(
          query,
        )}&limit=${limit}`;

        const res = await fetch(url, {
          headers: { "User-Agent": "PaxioAgent/1.0" },
        });

        const json = await res.json();

        return JSON.stringify({
          success: true,
          subreddits: json.data.children.map((c: any) => ({
            name: c.data.display_name,
            title: c.data.title,
            subscribers: c.data.subscribers,
            nsfw: c.data.over18,
            description: c.data.public_description,
          })),
        });
      },
      {
        name: "reddit_search_subreddits",
        description:
          "Search Reddit and extract a large list of relevant subreddits for a topic.",
        schema: z.object({
          query: z.string(),
          limit: z.number().optional(),
        }),
      },
    ),
  );

  // 📄 Get posts
  tools.push(
    tool(
      async ({ subreddit, sort = "top", limit = 100 }) => {
        const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;

        const res = await fetch(url, {
          headers: { "User-Agent": "PaxioAgent/1.0" },
        });

        const json = await res.json();

        return JSON.stringify({
          success: true,
          posts: json.data.children.map((p: any) => ({
            id: p.data.id,
            title: p.data.title,
            score: p.data.score,
            comments: p.data.num_comments,
            url: `https://reddit.com${p.data.permalink}`,
            selftext: p.data.selftext?.slice(0, 2000),
          })),
        });
      },
      {
        name: "reddit_get_posts",
        description:
          "Fetch posts from a subreddit for analysis (top, hot, new).",
        schema: z.object({
          subreddit: z.string(),
          sort: z.enum(["top", "hot", "new"]).optional(),
          limit: z.number().optional(),
        }),
      },
    ),
  );

  return tools;
}

/* ============================================================
   SHOPPING TOOLS (Zepto, more platforms can be added)
============================================================ */

// Browser Use Client for shopping automation
const browserUseClient = new BrowserUseClient({
  apiKey: "bu_Pwmb6xRzUl6XPiZyyWm811nvZZ3e82-4ratEViestsE",
});

// Helper function to save screenshot from base64 or URL
async function saveShoppingScreenshot(data: string, filename: string): Promise<string> {
  const screenshotDir = path.resolve(__dirname, "..", "..", "screenshots");

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const filepath = path.join(screenshotDir, filename);

  if (data.startsWith("data:image")) {
    const base64Data = data.split(",")[1];
    if (base64Data) {
      fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));
    }
  } else if (data.startsWith("http")) {
    const response = await fetch(data);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
  } else if (data.length > 100) {
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));
  }

  return filepath;
}

// Shopping platforms array - more platforms can be added here
const shoppingPlatforms = ["zepto"] as const;
type ShoppingPlatform = typeof shoppingPlatforms[number];

// Zepto session info stored in user.zeptoSession (JSON field)
interface ZeptoSessionInfo {
  sessionId: string;
  shareUrl: string;
  liveUrl?: string;
  product: string;
  location: string;
  phoneNumber: string;
  createdAt: string;
}

interface ZeptoSessionInfo {
  sessionId: string;
  shareUrl: string;
  liveUrl?: string;
  product: string;
  location: string;
  phoneNumber: string;
  createdAt: string;
}

type DeliveryDetails = {
  phone: string;
  address: string;
  upiId: string;
};

function createShoppingTools(userId: string, deliveryDetails: DeliveryDetails) {
  console.log("✅ Creating Shopping tools (Zepto)");
  const tools: any[] = [];

  // Zepto Shopping Tool
  tools.push(
    tool(
      async ({ location, phone_number, product, otp, sessionId: existingSessionId }) => {
        let session: { id: string; liveUrl?: string } | null = null;
        let share: { shareUrl: string; shareToken: string } | null = null;
        let shouldStopSession = false; // Only stop if we complete the order

        // Auto-lookup session and fill missing params when OTP is provided
        let resolvedSessionId = existingSessionId;
        let resolvedLocation = location;
        let resolvedPhoneNumber = phone_number || deliveryDetails.phone;
        let resolvedProduct = product;

        if (otp) {
          // Fetch stored session from database
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { zeptoSession: true }
          });

          const storedSession = user?.zeptoSession as ZeptoSessionInfo | null;

          if (storedSession) {
            console.log(`🔄 Auto-resolved session from DB for user ${userId}:`);
            console.log(`   Session ID: ${existingSessionId || '(none)'} → ${storedSession.sessionId}`);
            console.log(`   Phone: ${phone_number || '(none)'} → ${storedSession.phoneNumber}`);
            console.log(`   Product: ${product || '(none)'} → ${storedSession.product}`);
            console.log(`   Location: ${location || '(none)'} → ${storedSession.location}`);

            resolvedSessionId = storedSession.sessionId;
            resolvedLocation = location || storedSession.location;
            resolvedPhoneNumber = phone_number || storedSession.phoneNumber;
            resolvedProduct = product || storedSession.product;
          } else {
            console.log(`⚠️ OTP provided but no stored session in DB for user ${userId}`);
          }
        }

        // Default to DB delivery details if not provided and not in session
        if (!resolvedLocation && deliveryDetails.address) {
          resolvedLocation = deliveryDetails.address;
        }
        if (!resolvedPhoneNumber && deliveryDetails.phone) {
          resolvedPhoneNumber = deliveryDetails.phone;
        }

        // Helper function to stop the browser session
        const stopBrowserSession = async (sessionId: string) => {
          try {
            console.log("🛑 Stopping browser session...");
            await browserUseClient.sessions.updateSession({
              session_id: sessionId,
              action: "stop"
            });
            console.log("✅ Browser session stopped.");
          } catch (err) {
            console.log(`⚠️ Failed to stop session: ${err}`);
          }
        };

        try {

          // If resuming an existing session (user provided OTP), skip Phase 1
          if (resolvedSessionId && otp) {
            console.log("🔄 Resuming existing Zepto session...");
            console.log(`📍 Session ID: ${resolvedSessionId}`);
            console.log(`🔐 OTP: ${otp}`);
            console.log(`🛒 Product: ${resolvedProduct}`);

            session = { id: resolvedSessionId };

            // Get existing share URL
            share = await browserUseClient.sessions.getSessionPublicShare({
              session_id: resolvedSessionId,
            });

            console.log(`🌐 Existing Share URL: ${share.shareUrl}`);
          } else {
            // New session - run Phase 1
            // Validate required params for new orders
            if (!location || !phone_number || !product) {
              console.log(`❌ Missing required params for new order: location=${!!location}, phone=${!!phone_number}, product=${!!product}`);
              return JSON.stringify({
                success: false,
                error: "Missing required parameters",
                details: "For new orders, location, phone_number, and product are all required. For OTP continuation, just provide the OTP.",
              });
            }

            console.log("🚀 Starting NEW Zepto shopping session...");
            console.log(`📍 Location: ${location}`);
            console.log(`📱 Phone: ${phone_number}`);
            console.log(`🛒 Product: ${product}`);

            // Step 1: Create a browser session
            const newSession = await browserUseClient.sessions.createSession({
              browserScreenWidth: 1920,
              browserScreenHeight: 1080,
            });
            //@ts-expect-error
            session = newSession;
            //@ts-expect-error
            console.log(`✅ Session created! ID: ${session.id}`);

            // Step 2: Create a PUBLIC share URL
            share = await browserUseClient.sessions.createSessionPublicShare({
              //@ts-expect-error
              session_id: session.id,
            });

            console.log(`🌐 Public Share URL: ${share.shareUrl}`);

            // Step 3: Run PHASE 1 - Location and Login (stop before OTP)
            console.log("🤖 Phase 1: Setting location and requesting OTP...");

            const phase1Task = await browserUseClient.tasks.createTask({
              task: `1. Go to https://www.zeptonow.com/
2. Click "Select Location" button.
3. In the location box, enter "${location}" and choose the closest option.
4. Click confirm and continue.
5. Click login button, enter the phone number: ${phone_number} into the input field.
6. Click 'Continue' to send the OTP.
7. STOP immediately after the OTP is sent and the OTP input field is visible.

IMPORTANT: Stop and wait after OTP is requested. Do not proceed further.`,
              //@ts-expect-error
              sessionId: session.id,
            });

            for await (const step of phase1Task.stream()) {
              console.log(`   Step: ${JSON.stringify(step, null, 2)}`);
            }

            await phase1Task.complete();
            console.log("✅ Phase 1 completed - OTP requested!");

            // If no OTP provided, return session info for user to provide OTP
            if (!otp) {
              // Store session in database for auto-lookup when OTP is provided
              await prisma.user.update({
                where: { id: userId },
                data: {
                  zeptoSession: {
                    //@ts-expect-error
                    sessionId: session.id,
                    shareUrl: share.shareUrl,
                    liveUrl: (session as any).liveUrl,
                    product,
                    location,
                    phoneNumber: phone_number,
                    createdAt: new Date().toISOString(),
                  }
                }
              });
              console.log(`💾 Session stored in DB for user: ${userId}`);

              return JSON.stringify({
                success: true,
                phase: "awaiting_otp",
                //@ts-expect-error
                sessionId: session.id,
                liveUrl: (session as any).liveUrl,
                publicShareUrl: share.shareUrl,
                product,
                location,
                phone_number,
                message: `OTP sent to ${phone_number}. Please provide the OTP to continue ordering ${product}.`,
              });
            }
          }

          // PHASE 2, 3, 4 - Continue with OTP
          // Step 4: Run PHASE 2 - Enter OTP and complete login
          console.log("🤖 Phase 2: Entering OTP and logging in...");

          const phase2Task = await browserUseClient.tasks.createTask({
            task: `PRE-CONDITION: You are viewing the OTP input field on Zepto website.

1. Enter the following OTP: ${otp} into the visible OTP field.
2. Click submit to finish the login process.
3. Wait until the page successfully redirects after login.
4. If any popup appears, close it by clicking the cross button.
5. Confirm you are logged in successfully.

STOP after login is confirmed.`,
            //@ts-expect-error
            sessionId: session.id,
          });

          for await (const step of phase2Task.stream()) {
            console.log(`   Step: ${JSON.stringify(step, null, 2)}`);
          }

          await phase2Task.complete();
          console.log("✅ Phase 2 completed - Logged in!");

          // Step 5: Run PHASE 3 - Search product and add to cart
          console.log("🤖 Phase 3: Searching product and adding to cart...");

          const phase3Task = await browserUseClient.tasks.createTask({
            task: `PRE-CONDITION: You are logged in on Zepto.

1. Go to https://www.zeptonow.com/search
2. Search for the product "${resolvedProduct}" using the main search bar.
3. After finding the product that best matches "${resolvedProduct}", click the ADD button to put it in the cart.
4. Take a screenshot of the product page.
5. Navigate to the cart by clicking the cart icon.
6. Confirm the product is in the cart.

STOP after confirming product is in cart. Return the screenshot.`,
            //@ts-expect-error
            sessionId: session.id,
          });

          for await (const step of phase3Task.stream()) {
            console.log(`   Step: ${JSON.stringify(step, null, 2)}`);
          }

          const phase3Result = await phase3Task.complete();
          console.log("✅ Phase 3 completed - Product added to cart!");

          let productScreenshot = "";
          if (phase3Result.output) {
            try {
              productScreenshot = await saveShoppingScreenshot(
                phase3Result.output,
                `zepto_product_${Date.now()}.png`
              );
            } catch (e) {
              console.log("❌ Error saving product screenshot:", e);
            }
          }

          // Step 6: Run PHASE 4 - Checkout process
          console.log("🤖 Phase 4: Proceeding to checkout...");

          const phase4Task = await browserUseClient.tasks.createTask({
            task: `PRE-CONDITION: You are logged in and have an item in the cart on Zepto.

1. Click on the cart to view cart items.
2. Click "Add Address" or proceed to checkout.
3. Click "Confirm and Continue".
4. Enter address details:
   - Address: ${deliveryDetails.address}
5. Click "Save Address".
6. Proceed to payment.
7. Select UPI as payment method.
8. Enter UPI ID: ${deliveryDetails.upiId}
9. Click "Verify and Pay" or "Pay" button.
10. Wait for the payment to be processed.
11. If there is a UPI payment request, proceed with it.
12. Take a screenshot of the final payment confirmation or order confirmation screen.

FINAL OUTPUT: Return the screenshot of the payment/order confirmation screen.`,
            //@ts-expect-error
            sessionId: session.id,
          });

          for await (const step of phase4Task.stream()) {
            console.log(`   Step: ${JSON.stringify(step, null, 2)}`);
          }

          const phase4Result = await phase4Task.complete();
          console.log("✅ Phase 4 completed - Checkout done!");

          let checkoutScreenshot = "";
          if (phase4Result.output) {
            try {
              checkoutScreenshot = await saveShoppingScreenshot(
                phase4Result.output,
                `zepto_checkout_${Date.now()}.png`
              );
            } catch (e) {
              console.log("❌ Error saving checkout screenshot:", e);
            }
          }

          // Mark that we should stop the session since order is complete
          shouldStopSession = true;

          // Clear stored session from database
          await prisma.user.update({
            where: { id: userId },
            //@ts-expect-error
            data: { zeptoSession: null }
          });
          console.log(`🧹 Cleared zeptoSession from DB for user: ${userId}`);

          return JSON.stringify({
            success: true,
            phase: "complete",
            //@ts-expect-error
            sessionId: session.id,
            liveUrl: (session as any).liveUrl,
            publicShareUrl: share!.shareUrl,
            product: resolvedProduct,
            location: resolvedLocation,
            productScreenshot,
            checkoutScreenshot,
            message: `Successfully ordered ${resolvedProduct} from Zepto! Check the payment screen.`,
          });
        } catch (error) {
          console.error("❌ Zepto shopping error:", error);
          // Also stop session on error to prevent cloud costs
          shouldStopSession = true;
          // Clear stored session on error
          await prisma.user.update({
            where: { id: userId },
            //@ts-expect-error
            data: { zeptoSession: null }
          }).catch(() => { }); // Ignore cleanup errors
          return JSON.stringify({
            success: false,
            error: "Failed to complete Zepto shopping",
            details: (error as Error).message,
          });
        } finally {
          // Stop the browser session after order completion or error
          if (shouldStopSession && session) {
            await stopBrowserSession(session.id);
          }
        }
      },
      {
        name: "zepto_order",
        description:
          "Order products from Zepto (quick commerce grocery delivery). Use this when user asks to buy, order, or shop for groceries, food items, or household products from Zepto. IMPORTANT: When continuing an order after OTP is received, you MUST provide the sessionId from the previous response along with the OTP.",
        schema: z.object({
          location: z
            .string()
            .optional()
            .describe("Delivery address/location. Required for NEW orders. Optional when providing OTP (auto-filled from stored session)."),
          phone_number: z
            .string()
            .optional()
            .describe("Phone number for OTP verification. Required for NEW orders. Optional when providing OTP (auto-filled from stored session)."),
          product: z
            .string()
            .optional()
            .describe("Product to search and order. Required for NEW orders. Optional when providing OTP (auto-filled from stored session)."),
          otp: z
            .string()
            .optional()
            .describe("OTP received on phone. When provided, other params are auto-filled from the stored session."),
          sessionId: z
            .string()
            .optional()
            .describe("Session ID from previous call. Optional - auto-resolved from storage when OTP is provided."),
        }),
      }
    )
  );

  return tools;
}

/* ============================================================
   DOOMSCROLLER - Web Research Tool (No Login Required)
============================================================ */

// Supported platforms - prioritize no-login sources (youtube first for shorts)
type DoomscrollPlatform = "google" | "bbc" | "reuters" | "apnews" | "techcrunch" | "reddit" | "x";

interface DoomscrollFinding {
  platform: DoomscrollPlatform;
  rawOutput: string;
  aiSummary?: string; // AI-generated summary (full context, not shortened)
  timestamp: Date;
}

interface DoomscrollResult {
  topic: string;
  findings: DoomscrollFinding[];
  duration: string;
  reportPath: string;
}

// Helper to format duration
function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Get research directory
function getResearchDir(): string {
  const dir = path.resolve(__dirname, "..", "..", "..", "..", "research");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// AI Summarization helper - summarizes but preserves full context
async function summarizeWithAI(rawOutput: string, platform: string, topic: string): Promise<string> {
  try {
    const llm = getGeminiLLM();
    const result = await llm.invoke([
      new SystemMessage(`You are a research assistant. Your task is to summarize web research findings in a comprehensive way.

IMPORTANT RULES:
1. DO NOT shorten or truncate the information - include ALL key details
2. Organize the information logically with clear sections
3. Highlight key insights, trends, and important facts
4. Include relevant quotes, statistics, and sources
5. Maintain the full context and nuance of the original content
6. Add analysis and connections between different pieces of information
7. Format with markdown for readability

You are summarizing research from ${platform} about the topic: "${topic}"`),
      new HumanMessage(`Please provide a comprehensive, well-organized summary of the following research findings. Remember: DO NOT shorten - expand and organize with full context:

${rawOutput}`),
    ]);

    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  } catch (error) {
    console.log(`⚠️ AI summarization failed: ${error}`);
    return ""; // Return empty string on failure, raw output will still be saved
  }
}

// Persistent profile for doomscroller - saves cookies/state
const DOOMSCROLL_PROFILE_NAME = "doomscroller_paxio";
let cachedDoomscrollProfileId: string | null = null;

/**
 * Gets or creates a persistent browser profile for the doomscroller.
 * This profile stores cookies to speed up subsequent sessions.
 */
async function getOrCreateDoomscrollProfile(client: BrowserUseClient): Promise<string> {
  // Return cached profile ID if available
  if (cachedDoomscrollProfileId) {
    console.log(`🔐 Using cached doomscroll profile: ${cachedDoomscrollProfileId}`);
    return cachedDoomscrollProfileId;
  }

  try {
    // Check for existing profile
    const profiles = await client.profiles.listProfiles();
    //@ts-expect-error
    const existingProfile = profiles.profiles?.find((p: any) => p.name === DOOMSCROLL_PROFILE_NAME);

    if (existingProfile) {
      console.log(`🔐 Found existing doomscroll profile: ${existingProfile.id}`);
      cachedDoomscrollProfileId = existingProfile.id;
      return existingProfile.id;
    }

    // Create new profile
    const newProfile = await client.profiles.createProfile({
      name: DOOMSCROLL_PROFILE_NAME,
    });
    console.log(`🔐 Created new doomscroll profile: ${newProfile.id}`);
    cachedDoomscrollProfileId = newProfile.id;
    return newProfile.id;
  } catch (error) {
    console.log(`⚠️ Failed to get/create doomscroll profile: ${error}`);
    return "";
  }
}

/**
 * Check if a page requires login and skip if it does
 */
async function checkForLoginWall(client: BrowserUseClient, sessionId: string): Promise<boolean> {
  try {
    const checkTask = await client.tasks.createTask({
      task: `Check if the current page requires login:
1. Look for login/sign-in prompts, modals, or overlays
2. Check if content is blocked behind authentication
3. Look for "Sign in", "Log in", "Create account" barriers
4. If the page freely shows content, report: "NO_LOGIN_REQUIRED"
5. If login is needed to access content, report: "LOGIN_REQUIRED"

Output ONLY: "NO_LOGIN_REQUIRED" or "LOGIN_REQUIRED"`,
      sessionId,
    });
    for await (const step of checkTask.stream()) { /* consume */ }
    const result = await checkTask.complete();
    return result.output?.includes("LOGIN_REQUIRED") || false;
  } catch {
    return false;
  }
}

async function doomscrollPlatform(
  client: BrowserUseClient,
  sessionId: string,
  platform: DoomscrollPlatform,
  topic: string
): Promise<DoomscrollFinding | null> {
  console.log(`\n🔍 DOOMSCROLL - Researching ${platform.toUpperCase()}...`);

  // Platform-specific research prompts (NO LOGIN REQUIRED for most)
  const prompts: Record<DoomscrollPlatform, string> = {
    google: `Research "${topic}" on Google:
1. Go to https://www.google.com/search?q=${encodeURIComponent(topic)}&tbm=nws
2. This is Google News search - browse through the news results
3. Find 10-15 relevant news articles about the topic
4. For each article, collect: Headline, Source name, Publication date, Brief excerpt, Full article URL
5. Click on a few top articles and read the key points
6. Look for recent developments, breaking news, and trending stories
7. Note any patterns, consensus views, or conflicting information
Output all findings with full URLs and key insights.`,

    bbc: `Research "${topic}" on BBC News:
1. Go to https://www.bbc.com/search?q=${encodeURIComponent(topic)}
2. Browse through the search results
3. Find 5-10 relevant BBC articles about the topic
4. For each article, collect: Headline, Publication date, Brief summary, Full article URL
5. Click on the top 2-3 articles and extract key information
6. Note the BBC's perspective and any expert quotes
Output all findings with full BBC URLs.`,

    reuters: `Research "${topic}" on Reuters:
1. Go to https://www.reuters.com/search/news?blob=${encodeURIComponent(topic)}
2. Browse through the news search results
3. Find 5-10 relevant Reuters articles about the topic
4. For each article, collect: Headline, Publication date, Brief summary, Full article URL
5. Click on top articles to read detailed reporting
6. Focus on facts, data, and official sources cited
Output all findings with full Reuters URLs.`,

    apnews: `Research "${topic}" on AP News:
1. Go to https://apnews.com/search?q=${encodeURIComponent(topic)}
2. Browse through the search results
3. Find 5-10 relevant AP News articles about the topic
4. For each article, collect: Headline, Publication date, Brief summary, Full article URL
5. Read top articles for factual reporting
6. Note any breaking news or developing stories
Output all findings with full AP News URLs.`,

    techcrunch: `Research "${topic}" on TechCrunch:
1. Go to https://techcrunch.com/search/${encodeURIComponent(topic)}
2. Browse through the search results
3. Find 5-10 relevant TechCrunch articles about the topic
4. For each article, collect: Headline, Author, Publication date, Brief summary, Full article URL
5. Focus on tech industry insights, startup news, and innovation
6. Note expert opinions and industry trends
Output all findings with full TechCrunch URLs.`,

    reddit: `Research "${topic}" on Reddit (NO LOGIN - browse only public content):
1. Go to https://www.reddit.com/search/?q=${encodeURIComponent(topic)}
2. Browse through the PUBLIC search results (do NOT log in)
3. If a login popup appears, close it or navigate away
4. Find 5-10 interesting PUBLIC posts/discussions about the topic
5. For each post, collect: Post title, Subreddit name, Upvote count, Number of comments, Post URL
6. Only access content that is publicly visible without login
7. Skip any content that requires authentication
Output all findings with full Reddit URLs. SKIP if login is required.`,

    x: `Research "${topic}" on X/Twitter (NO LOGIN - browse only public content):
1. Go to https://x.com/search?q=${encodeURIComponent(topic)}&src=typed_query
2. Browse through the PUBLIC search results (do NOT log in)
3. If a login popup appears, close it or navigate to the public search
4. Find 5-10 interesting PUBLIC tweets about the topic
5. For each tweet, collect: Author username, Tweet content preview, Tweet URL
6. Only access content that is publicly visible without login
7. Skip any content blocked behind authentication
Output all findings with full X/Twitter URLs. SKIP completely if login is required.`
  };

  const task = await client.tasks.createTask({
    task: prompts[platform],
    sessionId,
  });

  for await (const step of task.stream()) { /* consume */ }
  const result = await task.complete();

  // Check if this platform requires login (for reddit/x)
  if (platform === "reddit" || platform === "x") {
    const needsLogin = await checkForLoginWall(client, sessionId);
    if (needsLogin) {
      console.log(`⚠️ ${platform.toUpperCase()} requires login - skipping`);
      return null;
    }
  }

  if (result.output) {
    return {
      platform,
      rawOutput: result.output,
      timestamp: new Date()
    };
  }
  return null;
}

function createDoomscrollerTools(userId: string, userPrompt: string) {
  console.log("✅ Creating Doomscroller tools (No-Login Research)");
  const tools = [];

  tools.push(
    tool(
      async ({ topic, platforms = ["google", "bbc", "reuters", "apnews"], durationHours = 1 }) => {
        console.log("\n" + "═".repeat(60));
        console.log("🌀 DOOMSCROLLER - Web Research Agent (No Login Required)");
        console.log("═".repeat(60));
        console.log(`📌 Topic: ${topic}`);
        console.log(`🎯 Platforms: ${platforms.join(", ")}`);

        const startTime = Date.now();
        const findings: DoomscrollFinding[] = [];

        // ===== CREATE DB SESSION WITH RUNNING STATUS =====
        const dbSession = await prisma.doomscrollSession.create({
          data: {
            userId,
            prompt: userPrompt,
            topic,
            platforms: platforms as string[],
            status: "RUNNING",
            shareUrl: null,
          },
        });
        console.log(`📝 DB Session created: ${dbSession.id} (RUNNING)`);

        // Create browser session
        // Get or create persistent profile for cookies
        const doomscrollProfileId = await getOrCreateDoomscrollProfile(browserUseClient);

        const browserSession = await browserUseClient.sessions.createSession({
          browserScreenWidth: 1920,
          browserScreenHeight: 1080,
          profileId: doomscrollProfileId || undefined,
        });

        console.log(`✅ Browser session: ${browserSession.id}`);
        console.log(`🎥 LIVE VIEW: https://browser-use.com/session/${browserSession.id}`);
        // @ts-ignore
        if (browserSession.liveUrl) console.log(`🎥 LIVE URL (Direct): ${browserSession.liveUrl}`);

        // Get public share URL
        let shareUrl = "";
        try {
          const share = await browserUseClient.sessions.createSessionPublicShare({
            session_id: browserSession.id,
          });
          shareUrl = share.shareUrl || "";
          console.log(`🌐 Public URL: ${shareUrl}`);

          // Update DB session with share URL
          await prisma.doomscrollSession.update({
            where: { id: dbSession.id },
            data: { shareUrl },
          });
        } catch (e) {
          console.log("⚠️ Could not create public share");
        }

        // Stop session helper
        const stopSession = async () => {
          console.log("\n🛑 Stopping browser session...");
          try {
            await browserUseClient.sessions.updateSession({
              session_id: browserSession.id,
              action: "stop"
            });
            console.log("✅ Browser session stopped.");
          } catch (err) {
            console.log(`⚠️ Failed to stop session: ${err}`);
          }
        };

        try {
          // Research each platform (no login required for most)
          for (const platform of platforms as DoomscrollPlatform[]) {
            try {
              const finding = await doomscrollPlatform(
                browserUseClient,
                browserSession.id,
                platform,
                topic
              );
              if (finding) {
                // ===== AI SUMMARIZATION PASS =====
                console.log(`🤖 Generating AI summary for ${platform}...`);
                const aiSummary = await summarizeWithAI(finding.rawOutput, platform, topic);
                finding.aiSummary = aiSummary;

                findings.push(finding);

                // ===== SAVE RESULT TO DB AFTER EACH PLATFORM =====
                await prisma.doomscrollResult.create({
                  data: {
                    sessionId: dbSession.id,
                    platform: finding.platform,
                    rawOutput: finding.rawOutput,
                    preview: aiSummary || finding.rawOutput.substring(0, 500),
                  },
                });
                console.log(`📝 Saved ${platform} results to DB (with AI summary)`);
              }
            } catch (error) {
              console.log(`⚠️ Error on ${platform}: ${error}`);
            }
          }

          // Save research report
          const duration = formatDuration(Date.now() - startTime);
          const filename = `doomscroll_${topic.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.md`;
          const filepath = path.join(getResearchDir(), filename);

          let content = `# 🌀 Doomscroll Report: ${topic}\n\n`;
          content += `**Started:** ${new Date(startTime).toLocaleString()}\n`;
          content += `**Duration:** ${duration}\n`;
          content += `**Platforms:** ${findings.map(f => f.platform).join(", ")}\n`;
          if (shareUrl) content += `**Browser Session:** ${shareUrl}\n`;
          content += `\n---\n\n`;

          const emojis: Record<string, string> = {
            google: "🔍", bbc: "📺", reuters: "📰", apnews: "📡", techcrunch: "💻", reddit: "🔴", x: "𝕏"
          };

          for (const finding of findings) {
            content += `## ${emojis[finding.platform] || "📌"} ${finding.platform.toUpperCase()}\n\n`;

            // Include AI summary if available
            if (finding.aiSummary) {
              content += `### 🤖 AI Summary\n\n`;
              content += finding.aiSummary;
              content += `\n\n### 📄 Raw Findings\n\n`;
            }

            content += finding.rawOutput;
            content += `\n\n---\n\n`;
          }

          fs.writeFileSync(filepath, content);
          console.log(`\n📄 Report saved: ${filepath}`);

          // ===== UPDATE DB SESSION TO DONE =====
          await prisma.doomscrollSession.update({
            where: { id: dbSession.id },
            data: {
              status: "DONE",
              duration,
            },
          });
          console.log(`📝 DB Session ${dbSession.id} marked DONE`);

          const result: DoomscrollResult = {
            topic,
            findings,
            duration,
            reportPath: filepath
          };

          return JSON.stringify({
            success: true,
            sessionId: dbSession.id,
            topic,
            platformsResearched: findings.map(f => f.platform),
            findingsCount: findings.length,
            duration,
            reportPath: filepath,
            shareUrl,
            summary: findings.map(f => ({
              platform: f.platform,
              preview: f.rawOutput.substring(0, 500) + (f.rawOutput.length > 500 ? "..." : "")
            }))
          });

        } catch (error) {
          // ===== UPDATE DB SESSION TO ERROR =====
          await prisma.doomscrollSession.update({
            where: { id: dbSession.id },
            data: {
              status: "ERROR",
              duration: formatDuration(Date.now() - startTime),
            },
          });
          console.log(`📝 DB Session ${dbSession.id} marked ERROR`);
          throw error;
        } finally {
          // ALWAYS stop the browser session to prevent cloud costs!
          await stopSession();
        }
      },
      {
        name: "doomscroll_research",
        description:
          "Research a topic across the web using automated browser. Primarily uses Google News, BBC, Reuters, AP News, and TechCrunch - all sources that don't require login. Can optionally try Reddit and X but will skip if login is required. Great for market research, trend analysis, news tracking, competitive intelligence, or deep-diving into any subject. Each finding is enriched with an AI-generated summary (comprehensive, not shortened). The browser session is automatically cleaned up.",
        schema: z.object({
          topic: z.string().describe("The topic to research across web sources"),
          platforms: z
            .array(z.enum(["youtube", "google", "bbc", "reuters", "apnews", "techcrunch", "reddit", "x"]))
            .optional()
            .describe("Which sources to research. Default: youtube (shorts with captions), google, bbc, reuters, apnews (no login required). Reddit/X are optional but will be skipped if login is required."),
          durationHours: z
            .number()
            .optional()
            .describe("Approximate duration in hours (default: 1). This influences depth of research."),
        }),
      }
    )
  );

  return tools;
}



async function getUserContacts(userId: string) {
  const contacts = await prisma.userEmailList.findMany({
    where: { userId },
    select: {
      name: true,
      email: true,
    },
  });

  return contacts;
}

/* ============================================================
   MAIN AGENT
============================================================ */

export async function runMainAgent(
  input: RunMainAgentInput,
): Promise<RunMainAgentOutput> {
  console.log("🚀 Paxio Main Agent - Starting");
  console.log("👤 User ID:", input.userId);

  const contacts = await getUserContacts(input.userId);

  const contactsText =
    contacts.length === 0
      ? "No saved contacts."
      : contacts.map((c) => `${c.name} → ${c.email}`).join("\n");

  console.log("contacts:", contactsText);

  console.log("🔑 Fetching credentials...");
  const creds = await TestAllCredentials(input.userId);

  console.log("📋 Credentials status:", {
    notion: !!creds.notion ? "✅ Connected" : "❌ Not connected",
    calendar: !!creds.calendar ? "✅ Connected" : "❌ Not connected",
    gmail: !!creds.gmail ? "✅ Connected" : "❌ Not connected",
  });

  // Fetch delivery details for Zepto context
  const userHelper = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      quickDeliveryPhoneNuber: true,
      quickDeliveryAddress: true,
      quickDeliveryUpiId: true
    }
  });

  const delivery = {
    phone: userHelper?.quickDeliveryPhoneNuber,
    address: userHelper?.quickDeliveryAddress,
    upi: userHelper?.quickDeliveryUpiId
  };

  const zeptoConfigured = !!(delivery.phone && delivery.address && delivery.upi);

  let deliveryContext = "";
  if (zeptoConfigured) {
    deliveryContext = `
=== ZEPTO DELIVERY CONTEXT ===
The user has configured the following delivery details for Zepto. 
Use these values automatically when calling the zepto_order tool. DO NOT ask the user for them.
- Address: "${delivery.address}"
- Phone: "${delivery.phone}"
- UPI ID: "${delivery.upi}"
==============================
`;
  } else {
    deliveryContext = `
=== ZEPTO DELIVERY CONTEXT ===
⚠️ ZEPTO NOT CONFIGURED.
The user has NOT set up their delivery address or phone number in the database.
If the user asks to order/buy something from Zepto:
1. DO NOT call the zepto_order tool.
2. DO NOT ask them for address/phone details.
3. REPLY: "Please configure your Zepto delivery details (Address, Phone, UPI) in the tools menu first."
==============================
`;
  }


  // Flatten all tools into a single array
  // Using explicit type to avoid "Type instantiation is excessively deep" error
  const allTools: any[] = [
    ...createNotionTools(creds.notion),
    ...createCalendarTools(creds.calendar),
    ...createGmailTools(creds.gmail),
    ...createRedditTools(),


    // Zepto tools - use the already fetched delivery details if available
    ...(zeptoConfigured ? createShoppingTools(input.userId, {
      phone: delivery.phone!,
      address: delivery.address!,
      upiId: delivery.upi!
    }) : []),
    ...createDoomscrollerTools(input.userId, input.prompt),

  ];

  console.log(
    `📦 Loaded ${allTools.length} tools:`,
    allTools.map((t) => t.name).join(", "),
  );

  if (allTools.length === 0) {
    console.error("❌ NO TOOLS LOADED! Check credentials.");
    return {
      response:
        "I don't have access to any services yet. Please connect your Google Calendar, Gmail, or Notion account first.",
    };
  }

  //@@testing socketId usage and streamMessage
  // streamVoiceMessage("Hello Anish", input.socketId);

  // Helper to create agent with a specific API key index
  function createAgentWithKey(keyIndex: number) {
    return createReactAgent({
      llm: getGeminiLLMByIndex(keyIndex),
      tools: allTools,
    });
  }

  try {
    console.log("💬 User prompt:", input.prompt);

    const shortTermMemory = await getShortTermMemory(
      input.userId,
      input.conversationId,
    );

    const longTermMemory = await getRelevantLongTermMemory(
      input.userId,
      input.prompt,
    );

    const shortTermContext = shortTermMemory
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const longTermContext = longTermMemory
      .map((m) => `- (${m.category}) ${m.key}: ${m.value}`)
      .join("\n");

    console.log("Short term context :", shortTermContext);
    console.log("Longe term context :", longTermContext);

    // Invoke agent with API key fallback on rate limit errors
    async function invokeAgentWithFallback(messages: any[]): Promise<any> {
      const keyCount = getApiKeyCount();
      let lastError: any;

      for (let attempt = 0; attempt < keyCount; attempt++) {
        try {
          const agent = createAgentWithKey(attempt);
          console.log(`[mainAgent] Attempting with API key ${attempt + 1}/${keyCount}`);
          const result = await agent.invoke({ messages });

          // Success - rotate to this key for future use
          if (attempt > 0) rotateApiKey();
          return result;
        } catch (err: any) {
          console.warn(`[mainAgent] API key ${attempt + 1}/${keyCount} failed:`, err.message || err);
          lastError = err;

          // Only retry on rate limit / quota errors
          const isRetryable = err.message?.includes("429") ||
            err.message?.includes("quota") ||
            err.message?.includes("rate") ||
            err.message?.includes("RESOURCE_EXHAUSTED");

          if (!isRetryable) throw err;
        }
      }
      throw new Error(`[mainAgent] All ${keyCount} API keys exhausted. Last error: ${lastError?.message || lastError}`);
    }

    // Invoke with both system and human messages
    const result = await invokeAgentWithFallback([
      new SystemMessage(`You are Paxio, an AI assistant that helps users manage Gmail, Google Calendar, and Notion,Reddit

========================
ABSOLUTE RULES (VERY IMPORTANT)
========================

1. You MUST ALWAYS return VALID JSON.
2. NO plain text.
3. NO explanations.
4. NO markdown.
5. NO extra keys.
6. If you break JSON format → your response is INVALID.
7. If unsure → still return valid JSON.
8. Follow schemas strictly.
9. Use proper formatting inside JSON strings.
10. NEVER copy past conversation style.
11. IGNORE memory formatting styles – ONLY FOLLOW THIS PROMPT.

========================
USER MEMORY CONTEXT
========================

LONG-TERM MEMORY:
${longTermContext || "None"}

RECENT CONVERSATION:
${shortTermContext || "None"}

CONTACTS (use them to fetch emailId by name):
${contactsText}

${deliveryContext}

========================
CRITICAL TOOL RULES
========================

1. If user asks for an ACTION → you MUST call tool
2. NEVER fake actions
3. Ask for credentials if missing
4. Do NOT store temporary info in memory
5. TTC MUST be returned ONLY if:
   - Tool WAS REQUIRED
   - Tool was NOT CONNECTED
6. If user asks for trends, sentiment, opinions, public discussion, or analysis → prefer Reddit tools
7. If user asks to order, buy, or shop for groceries/products from Zepto → use the zepto_order tool
   - FIRST CALL: Provide location, phone_number, product (no OTP). Returns sessionId.
   - WHEN USER PROVIDES OTP: You MUST call zepto_order again with the SAME location, phone_number, product, 
     PLUS the otp AND the sessionId from the previous response. This resumes the existing session.
   - CRITICAL: Without sessionId, a NEW session is created and the OTP won't work!
   - **OTP DETECTION**: If the RECENT CONVERSATION shows "awaiting_otp" or "OTP sent" for a Zepto order,
     AND the user sends a 4-6 digit number (like "492983", "1234", "158196 is the otp", etc.),
     you MUST call zepto_order with the otp parameter and the previous order details (location, phone_number, product).
     The sessionId will be auto-resolved server-side, so you can pass it if you have it, or leave it empty.
     NEVER respond with "session expired" - always try calling the tool with the OTP.
8. If user asks to research news, trends, or topics on the web → use doomscroll_research tool
   - Default platforms: Google News, BBC, Reuters, AP News (NO LOGIN REQUIRED)
   - Can optionally include Reddit/X but will SKIP them if login is required
   - Each finding is enriched with AI-generated comprehensive summary
   - Great for market research, news tracking, trend analysis, competitive intelligence
   - Browser session is automatically cleaned up after completion

========================
AUTONOMOUS BEHAVIOR (BE PROACTIVE)
========================

**NEVER ask user for information you can generate or infer yourself.**

GMAIL:
- Subject missing? → Generate a concise, professional subject line from the email content
- Body incomplete? → Craft a complete, professional email based on context and intent
- Greeting/signature missing? → Add appropriate "Hi [Name]," and "Best regards,"
- CC/BCC unclear? → Skip them unless explicitly requested

CALENDAR:
- Duration missing? → Default to 30 minutes for meetings, 1 hour for events
- End time missing? → Calculate from start time + default duration
- Location missing? → Skip it unless user mentions a place
- Reminder missing? → Use default reminders

NOTION:
- Page title unclear? → Infer from content or context
- Database to use unclear? → Search and pick the most relevant one

GENERAL:
- If you CAN figure it out → DO IT, don't ask
- If info is in LONG-TERM MEMORY or CONTACTS → USE IT
- If user says "send email to Anush" → Look up Anush in contacts, generate subject/body
- Only ask when info is TRULY ambiguous and critical (e.g., "which Anush?" if multiple exist)

EXAMPLES OF WHAT TO DO:
✅ "Send email to Nishant about the project" → Generate subject "Project Update", compose body, send
✅ "Schedule meeting with team tomorrow" → Pick reasonable time (10am), 1 hour duration, create event
✅ "Create a note about today's discussion" → Generate title "Discussion Notes - [Date]", create page

EXAMPLES OF WHAT NOT TO DO:
❌ "What should the subject be?" → NEVER ask, generate it
❌ "When should I schedule it?" → NEVER ask, pick a reasonable default
❌ "Which database should I use?" → NEVER ask, find the right one

========================
LONG-TERM MEMORY SAVING (IMPORTANT)
========================

When user shares personal information, SAVE IT to longTermMemory array.
This is CRITICAL for personalization.

WHAT TO SAVE (Categories):
1. "preference" - User preferences
   - "I prefer dark mode", "I like short emails", "I prefer morning meetings"
   
2. "personal" - Personal info
   - "My name is...", "Call me...", "My birthday is..."
   - "I work at...", "My job is...", "I live in..."

3. "contact" - Contact information
   - "My email is...", "Reach me at...", "Anushay's email is..."
   
4. "habit" - User habits/routines
   - "I usually...", "I always...", "Every morning I..."
   
5. "project" - Current projects
   - "I'm working on...", "I'm building...", "My current project is..."
   
6. "tool" - Tools/apps user uses
   - "I use Notion for...", "I prefer Slack over..."
   
7. "instruction" - Standing instructions
   - "Always CC me on...", "Never send emails after 6pm"
   - "Whenever I ask for..., also include..."

FORMAT for longTermMemory:
[
  {
    "category": "preference|personal|contact|habit|project|tool|instruction",
    "key": "short_identifier_like_email_preference_or_name",
    "value": "the actual information to remember"
  }
]

EXAMPLES:
User: "I prefer shorter emails"
→ longTermMemory: [{"category": "preference", "key": "email_length", "value": "User prefers shorter, concise emails"}]

User: "My name is Anush, call me that"
→ longTermMemory: [{"category": "personal", "key": "name", "value": "User's name is Anush"}]

User: "Nishant's email is nishant@example.com"
→ longTermMemory: [{"category": "contact", "key": "nishant_email", "value": "nishant@example.com"}]

User: "Always send me calendar reminders 30 minutes before"
→ longTermMemory: [{"category": "instruction", "key": "calendar_reminder_time", "value": "Send calendar reminders 30 minutes before event"}]

RULES:
- Only save NEW information, not repeats
- Use lowercase_with_underscores for keys
- Value should be a clear, complete sentence
- If NO personal info to save, return empty array: []

========================
FINAL RESPONSE FORMAT (MANDATORY)
========================

{
  "type": ["gmail", "calendar", "reddit", "notion", "graphs", "shopping", "doomscroll", "general"],
  "response": "<user-facing message>",
  "data": {},
  "longTermMemory": []
}


⚠️ TTC FIELD RULE:
- Include "TTC" ONLY when tool was required BUT unavailable
- Otherwise DO NOT include TTC key at all

========================
TYPE SCHEMAS
========================

--- TYPE: gmail ---

"data": {
  "gmail": {
    "emails": [
      {
        "summarizedEmail": "short summary",
        "to": "email",
        "cc": [],
        "from":"email",
        "subject": "subject",
        "message": "FORMATTED EMAIL BODY",
        "time": "optional",
        "tags": ["optional"]
      }
    ]
  }
}

When responding with TYPE: email:
 -  Make the email body look professional
 -  Use proper formatting inside JSON strings
 -  Do not copy past conversation style
 -  Use proper email formatting
 -  Generate subject line based on email content yourself until and unless enough context is not provided don't ask the user for subject line
 -  Dont use Paxio name in emails

--- TYPE: calendar ---

"data": {
  "calendar": {
    "events": [
      {
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "title": "string",
        "description": "string",
        "summarized": "1-2 lines"
      }
    ]
  }
}

--- TYPE: reddit ---

{
  "data": {
    "reddit": {
      "subreddits": [
        {
          "subredditName": "string",
          "summary": "string",
          "positiveSent": 0,
          "negativeSent": 0,
          "neutralSent": 0,
          "postsAnalyed": 0,
          "keyInsights": []
        }
      ]
    }
  }
}

For each subreddit:
- Estimate sentiment percentages (positive, neutral, negative)
- Percentages must add up to 100
- Base estimation on subreddit description and typical community stance
- If uncertain, infer likely sentiment from context
- postsAnalyed should be an estimated number (50–500)
- NEVER return 0 unless explicitly stated



--- TYPE: notion ---
{
  "data": {
    "notion": {
      "pages": [
        {
          "title": "",
          "subtitle": "",
          "summary": "",
          "properties": {
            "status": "",
            "tags": [],
            "createdAt": "",
            "updatedAt": ""
          },
          "content": [
            {
              "type": "paragraph",
              "text": ""
            },
            {
              "type": "list",
              "items": []
            },
            {
              "type": "callout",
              "tone": "",
              "text": ""
            }
          ]
        }
      ]
    }
  }
}

When responding with TYPE: notion:

- You MUST return data in the exact Notion schema provided
- Do NOT include raw Notion API blocks or IDs
- Transform any Notion content into:
  - paragraph blocks
  - list blocks
  - callout blocks
- Use clear, UI-friendly language
- If information is missing, leave fields empty
- NEVER invent extra keys
- NEVER omit required arrays

If the user asks to read, summarize, or view a Notion page:
1. Use Notion tools to fetch the page
2. Then generate the Notion UI schema as output


--- TYPE: graphs ---

"data": {
  "graphs": {
    "graph": [
      {
        "type": "line | bar | pie | area | radar",
        "title": "Chart Title",
        "description": "Chart description",
        "chartData": [],
        "chartConfig": {}
      }
    ]
  }
}

GRAPH TYPES & FORMATS:

1. LINE CHART:
{
  "type": "line",
  "title": "Monthly Trend",
  "description": "Tracking monthly values",
  "chartData": [
    { "date": "2024-04-01", "value1": 222, "value2": 150 },
    { "date": "2024-05-01", "value1": 448, "value2": 490 }
  ],
  "chartConfig": {
    "value1": { "label": "Value 1", "color": "var(--chart-1)" },
    "value2": { "label": "Value 2", "color": "var(--chart-2)" }
  }
}

2. BAR CHART:
{
  "type": "bar",
  "title": "Category Comparison",
  "description": "Comparing categories",
  "chartData": [
    { "month": "January", "desktop": 186, "mobile": 80 },
    { "month": "February", "desktop": 305, "mobile": 200 }
  ],
  "chartConfig": {
    "desktop": { "label": "Desktop", "color": "var(--chart-1)" },
    "mobile": { "label": "Mobile", "color": "var(--chart-2)" }
  }
}

3. PIE CHART:
{
  "type": "pie",
  "title": "Distribution",
  "description": "Category distribution",
  "chartData": [
    { "browser": "chrome", "visitors": 275, "fill": "var(--color-chrome)" },
    { "browser": "safari", "visitors": 200, "fill": "var(--color-safari)" }
  ],
  "chartConfig": {
    "visitors": { "label": "Visitors" },
    "chrome": { "label": "Chrome", "color": "var(--chart-1)" },
    "safari": { "label": "Safari", "color": "var(--chart-2)" }
  }
}

4. AREA CHART:
{
  "type": "area",
  "title": "Growth Over Time",
  "description": "Area visualization",
  "chartData": [
    { "month": "January", "desktop": 186, "mobile": 80 },
    { "month": "February", "desktop": 305, "mobile": 200 }
  ],
  "chartConfig": {
    "desktop": { "label": "Desktop", "color": "var(--chart-1)" },
    "mobile": { "label": "Mobile", "color": "var(--chart-2)" }
  }
}

5. RADAR CHART:
{
  "type": "radar",
  "title": "Performance Metrics",
  "description": "Multi-axis comparison",
  "chartData": [
    { "month": "January", "desktop": 186 },
    { "month": "February", "desktop": 305 }
  ],
  "chartConfig": {
    "desktop": { "label": "Desktop", "color": "var(--chart-1)" }
  }
}

When to use graphs:
- User asks for analytics, trends, insights, or visualizations
- Expense/finance analysis requests
- Performance tracking requests
- Comparison or distribution analysis
- Any data that benefits from visual representation

IMPORTANT GRAPH RULES:
1. Each key in chartConfig MUST have both "label" and "color" properties
2. Use "var(--chart-1)" through "var(--chart-5)" for colors
3. For pie charts, use "fill" property in chartData with "var(--color-{name})"
4. chartData must be an array of objects with consistent keys
5. If no visualization is needed, omit the graphs field entirely (return empty)
6. type in response array should include "graphs" when returning graph data



--- TYPE: shopping ---

"data": {
  "shopping": {
    "platform": "zepto",
    "orders": [
      {
        "product": "product name",
        "location": "delivery address",
        "phone_number": "phone used for OTP",
        "status": "awaiting_otp | complete | failed",
        "sessionId": "IMPORTANT: session ID to pass when continuing with OTP",
        "sessionUrl": "public share URL to view browser session",
        "liveUrl": "live URL for real-time viewing",
        "message": "status message",
        "productScreenshot": "path to product screenshot (if available)",
        "checkoutScreenshot": "path to checkout screenshot (if available)"
      }
    ]
  }
}

When responding with TYPE: shopping:
- Use the zepto_order tool for Zepto shopping requests
- For first-time orders without OTP, status will be "awaiting_otp"
- CRITICAL: When status is "awaiting_otp", include sessionId in the response data
- When user provides OTP later, call zepto_order with otp + sessionId + original params
- Include the sessionUrl so user can watch the browser automation in real-time
- Once OTP is provided and order completes, status will be "complete"

--- TYPE: general ---

"data": {}

========================
GENERAL RESPONSE RULE
========================

Even for NORMAL QUESTIONS, you MUST respond in JSON.

========================
FORMATTING RULES
========================

- Indent properly
- No trailing commas
- Escape newlines using \\n
- Email bodies MUST look professional
- All text MUST be inside JSON
- type MUST ALWAYS be an array

========================
EXAMPLES
========================

--- Example 1: Gmail (tool connected, so NO TTC) ---

{
  "type": ["gmail"],
  "response": "Email sent successfully.",
  "data": {
    "gmail": {
      "emails": [
        {
          "summarizedEmail": "Birthday wish email",
          "to": "anishs1207@gmail.com",
          "cc": [],
          "from":"",
          "subject": "Happy Birthday ",
          "message": "Dear Anushay,\\n\\nWishing you a very happy birthday! \\nMay your day be filled with joy and success.\\n\\nBest regards",
          "time": "10:30 AM",
          "tags": ["birthday", "personal"]
        }
      ]
    }
  },
  "longTermMemory": []
}

--- Example 2: Multiple Types (Gmail + Calendar) ---

{
  "type": ["gmail", "calendar"],
  "response": "Email sent and meeting scheduled.",
  "data": {
    "gmail": {
      "emails": [
        {
          "summarizedEmail": "Project update email",
          "to": "pm@company.com",
          "cc": [],
          "subject": "Project Update",
          "message": "Dear Manager,\\n\\nThe project is on track and progressing well.\\nWe will share the detailed report soon.\\n\\nBest regards,
          "time": "09:00 AM",
          "tags": ["work"]
        }
      ]
    },
    "calendar": {
          "events": [
            {
              "date": "2026-01-25",
              "time": "15:00",
              "title": "Project Review",
              "description": "Monthly project review meeting",
              "summarized": "Monthly project sync"
          }
        ]
    }
  },
  "longTermMemory": []
}

--- Example 3: Tool NOT connected (Notion) ---

{
  "type": ["general"],
  "TTC": ["notion"],
  "response": "Notion is not connected. Please connect Notion to proceed.",
  "data": {},
  "longTermMemory": []
}

--- Example 4: General Question ---

{
  "type": ["general"],
  "response": "A gyroscope is a sensor used in gaming to detect motion and rotation.",
  "data": {},
  "longTermMemory": []
}


--- Example 5: Reddit ---

{
  "data": {
    "reddit": {
      "subreddits": [
        {
          "subredditName": "reactjs",
          "summary": "Mostly positive discussions around hooks and performance.",
          "positiveSent": 120,
          "negativeSent": 30,
          "neutralSent": 50,
          "postsAnalyed": 200,
          "keyInsights": ["Hooks adoption is high", "Performance debates ongoing"]
        },
        {
          "subredditName": "nextjs",
          "summary": "Mixed sentiment due to app router changes.",hts",
          "summary": "A living document capturing insights, experiments, and UX learnings while building and evaluating modern AI-powered products.",
          "properties": {
            "status": "In Progress",
            "tags": ["AI", "Research", "Notes"],
            "createdAt": "12 Jan 2026",
            "updatedAt": "14 Jan 2026"
          },
          "content": [
            {
              "type": "paragraph",
              "text": "This page captures my ongoing exploration into how AI tools can enhance productivity, creativity, and decision-making."
            },
            {
              "type": "list",
              "items": [
                "AI copilots reduce cognitive load significantly",
                "UX matters more than raw model intelligence",
                "Latency strongly affects perceived quality"
              ]
            },
            {
              "type": "callout",
              "tone": "tip",
              "text": "Tools that feel instant are trusted more than those that are technically superior but slower."
            }
          ]
        }
      ]
    }
  }
}


--- Example 6: Graphs (Analytics/Visualization) ---

{
  "type": ["graphs"],
  "response": "Here's your app usage breakdown:",
  "data": {
    "graphs": {
      "graph": [
        {
          "type": "pie",
          "title": "App Usage Distribution",
          "description": "Distribution of app usage",
          "chartData": [
            { "app": "Gmail", "usage": 60, "fill": "var(--color-gmail)" },
            { "app": "Calendar", "usage": 30, "fill": "var(--color-calendar)" },
            { "app": "Notion", "usage": 10, "fill": "var(--color-notion)" }
          ],
          "chartConfig": {
            "usage": { "label": "Usage %" },
            "gmail": { "label": "Gmail", "color": "var(--chart-1)" },
            "calendar": { "label": "Calendar", "color": "var(--chart-2)" },
            "notion": { "label": "Notion", "color": "var(--chart-3)" }
          }
        }
      ]
    }
  },
  "longTermMemory": []
}

⚠️ CRITICAL: graphs MUST use nested structure: data.graphs.graph (array inside object)
DO NOT return data.graphs as a direct array!


`),
      new HumanMessage(input.prompt),
    ]);

    console.log("✅ Agent completed");

    // Extract final message
    const messages = result.messages;
    const lastMessage = messages[messages.length - 1];
    const output = lastMessage.content || "Task completed successfully.";

    console.log("output :", output);

    function safeParseAgentJSON(raw: any) {
      if (!raw) return null;

      if (typeof raw === "object") return raw;

      if (typeof raw !== "string") return null;

      let text = raw.trim();

      // ---- REMOVE CODE BLOCKS ----
      if (text.startsWith("```")) {
        text = text
          .replace(/^```(json)?/i, "")
          .replace(/```$/, "")
          .trim();
      }

      // Try full parse
      try {
        return JSON.parse(text);
      } catch { }

      // Extract JSON between { }
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;

      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }

    const parsed = safeParseAgentJSON(output);

    console.log("📤 Response:", parsed);

    const finalResponse: string = parsed.response ?? "Done.";
    const memories = Array.isArray(parsed.longTermMemory)
      ? parsed.longTermMemory
      : [];

    for (const mem of memories) {
      if (!mem.category || !mem.key || !mem.value) continue;

      await saveLongTermMemory(input.userId, mem.category, mem.key, mem.value);
    }

    await saveShortTermMemory(
      input.userId,
      input.conversationId,
      "user",
      input.prompt,
    );

    await saveShortTermMemory(
      input.userId,
      input.conversationId,
      "assistant",
      finalResponse,
    );

    return {
      //@ts-expect-error
      parsed,
    };
  } catch (error) {
    console.error("❌ Agent execution error:", error);
    return {
      response: `Error: ${(error as Error).message}`,
    };
  }
}

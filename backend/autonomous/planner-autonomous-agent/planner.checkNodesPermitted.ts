// apps/backend/src/agents/chat/3-planner-agent/planner.checkNodesPermitted.ts
//@ts-ignore
import { getPermittedNodes } from "../../../../../../../web/lib/getUserConnectedNodes";

/**
 * Maps internal service names from DB/frontend to workflow node names
 */
const NODE_NAME_MAP: Record<string, string> = {
  gmail: "gmail",
  sheets: "google-sheets",
  slack: "slack", // optional if you add Slack node
  notion: "notion",
  calendar: "google-calendar",
  docs: "google-docs",
  drive: "google-drive",
  outlook: "outlook",
  cal: "cal",
  calendly: "calendly",
  twitter: "twitter",
  reddit: "reddit",
  forms: "google-forms", // optional if you have Calendar node
};

/**
 * Returns the list of workflow nodes the user has connected
 */
export default async function checkNodesPermittedByUser(userId: string) {
  const permitted = await getPermittedNodes(userId);

  console.log("permitted", permitted);

  // Map DB/frontend names to canonical workflow node names
  const workflowNodes = permitted
    //@ts-ignore
    .map((name) => NODE_NAME_MAP[name])
    .filter(Boolean); // remove any undefined mappings

   workflowNodes.push("creative-node") 

  console.log("User permitted nodes:", workflowNodes);

  return workflowNodes;
}

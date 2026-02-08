import { streamMessage } from "../../../../../utils/ws";
import { generalResponseSchema } from "../../../../../validations/index";

export default function parseJson(response: any, socketId: string) {
  try {
    let cleanedResponse = response.replace(/```json|```/gi, "").trim();
    let parsedResponse = JSON.parse(cleanedResponse);

    generalResponseSchema.parse(parsedResponse);

    return parsedResponse;
  } catch (err) {
    console.warn("Failed to parse General Agent JSON, treating as chat:", err);
    streamMessage("General", "error", socketId, "");
    return { chatResponse: response };
  }
}

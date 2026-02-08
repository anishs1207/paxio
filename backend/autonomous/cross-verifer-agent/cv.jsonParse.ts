import { callGemini } from "../../../../..//utils/geminiClient";

export default async function getParsedLLMJson(prompt: string) {
  let llmResponse: any;
  try {
    const rawResponse = await callGemini(prompt);

    const cleanedResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      llmResponse =
        typeof cleanedResponse === "string"
          ? JSON.parse(cleanedResponse)
          : cleanedResponse;
    } catch (parseErr) {
      console.warn("Failed to parse Gemini response as JSON:", parseErr);
      llmResponse = { quesValidated: false };
    }
  } catch (err) {
    console.warn("Gemini call failed, proceeding without validation:", err);
    llmResponse = { quesValidated: false };
  }

  return llmResponse;
}
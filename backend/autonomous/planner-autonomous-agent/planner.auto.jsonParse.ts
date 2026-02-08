// apps/backend/src/agents/autonomous/planner-autonomous/planner.jsonParse.ts
export default function parseJsonFromLLM(response: string) {
  try {
    response = response.replace(/```json|```/gi, "").trim();

    const firstBracket = response.indexOf("[");
    const firstBrace = response.indexOf("{");

    let jsonText = response;

    if (firstBracket !== -1) {
      jsonText = response.substring(firstBracket);
      const lastBracket = jsonText.lastIndexOf("]");
      if (lastBracket !== -1) jsonText = jsonText.substring(0, lastBracket + 1);
    } else if (firstBrace !== -1) {
      jsonText = response.substring(firstBrace);
      const lastBrace = jsonText.lastIndexOf("}");
      if (lastBrace !== -1) jsonText = jsonText.substring(0, lastBrace + 1);
    }

    const parsedResponse = JSON.parse(jsonText);

    if (!Array.isArray(parsedResponse)) {
      throw new Error("Planner response is not a JSON array");
    }
    if (parsedResponse.length > 10) {
      return parsedResponse.slice(0, 10);
    }

    return parsedResponse;
  } catch (err) {
    return {
      success: false,
      data: [],
      message: "Planner-Agent: Error parsing the json response",
      raw: response,
    };
  }
}

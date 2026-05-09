export function parseLLMJson(resultText: string) {
  let cleaned = resultText.trim();

  cleaned = cleaned
    .replace(/^```json/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBracket = cleaned.search(/[\[\{]/);
  if (firstBracket > 0) {
    cleaned = cleaned.slice(firstBracket);
  }

  return JSON.parse(cleaned);
}

export function parseResponse(response: string) {
  try {
    const jsonMatch = response.match(/'''json\s*([\s\S]*?)\s*'''/);

    if (jsonMatch && jsonMatch[1]) {
      const jsonString = jsonMatch[1]
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\n\s*/g, "\n")
        .trim();

      return JSON.parse(jsonString);
    }

    const fallbackMatch = response.match(/\[\s*{[\s\S]*}\s*\]/);
    if (fallbackMatch && fallbackMatch[0]) {
      return JSON.parse(fallbackMatch[0]);
    }

    throw new Error("No valid JSON block found in response.");
  } catch (err: unknown) {
    console.error("❌ Error parsing planning prompt response:", (err as Error).message);
    return null;
  }
}

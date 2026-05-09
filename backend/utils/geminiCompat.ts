import { createMiddleware, HumanMessage } from "langchain";
import { RemoveMessage } from "@langchain/core/messages";

export const geminiCompat = createMiddleware({
  name: "GeminiSystemMessageCompat",
  beforeModel: (state) => {
    if (
      state.messages.length >= 2 &&
      state.messages[0]._getType() === "system"
    ) {
      const systemMsg = state.messages[0];
      const systemContent = systemMsg.content;

      const firstHumanIndex = state.messages.findIndex(
        (msg) => msg._getType() === "human"
      );

      if (firstHumanIndex > 0) {
        const humanMsg = state.messages[firstHumanIndex];

        return {
          messages: [
            //@ts-expect-error - RemoveMessage is part of LangGraph's message management and may not be fully typed in all LangChain versions used here
            new RemoveMessage({ id: systemMsg.id }),
            new HumanMessage({
              content: `${systemContent}\n\n${humanMsg.content}`,
              id: humanMsg.id,
            }),
          ],
        };
      }
    }
  },
});

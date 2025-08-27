import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  generateText,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
import { tools } from "@/utils/tools";

export const POST = async (req: Request) => {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq("openai/gpt-oss-20b"),
    system:
      "You are Kirmada a helpful assistant Created By Yashraj Maher. When handling tool outputs, do not include or reference any URLs (e.g., imageUrl) in your responses, as they are for frontend display only.').",
    prompt: convertToModelMessages(messages),
    stopWhen: stepCountIs(2),
    providerOptions: {
      groq: {
        reasoningFormat: "parsed",
        reasoningEffort: "low",
        parallelToolCalls: true,
      },
      google: {
        thinkingConfig: {
          thinkingBudget: 8192,
          includeThoughts: true,
        },
      },
      openai: {
        reasoningEffort: "low",
        reasoningSummary: "auto",
      } satisfies OpenAIResponsesProviderOptions,
    },
    experimental_transform: smoothStream(),
    tools: {
      ...tools,
      browser_search: groq.tools.browserSearch({}),
    },
  });
  return result.toUIMessageStreamResponse({ sendReasoning: true });
};

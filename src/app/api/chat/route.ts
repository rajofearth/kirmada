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
      [
        "You are Kirmada, a helpful assistant created by Yashraj Maher.",
        "Style: concise, user-friendly, and actionable.",
        "Do NOT mention APIs, providers, HTTP statuses, or error codes to the user.",
        "When handling tool outputs, do not include or reference any URLs (e.g., imageUrl) in your responses, as they are for frontend display only.",
        "Do NOT repeat weather numbers that are already rendered in the UI (e.g., the Weather card). When weather data is shown, acknowledge briefly and add helpful guidance (e.g., packing tips, umbrella advice), or ask a clarifying follow-up instead of echoing values.",
        "If a user asks for weather on a date that is outside the provider's available window, say:",
        "- 'Forecasts are available through <end-date>. Please choose a date on or before that day.'",
        "- Add: 'New data arrives daily, so tomorrow that date should become available.'",
        "Avoid technical details; give the next-best alternative (e.g., the closest available day or the next-week overview).",
      ].join(" \n"),
    prompt: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
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

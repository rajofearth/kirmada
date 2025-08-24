import { groq } from "@ai-sdk/groq";
import { type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  generateText,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { imageGenerationTool } from "@/utils/tools";

export const POST = async (req: Request) => {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq("openai/gpt-oss-20b"),
    system:
      "You are a helpful assistant. When handling tool outputs, do not include or reference any URLs (e.g., imageUrl) in your responses, as they are for frontend display only. Acknowledge image generation with a simple confirmation (e.g., 'Image generated for your prompt').",
    prompt: convertToModelMessages(messages),
    stopWhen: stepCountIs(2),
    providerOptions: {
      groq: {
        reasoningFormat: "parsed",
        reasoningEffort: "low",
        parallelToolCalls: true,
      },
      openai: {
        reasoningEffort: "low",
        reasoningSummary: "auto",
      } satisfies OpenAIResponsesProviderOptions,
    },
    experimental_transform: smoothStream(),
    tools: {
      generateImage: imageGenerationTool,
    },
  });
  return result.toUIMessageStreamResponse();
};

import { tool, generateText } from "ai";
import z from "zod";
import { google } from "@ai-sdk/google";
import { put } from "@vercel/blob";

export const imageGenerationTool = tool({
  description: "Generate An Image",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "The Prompt To Generate An Image For (If User's prompt is simple then Enhance the prompt to get better results)",
      ),
  }),
  execute: async ({ prompt }) => {
    const result = await generateText({
      model: google("gemini-2.0-flash-preview-image-generation"),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      prompt,
    });
    for (const file of result.files) {
      if (file.mediaType.startsWith("image/")) {
        const { url } = await put(
          `images/${Date.now()}.${file.mediaType.split("/")[1]}`, // e.g., images/1692891234567.png
          Buffer.from(file.base64, "base64"),
          { access: "public" },
        );
        // Return URL for frontend, note for model
        return { imageUrl: url };
      }
    }
    return "no image generated";
  },
});

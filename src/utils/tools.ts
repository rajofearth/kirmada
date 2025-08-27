import { tool, generateText } from "ai";
import z from "zod";
import { google } from "@ai-sdk/google";
import { put, getDownloadUrl } from "@vercel/blob";
import { WeatherSchema, WeatherAtLocation } from "@/types/weather";

const WeatherInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

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
        return { imageUrl: url, downloadUrl: getDownloadUrl(url) };
      }
    }
    return "no image generated";
  },
});

export const getWeather = tool({
  description: "Get the current weather at a location",
  inputSchema: WeatherInputSchema,
  execute: async (
    args: z.infer<typeof WeatherInputSchema>,
  ): Promise<WeatherAtLocation> => {
    const { latitude, longitude } = args;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`;

    const res = await fetch(url);
    const json = await res.json();

    const cleaned = {
      location: {
        latitude: json.latitude,
        longitude: json.longitude,
        timezone: json.timezone,
      },
      current: {
        time: json.current.time,
        temperature: json.current.temperature_2m,
      },
      today: {
        sunrise: json.daily.sunrise[0],
        sunset: json.daily.sunset[0],
      },
      hourly: json.hourly.time.slice(0, 6).map((t: string, i: number) => ({
        time: t,
        temperature: json.hourly.temperature_2m[i],
      })),
    };

    // runtime validate & return typed object
    return WeatherSchema.parse(cleaned);
  },
});

export const tools = {
  displayWeather: getWeather,
  imageGen: imageGenerationTool,
};

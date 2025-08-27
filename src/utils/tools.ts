import { tool, generateText } from "ai";
import z from "zod";
import { google } from "@ai-sdk/google";
import { put, getDownloadUrl } from "@vercel/blob";
import { WeatherSchema, WeatherAtLocation } from "@/types/weather";

const WeatherInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  // Optional specific day and hour to fetch (YYYY-MM-DD, 0-23)
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  hour: z.number().int().min(0).max(23).optional(),
  // Optional range preset for multi-day forecasts
  range: z.enum(["next_week"]).optional(),
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
  description:
    "Get weather now, for a specific date/hour, or the next week (range)",
  inputSchema: WeatherInputSchema,
  execute: async (
    args: z.infer<typeof WeatherInputSchema>,
  ): Promise<WeatherAtLocation> => {
    const { latitude, longitude, date, hour, range } = args;

    // Weekly forecast branch
    if (range === "next_week") {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum,weathercode&hourly=weathercode&current=temperature_2m,weathercode&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      const json = await res.json();

      const codeToCondition = (code?: number): string | undefined => {
        if (code == null) return undefined;
        // Simplified mapping of WMO codes
        if (code === 0) return "clear";
        if ([1, 2, 3].includes(code)) return "cloudy";
        if ([45, 48].includes(code)) return "fog";
        if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
        if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
        if ([95, 96, 99].includes(code)) return "thunderstorm";
        return "unknown";
      };

      const hourlyTimes: string[] = json.hourly?.time ?? [];
      const hourlyCodes: number[] = json.hourly?.weathercode ?? [];

      const week = (json.daily?.time ?? []).map((d: string, i: number) => {
        // prefer midday code for that day; fallback to first hour of the day
        const midday = `${d}T12:00`;
        let idx = hourlyTimes.findIndex((t) => t === midday);
        if (idx === -1) idx = hourlyTimes.findIndex((t) => t.startsWith(d));
        let code = idx !== -1 ? hourlyCodes[idx] : undefined;
        if (code == null) {
          code = json.daily?.weathercode?.[i];
        }

        return {
          date: d,
          tempMax: json.daily?.temperature_2m_max?.[i] ?? 0,
          tempMin: json.daily?.temperature_2m_min?.[i] ?? 0,
          sunrise: json.daily?.sunrise?.[i] ?? `${d}T06:00`,
          sunset: json.daily?.sunset?.[i] ?? `${d}T18:00`,
          precipitationProbabilityMax:
            json.daily?.precipitation_probability_max?.[i],
          precipitationSum: json.daily?.precipitation_sum?.[i],
          weatherCode: code,
          condition: codeToCondition(code),
        };
      });

      const cleaned = {
        location: {
          latitude: json.latitude,
          longitude: json.longitude,
          timezone: json.timezone,
        },
        current: {
          time: json.current?.time ?? new Date().toISOString(),
          temperature: json.current?.temperature_2m ?? 0,
          condition: codeToCondition(json.current?.weathercode),
        },
        today: {
          sunrise: json.daily?.sunrise?.[0] ?? week[0]?.sunrise ?? "",
          sunset: json.daily?.sunset?.[0] ?? week[0]?.sunset ?? "",
        },
        week,
      };

      return WeatherSchema.parse(cleaned);
    }

    // If a specific date is requested, fetch that day's data from the correct API
    if (date) {
      const todayUtc = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const isPast = date < todayUtc;
      const base = isPast
        ? "https://archive-api.open-meteo.com/v1/archive"
        : "https://api.open-meteo.com/v1/forecast";

      const dayUrl = `${base}?latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&hourly=temperature_2m,weathercode&daily=sunrise,sunset,weathercode&timezone=auto`;

      const res = await fetch(dayUrl);
      const json = await res.json();

      const hourlyTimes: string[] = json?.hourly?.time ?? [];
      const hourlyTemps: number[] = json?.hourly?.temperature_2m ?? [];

      // Index of first hour of that day
      const firstIdx = hourlyTimes.findIndex((t) => t.startsWith(date));
      let selectedIdx = firstIdx;
      if (firstIdx !== -1) {
        if (typeof hour === "number") {
          const hourStr = `${String(hour).padStart(2, "0")}:00`;
          const found = hourlyTimes.findIndex(
            (t) => t.startsWith(`${date}T${hourStr}`),
          );
          selectedIdx = found !== -1 ? found : Math.min(firstIdx + 12, firstIdx + 23);
        } else {
          selectedIdx = Math.min(firstIdx + 12, firstIdx + 23); // midday fallback
        }
      }

      const codeToCondition = (code?: number): string | undefined => {
        if (code == null) return undefined;
        if (code === 0) return "clear";
        if ([1, 2, 3].includes(code)) return "cloudy";
        if ([45, 48].includes(code)) return "fog";
        if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
        if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
        if ([95, 96, 99].includes(code)) return "thunderstorm";
        return "unknown";
      };

      const cleaned = {
        location: {
          latitude: json.latitude,
          longitude: json.longitude,
          timezone: json.timezone,
        },
        current: {
          time: hourlyTimes[selectedIdx] ?? `${date}T00:00`,
          temperature:
            hourlyTemps[selectedIdx] ?? (hourlyTemps[firstIdx] ?? 0),
          condition: codeToCondition(json?.hourly?.weathercode?.[selectedIdx]),
        },
        today: {
          sunrise: json?.daily?.sunrise?.[0] ?? `${date}T06:00`,
          sunset: json?.daily?.sunset?.[0] ?? `${date}T18:00`,
        },
      };

      return WeatherSchema.parse(cleaned);
    }

    // Default to current conditions + today's highlights
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
    };

    return WeatherSchema.parse(cleaned);
  },
});

export const tools = {
  displayWeather: getWeather,
  imageGen: imageGenerationTool,
};

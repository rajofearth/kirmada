import { tool, generateText } from "ai";
import z from "zod";
import { google } from "@ai-sdk/google";
import { put, getDownloadUrl } from "@vercel/blob";
import { WeatherSchema, WeatherAtLocation } from "@/types/weather";

const BaseInputSchema = z.object({
  latitude: z.number().describe("Latitude in decimal degrees. Example: 52.52"),
  longitude: z
    .number()
    .describe("Longitude in decimal degrees. Example: 13.41"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe(
      "Optional date YYYY-MM-DD. Works for past and future using the Forecast API with start/end date.",
    )
    .optional(),
  range: z
    .enum(["next_week"])
    .describe("Use 'next_week' to fetch a 7-day daily forecast in one call.")
    .optional(),
});

const WeatherInputSchema = BaseInputSchema;

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
    "Weather by coordinates: now (current), a specific date (YYYY-MM-DD), or next week. Use the 'getCoords' tool first to resolve city + ISO country code to coordinates. Uses Open-Meteo Forecast API for past and future via start_date/end_date. Prefer range='next_week' for weekly summaries.",
  inputSchema: WeatherInputSchema,
  execute: async (
    args: z.infer<typeof WeatherInputSchema>,
  ): Promise<WeatherAtLocation> => {
    const { latitude, longitude, date, range } = args;

    // Weekly forecast branch
    if (range === "next_week") {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum,weathercode&hourly=weathercode&current=temperature_2m,weathercode&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      const json = await res.json();
      if (json?.error) {
        throw new Error(json?.reason || "Open-Meteo error while fetching weekly forecast");
      }

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
          latitude: Number(json.latitude),
          longitude: Number(json.longitude),
          timezone: json.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
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

    // If a specific date is requested, fetch that day's data from Forecast API
    if (date) {
      const base = "https://api.open-meteo.com/v1/forecast";
      const dayUrl = `${base}?latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&hourly=temperature_2m,weathercode&daily=sunrise,sunset,weathercode&timezone=auto`;

      const res = await fetch(dayUrl);
      const json = await res.json();
      if (json?.error) {
        throw new Error(json?.reason || "Open-Meteo error while fetching date forecast");
      }

      const hourlyTimes: string[] = json?.hourly?.time ?? [];
      const hourlyTemps: number[] = json?.hourly?.temperature_2m ?? [];

      // Choose midday sample for the day, or fall back to the first hour
      const firstIdx = hourlyTimes.findIndex((t) => t.startsWith(date));
      const middayIdx = hourlyTimes.findIndex((t) => t === `${date}T12:00`);
      const selectedIdx =
        middayIdx !== -1
          ? middayIdx
          : firstIdx !== -1
          ? firstIdx
          : -1;

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
          latitude: Number(json.latitude),
          longitude: Number(json.longitude),
          timezone: json.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
        current: {
          time: hourlyTimes[selectedIdx] ?? `${date}T00:00`,
          temperature:
            selectedIdx !== -1
              ? hourlyTemps[selectedIdx]
              : firstIdx !== -1
              ? hourlyTemps[firstIdx]
              : 0,
          condition: codeToCondition(
            selectedIdx !== -1
              ? json?.hourly?.weathercode?.[selectedIdx]
              : json?.hourly?.weathercode?.[firstIdx],
          ),
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
    if (json?.error) {
      throw new Error(json?.reason || "Open-Meteo error while fetching current forecast");
    }

    const cleaned = {
      location: {
        latitude: Number(json.latitude),
        longitude: Number(json.longitude),
        timezone: json.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
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

// Geocoding tool: city + ISO country code -> coordinates (multiple matches)
export const getCoords = tool({
  description:
    "Resolve a city and ISO-3166-1 alpha-2 country code to coordinates using Open-Meteo Geocoding API. Returns up to 10 matches with latitude, longitude, admin1, and timezone.",
  inputSchema: z.object({
    city: z.string().min(2).describe("City name, e.g., 'Aurangabad'"),
    countryCode: z
      .string()
      .regex(/^[A-Za-z]{2}$/)
      .describe("ISO-3166-1 alpha-2 country code, e.g., 'IN', 'DE', 'US'"),
    count: z.number().int().min(1).max(10).default(10).optional(),
  }),
  execute: async ({ city, countryCode, count = 10 }) => {
    const q = encodeURIComponent(city.trim());
    const cc = countryCode.toUpperCase();
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=${count}&language=en&format=json&countryCode=${cc}`;
    const res = await fetch(url);
    const json = await res.json();
    const results = (json?.results ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      admin1: r.admin1,
      country: r.country,
      country_code: r.country_code,
      timezone: r.timezone,
    }));
    if (!results.length) {
      throw new Error(
        `No matches for city='${city}', country='${cc}'. See docs: https://open-meteo.com/en/docs/geocoding-api`
      );
    }
    return { url, results };
  },
});

export const tools = {
  displayWeather: getWeather,
  getCoords,
  imageGen: imageGenerationTool,
};

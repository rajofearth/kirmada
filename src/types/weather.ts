import { z } from "zod";

export const WeatherSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }),
  current: z.object({
    time: z.string(),
    temperature: z.number(),
  }),
  today: z.object({
    sunrise: z.string(),
    sunset: z.string(),
  }),
});

// 🔹 Type inference from schema
export type WeatherAtLocation = z.infer<typeof WeatherSchema>;

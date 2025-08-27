import { z } from "zod";

const DayForecastSchema = z.object({
  date: z.string(),
  tempMax: z.number(),
  tempMin: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  precipitationProbabilityMax: z.number().optional(),
  precipitationSum: z.number().optional(),
  weatherCode: z.number().optional(),
  condition: z.string().optional(),
});

export const WeatherSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  }),
  current: z.object({
    time: z.string(),
    temperature: z.number(),
    condition: z.string().optional(),
  }),
  today: z.object({
    sunrise: z.string(),
    sunset: z.string(),
  }),
  week: z.array(DayForecastSchema).optional(),
});

export type DayForecast = z.infer<typeof DayForecastSchema>;
export type WeatherAtLocation = z.infer<typeof WeatherSchema>;

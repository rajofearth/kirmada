"use client";

import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import type { WeatherAtLocation } from "@/types/weather";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function Weather({ location, current, today, week }: WeatherAtLocation) {
  const safelyFormat = (isoString: string | undefined, pattern: string): string => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, pattern);
  };

  const formattedSunrise = safelyFormat(today.sunrise, "hh:mm a");
  const formattedSunset = safelyFormat(today.sunset, "hh:mm a");
  const formattedTime = safelyFormat(current.time, "PPpp");

  // Interactivity: allow selecting a day from week forecast
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedDay = useMemo(() =>
    selectedIndex != null && Array.isArray(week) ? week[selectedIndex] : undefined,
  [selectedIndex, week]);

  // Simple condition → icon mapping
  const getWeatherIcon = (condition?: string) => {
    switch (condition) {
      case "clear":
        return <Sun className="text-primary w-7 h-7 sm:w-8 sm:h-8" />;
      case "cloudy":
        return <Cloud className="text-muted-foreground w-7 h-7 sm:w-8 sm:h-8" />;
      case "rain":
        return <CloudRain className="text-primary w-7 h-7 sm:w-8 sm:h-8" />;
      case "snow":
        return <Snowflake className="text-primary w-7 h-7 sm:w-8 sm:h-8" />;
      case "thunderstorm":
        return <CloudRain className="text-primary w-7 h-7 sm:w-8 sm:h-8" />;
      case "fog":
        return <Wind className="text-muted-foreground w-7 h-7 sm:w-8 sm:h-8" />;
      default:
        return <Wind className="text-muted-foreground w-7 h-7 sm:w-8 sm:h-8" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <CardTitle className="text-base sm:text-lg font-bold break-words">
            {location.timezone}
          </CardTitle>
        </div>
        <CardDescription className="col-span-2 text-xs sm:text-sm">
          Lat: {location.latitude}, Lon: {location.longitude}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="order-2 sm:order-1">
          <p className="text-sm text-muted-foreground">Temperature</p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {current.temperature}°C
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
        </div>
        <div className="order-1 sm:order-2 self-end sm:self-auto">
          {getWeatherIcon(current.condition)}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-6">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Sunrise:</span>
          <span className="font-semibold tracking-wide text-primary">{formattedSunrise}</span>
        </div>
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Sunset:</span>
          <span className="font-semibold tracking-wide text-primary">{formattedSunset}</span>
        </div>
      </CardFooter>
      {Array.isArray(week) && week.length > 0 && (
        <div className="px-4 sm:px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
            {week.map((d, i) => {
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  aria-pressed={isSelected}
                  className="group rounded-lg border p-3 grid grid-cols-[1fr_auto] items-center gap-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[selected=true]:bg-accent data-[selected=true]:ring-2 data-[selected=true]:ring-primary min-h-[84px] sm:min-h-[92px]"
                  data-selected={isSelected}
                >
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(d.date), "EEE, d MMM")}
                    </p>
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(d.condition)}
                      <p className="text-sm font-medium tabular-nums">
                        {Math.round(d.precipitationProbabilityMax ?? 0)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="rounded-xl border p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Selected day</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(selectedDay.date), "EEEE, d MMMM")}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground">High / Low</p>
                  <p className="text-lg sm:text-xl font-bold tabular-nums">
                    {Math.round(selectedDay.tempMax)}° / {Math.round(selectedDay.tempMin)}°
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Sunrise</span>
                  <span className="font-medium">
                    {safelyFormat(selectedDay.sunrise, "hh:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Moon className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Sunset</span>
                  <span className="font-medium">
                    {safelyFormat(selectedDay.sunset, "hh:mm a")}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium flex items-center gap-2 text-primary">
              {getWeatherIcon(selectedDay.condition)}
                Chance of precipitation: {Math.round(selectedDay.precipitationProbabilityMax ?? 0)}%
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

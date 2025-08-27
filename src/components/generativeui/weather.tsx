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
import type { WeatherAtLocation } from "@/types/weather";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function Weather({ location, current, today }: WeatherAtLocation) {
  const safelyFormat = (isoString: string | undefined, pattern: string): string => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, pattern);
  };

  const formattedSunrise = safelyFormat(today.sunrise, "hh:mm a");
  const formattedSunset = safelyFormat(today.sunset, "hh:mm a");
  const formattedTime = safelyFormat(current.time, "PPpp");

  // Simple condition → icon mapping
  const getWeatherIcon = (condition?: string) => {
    switch (condition) {
      case "clear":
        return <Sun className="text-primary w-8 h-8" />;
      case "cloudy":
        return <Cloud className="text-muted-foreground w-8 h-8" />;
      case "rain":
        return <CloudRain className="text-primary w-8 h-8" />;
      case "snow":
        return <Snowflake className="text-primary w-8 h-8" />;
      default:
        return <Wind className="text-muted-foreground w-8 h-8" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <CardTitle className="text-lg font-bold">
            {location.timezone}
          </CardTitle>
        </div>
        <CardDescription className="col-span-2">
          Lat: {location.latitude}, Lon: {location.longitude}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Temperature</p>
          <p className="text-4xl font-extrabold tracking-tight">
            {current.temperature}°C
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
        </div>
        {getWeatherIcon()}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
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
    </Card>
  );
}

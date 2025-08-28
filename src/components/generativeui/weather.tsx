"use client";

import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  CloudFog,
  CloudLightning,
  MapPin,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { WeatherAtLocation } from "@/types/weather";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Hoisted helpers to avoid re-creating on each render
const normalizeCondition = (raw?: string): string => {
  if (!raw) return "";
  const value = raw.toLowerCase();
  if (/(thunder|lightning|t-?storm|storm)/.test(value)) return "thunderstorm";
  if (/(rain|drizzle|shower|sprinkle)/.test(value)) return "rain";
  if (/(snow|sleet|flurries|blizzard)/.test(value)) return "snow";
  if (/(fog|mist|haze|smoke)/.test(value)) return "fog";
  if (/(wind|breeze|gust)/.test(value)) return "wind";
  if (/(cloud|overcast|partly|mostly)/.test(value)) return "cloudy";
  if (/(clear|sunny|bright)/.test(value)) return "clear";
  return "unknown";
};

const WeatherIcon = ({ condition, className, ariaHidden = false, focusable }: { condition?: string; className?: string; ariaHidden?: boolean; focusable?: boolean }) => {
  const c = normalizeCondition(condition);
  const base = className ?? "w-7 h-7 sm:w-8 sm:h-8";
  switch (c) {
    case "clear":
      return <Sun className={`text-primary ${base}`} aria-hidden={ariaHidden} focusable={focusable} aria-label={ariaHidden ? undefined : "Clear"} />;
    case "cloudy":
      return <Cloud className={`text-muted-foreground ${base}`} aria-hidden={ariaHidden} focusable={focusable} aria-label={ariaHidden ? undefined : "Cloudy"} />;
    case "rain":
      return <CloudRain className={`text-primary ${base}`} aria-hidden={ariaHidden} focusable={focusable} aria-label={ariaHidden ? undefined : "Rain"} />;
    case "snow":
      return <Snowflake className={`text-primary ${base}`} aria-hidden={ariaHidden} focusable={focusable} aria-label={ariaHidden ? undefined : "Snow"} />;
    case "thunderstorm":
      return <CloudLightning className={`text-primary ${base}`} aria-hidden={ariaHidden} focusable={focusable} aria-label={ariaHidden ? undefined : "Thunderstorm"} />;
    case "fog":
      return <CloudFog className={`text-muted-foreground ${base}`} aria-hidden={ariaHidden} focusable={focusable} aria-label={ariaHidden ? undefined : "Fog"} />;
    default:
      return <Cloud className={`text-muted-foreground ${base}`} aria-hidden={ariaHidden} focusable={focusable} aria-label={ariaHidden ? undefined : "Unknown"} />;
  }
};

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
  const [isClosing, setIsClosing] = useState(false);
  const selectedDay = useMemo(() =>
    selectedIndex != null && Array.isArray(week) ? week[selectedIndex] : undefined,
  [selectedIndex, week]);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedIndex(null);
      setIsClosing(false);
    }, 300); // Match the animation duration
  };

  

  // Close mobile modal with Escape for accessibility
  useEffect(() => {
    if (!selectedDay) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDay]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 sm:pb-6">
        <div className="flex items-center gap-2 min-w-0 w-full justify-between sm:justify-start">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-lg font-bold break-words leading-tight">
                {location.name || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
              </CardTitle>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {location.name ? `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°` : location.timezone}
            </div>
          </div>
          {/* Show condition icon next to timezone only on mobile */}
          <span className="sm:hidden inline-flex items-center shrink-0">
            <WeatherIcon condition={current.condition} ariaHidden={true} focusable={false} />
          </span>
        </div>
        <CardDescription className="text-xs sm:text-sm w-full sm:w-auto text-left sm:text-right">
          {location.name ? "Location Details" : "Coordinates"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-0">
        <div className="order-2 sm:order-1 w-full sm:w-auto">
          <p className="text-sm text-muted-foreground">Temperature</p>
          <p className="text-4xl sm:text-4xl font-extrabold tracking-tight">
            {current.temperature}°C
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
        </div>
        <div className="hidden sm:block order-1 sm:order-2 self-end sm:self-auto">
          <WeatherIcon condition={current.condition} ariaHidden={true} focusable={false} />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6 pt-3 sm:pt-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Sun className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm text-muted-foreground">Sunrise:</span>
          <span className="font-semibold tracking-wide text-primary ml-auto sm:ml-0">{formattedSunrise}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Moon className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm text-muted-foreground">Sunset:</span>
          <span className="font-semibold tracking-wide text-primary ml-auto sm:ml-0">{formattedSunset}</span>
        </div>
      </CardFooter>
      {Array.isArray(week) && week.length > 0 && (
        <div className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 auto-rows-fr">
            {week.map((d, i) => {
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    setIsClosing(false);
                    setSelectedIndex(i);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Forecast for ${safelyFormat(d.date, "EEEE, d MMMM")}, high ${Math.round(d.tempMax)}°, low ${Math.round(d.tempMin)}°`}
                  className="group rounded-lg border p-2 sm:p-3 grid grid-cols-[1fr_auto] items-center gap-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[selected=true]:bg-accent data-[selected=true]:ring-2 data-[selected=true]:ring-primary min-h-[76px] sm:min-h-[92px]"
                  data-selected={isSelected}
                >
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(d.date), "EEE, d MMM")}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="scale-75 sm:scale-100">
                        <WeatherIcon condition={d.condition} />
                      </div>
                      <p className="text-xs sm:text-sm font-medium tabular-nums">
                        {Math.round(d.precipitationProbabilityMax ?? 0)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold tabular-nums">
                      {Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop: show selected day below cards */}
          {selectedDay && (
            <div className="hidden sm:block rounded-xl border p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Selected day</p>
                  <p className="text-base sm:text-lg font-semibold">
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
              <div className="mt-2 text-xs sm:text-sm font-medium flex items-center gap-2 text-primary">
                <div className="scale-75 sm:scale-100">
                  <WeatherIcon condition={selectedDay.condition} />
                </div>
                <span>
                  Chance of precipitation: {Math.round(selectedDay.precipitationProbabilityMax ?? 0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile: Modal overlay for selected day */}
      {selectedDay && (
        <div 
          className={`sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={closeModal}
        >
          <div 
            className={`bg-background rounded-t-xl border w-full max-w-md max-h-[70vh] overflow-y-auto transition-transform duration-300 ease-out ${
              isClosing 
                ? 'translate-y-full' 
                : 'translate-y-0 animate-in slide-in-from-bottom-full duration-300'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="font-semibold text-lg">Weather Details</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-accent rounded-md"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedDay.date), "EEEE, d MMMM")}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <WeatherIcon condition={selectedDay.condition} />
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {Math.round(selectedDay.tempMax)}° / {Math.round(selectedDay.tempMin)}°
                    </p>
                    <p className="text-sm text-muted-foreground">High / Low</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center space-y-1">
                  <Sun className="h-5 w-5 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">Sunrise</p>
                  <p className="font-medium">
                    {safelyFormat(selectedDay.sunrise, "hh:mm a")}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <Moon className="h-5 w-5 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">Sunset</p>
                  <p className="font-medium">
                    {safelyFormat(selectedDay.sunset, "hh:mm a")}
                  </p>
                </div>
              </div>
              
              <div className="text-center pt-2 border-t">
                <p className="text-sm font-medium text-primary">
                  Chance of precipitation: {Math.round(selectedDay.precipitationProbabilityMax ?? 0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

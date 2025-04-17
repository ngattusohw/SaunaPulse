import { useTemperatureUnit } from "@/lib/temperatureUnit";
import { Button } from "@/components/ui/button";
import { Thermometer, ThermometerSnowflake } from "lucide-react";

export default function TemperatureUnitToggle() {
  const { unit, toggleUnit } = useTemperatureUnit();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleUnit}
      className="flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-100"
    >
      {unit === "celsius" ? (
        <>
          <Thermometer className="h-4 w-4" />
          <span>°C</span>
        </>
      ) : (
        <>
          <ThermometerSnowflake className="h-4 w-4" />
          <span>°F</span>
        </>
      )}
    </Button>
  );
}
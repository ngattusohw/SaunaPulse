import { useTemperatureUnit } from "@/lib/temperatureUnit.tsx";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Thermometer } from "lucide-react";

export default function TemperatureUnitToggle() {
  const { unit, toggleUnit } = useTemperatureUnit();

  return (
    <div className="flex items-center space-x-3">
      <Thermometer className="h-4 w-4 text-white" />
      <div className="flex items-center space-x-2">
        <Label 
          htmlFor="temp-unit" 
          className={`text-sm font-medium cursor-pointer ${unit === 'celsius' ? 'text-white' : 'text-gray-300'}`}
        >
          °C
        </Label>
        <Switch
          id="temp-unit"
          checked={unit === 'fahrenheit'}
          onCheckedChange={toggleUnit}
          className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/50"
        />
        <Label 
          htmlFor="temp-unit" 
          className={`text-sm font-medium cursor-pointer ${unit === 'fahrenheit' ? 'text-white' : 'text-gray-300'}`}
        >
          °F
        </Label>
      </div>
    </div>
  );
}
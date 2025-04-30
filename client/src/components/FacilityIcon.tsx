import { FiThermometer } from "react-icons/fi";
import { GiHotSurface, GiWaterDrop } from "react-icons/gi";
import { TbTemperature } from "react-icons/tb";
import { BsFlag } from "react-icons/bs";
import { FaSnowflake } from "react-icons/fa";
import { MdWaterDrop } from "react-icons/md";

interface FacilityIconProps {
  iconName: string;
  size?: number;
  className?: string;
}

export default function FacilityIcon({ iconName, size = 24, className = "" }: FacilityIconProps) {
  switch (iconName) {
    case "fi-fi":
      // Finnish sauna icon
      return <GiHotSurface size={size} className={className} />;
    
    case "us-flag":
      // American sauna icon
      return (
        <div className={`relative ${className}`}>
          <GiHotSurface size={size} />
          <BsFlag size={size/3} className="absolute -top-1 -right-1 text-red-600" />
        </div>
      );
    
    case "ice-cube":
      // Cold plunge icon
      return <FaSnowflake size={size} className={className} />;
      
    default:
      // Default thermometer icon
      return <FiThermometer size={size} className={className} />;
  }
}
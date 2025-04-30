import { FiThermometer } from "react-icons/fi";
import { GiSauna } from "react-icons/gi";
import { TbIceCream } from "react-icons/tb";
import { BsFlag } from "react-icons/bs";
import { FaSnowflake } from "react-icons/fa";

interface FacilityIconProps {
  iconName: string;
  size?: number;
  className?: string;
}

export default function FacilityIcon({ iconName, size = 24, className = "" }: FacilityIconProps) {
  switch (iconName) {
    case "fi-fi":
      // Finnish sauna icon
      return <SiSauna size={size} className={className} />;
    
    case "us-flag":
      // American sauna icon
      return (
        <div className={`relative ${className}`}>
          <SiSauna size={size} />
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
import { useState } from "react";
import { Link } from "wouter";
import { TreePine } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import TemperatureUnitToggle from "@/components/TemperatureUnitToggle";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  return (
    <header className="bg-[#1F6E6E] text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <TreePine className="w-6 h-6 mr-2" />
          <h1 className="text-xl md:text-2xl font-heading font-bold">Bear & Birch</h1>
        </div>
        
        {/* Temperature Unit Toggle */}
        <div className="hidden md:flex items-center ml-auto mr-8">
          <TemperatureUnitToggle />
        </div>
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            <li><Link href="/" className="hover:text-[#93C5FD] transition">Dashboard</Link></li>
            <li><a href="#" className="hover:text-[#93C5FD] transition">Analytics</a></li>
            <li><a href="#" className="hover:text-[#93C5FD] transition">Settings</a></li>
            <li><a href="#" className="hover:text-[#93C5FD] transition">Help</a></li>
          </ul>
        </nav>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1F6E6E] text-white">
            <div className="flex flex-col space-y-4 mt-8">
              <Link href="/" onClick={handleMenuItemClick} className="px-4 py-2 hover:bg-[#A67C52] rounded-md">Dashboard</Link>
              <a href="#" onClick={handleMenuItemClick} className="px-4 py-2 hover:bg-[#A67C52] rounded-md">Analytics</a>
              <a href="#" onClick={handleMenuItemClick} className="px-4 py-2 hover:bg-[#A67C52] rounded-md">Settings</a>
              <a href="#" onClick={handleMenuItemClick} className="px-4 py-2 hover:bg-[#A67C52] rounded-md">Help</a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

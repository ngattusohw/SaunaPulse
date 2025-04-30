import { TreePine } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1E293B] text-white py-8 mt-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center">
              <TreePine className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-heading font-bold">Bear & Birch</h2>
            </div>
            <p className="mt-2 text-slate-300 max-w-md">
              Providing premium sauna and wellness experiences with real-time temperature tracking for optimal comfort.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Facilities</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition">Saunas</a></li>
                <li><a href="#" className="hover:text-white transition">Steam Rooms</a></li>
                <li><a href="#" className="hover:text-white transition">Cold Plunge</a></li>
                <li><a href="#" className="hover:text-white transition">Relaxation Areas</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Hours</h3>
              <ul className="space-y-2 text-slate-300">
                <li>Monday - Friday: 6am - 10pm</li>
                <li>Saturday: 8am - 10pm</li>
                <li>Sunday: 8am - 8pm</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact</h3>
              <ul className="space-y-2 text-slate-300">
                <li>123 Wellness Way</li>
                <li>Seattle, WA 98101</li>
                <li>(555) 123-4567</li>
                <li>info@bearandbirch.com</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Bear & Birch Wellness. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

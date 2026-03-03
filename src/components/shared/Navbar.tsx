import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CarFront } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo with Emerald Icon */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-600 p-2 rounded-lg group-hover:bg-emerald-700 transition-colors">
            <CarFront className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            Kili<span className="text-emerald-600">Ride</span>
          </span>
        </Link>

        {/* Navigation Links from Document Brief */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Home</Link>
          <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">About</Link>
          <Link href="/services" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Services</Link>
          <Link href="/pricing" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Pricing</Link>
          <Link href="/contact" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Contact</Link>
        </div>

        {/* Auth Buttons matching Design Screenshot */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-slate-600 font-bold hover:bg-slate-50 px-6 rounded-xl">
            Login
          </Button>
          <Button className="bg-slate-900 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl transition-all shadow-sm">
            Sign Up
          </Button>
        </div>
      </div>
    </nav>
  );
}
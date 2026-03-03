import Link from "next/link";
import { Mail, Phone, MapPin, CarFront } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Brand Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <CarFront className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">KiliRide</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Premium car hire service for your coastal adventures. 
            Reliable, verified, and transparent.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-4 text-sm text-slate-600">
            {["About Us", "Services", "Pricing", "Terms of Service"].map((link) => (
              <li key={link}>
                <Link href="#" className="hover:text-emerald-600 transition-colors">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Section */}
        <div>
          <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Company</h4>
          <ul className="space-y-4 text-sm text-slate-600">
            {["Contact", "Privacy Policy", "Careers", "FAQ"].map((link) => (
              <li key={link}>
                <Link href="#" className="hover:text-emerald-600 transition-colors">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info (Matching your document details) */}
        <div>
          <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Contact</h4>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" /> 
              <span className="hover:text-emerald-600 cursor-pointer">0726063889</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" /> 
              <span className="hover:text-emerald-600 cursor-pointer">info@kiliride.com</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> 
              <span className="leading-tight">Kilifi Office, Bofa Rd</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-50 text-center">
        <p className="text-sm text-slate-400">
          © 2026 KiliRide. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
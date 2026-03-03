import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/lib/fleet";
import { Car, ShieldCheck } from "lucide-react";

export function CarCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white">
      {/* 1. Image Placeholder Area */}
      <div className="aspect-[16/9] bg-slate-100 relative flex items-center justify-center">
        <Car className="w-12 h-12 text-slate-300" />
        <div className="absolute top-3 right-3 flex gap-2">
          {vehicle.isVerified && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 flex gap-1 items-center border-none">
              <ShieldCheck className="w-3 h-3" /> Verified
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Car Details Section */}
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{vehicle.name}</h3>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{vehicle.plate}</p>
          </div>
          <Badge variant="outline" className="text-slate-500 border-slate-200">
            {vehicle.type}
          </Badge>
        </div>

        {/* 3. Pricing Display Logic */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Half Day</span>
            <span className="font-bold text-slate-900">KES {vehicle.baseHalfDay.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Full Day</span>
            <span className="font-bold text-emerald-600">KES {vehicle.baseFullDay.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>

      {/* 4. Action Button */}
      <CardFooter className="p-5 pt-0">
        <Button className="w-full bg-slate-900 hover:bg-emerald-700 text-white rounded-xl py-6 transition-colors font-semibold">
          Check Availability
        </Button>
      </CardFooter>
    </Card>
  );
}
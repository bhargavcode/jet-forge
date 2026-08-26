"use client";

import { Designer } from "@/components/designer/Designer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        <Designer />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

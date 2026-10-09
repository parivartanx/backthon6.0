import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AMR-Guard — Clinical Prescription Intelligence",
  description:
    "Antimicrobial resistance prescription auditing and clinical decision support for OPD healthcare professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased font-sans bg-[#F1F8FC] text-slate-900">
        <TooltipProvider delay={200}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
